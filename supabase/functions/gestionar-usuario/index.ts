// Edge Function: gestionar-usuario
// ============================================================================
// Crear una cuenta real (auth.users + fila en `usuarios`), cambiarle la
// contraseña, o borrarla — ninguna de las tres se puede hacer con una simple
// llamada desde el cliente porque requieren la clave de SERVICIO de Supabase
// (`SUPABASE_SERVICE_ROLE_KEY`), que nunca puede vivir en código de
// navegador. Esta función corre en el servidor de Supabase, no en el
// navegador — ahí sí es seguro usar esa clave.
//
// Quién puede llamarla (verificado acá adentro, no solo confiado):
//   - superadmin (rol_id = 1): cualquier acción, sobre cualquier barbería —
//     excepto `eliminar_cuenta` sobre su PROPIA cuenta, nunca permitido.
//   - dueño (rol_id = 2): solo `crear_barbero` / `resetear_password` /
//     `eliminar_cuenta` de un barbero DE SU PROPIA barbería — nunca de otra,
//     y nunca sobre otro dueño ni sobre sí mismo.
//
// Body esperado (JSON), según `accion`:
//   { accion: 'crear_dueno',    barberiaId, nombre, password }
//   { accion: 'crear_barbero',  barberiaId, barberoId, nombre, password }
//   { accion: 'resetear_password', usuarioId, password }
//   { accion: 'eliminar_cuenta',   usuarioId }
// El `usuario` (nombre de login) no lo manda el cliente: se genera acá mismo
// a partir de `nombre` (ver `generarUsuarioServidor`) — así la unicidad se
// resuelve contra la base real, no contra lo que el navegador cree que existe.
//
// Desplegar con: supabase functions deploy gestionar-usuario
// (requiere tener corrido antes supabase/sql/000_schema.sql en el proyecto).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Nunca `Access-Control-Allow-Origin: *` acá: esta función hace cambios
// reales (crea/borra cuentas), así que solo el propio dominio de la app
// (y localhost en desarrollo) puede completar la petición desde un
// navegador — cualquier otro origen se queda sin preflight y el POST nunca
// sale. Configurable por si el dominio cambia, sin tener que tocar código.
const ORIGENES_PERMITIDOS = (
  Deno.env.get('ORIGENES_PERMITIDOS') ?? 'https://booking.barber.cl,http://localhost:5173'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

function encabezadosCors(origenSolicitante: string | null) {
  const origenPermitido =
    origenSolicitante && ORIGENES_PERMITIDOS.includes(origenSolicitante) ? origenSolicitante : ORIGENES_PERMITIDOS[0]
  return {
    'Access-Control-Allow-Origin': origenPermitido,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

function jsonResponse(corsHeaders: Record<string, string>, cuerpo: unknown, estado = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Genera un email técnico único y estable a partir del usuario — Supabase
// Auth solo sabe de email/password, el login real de la app es por `usuario`
// (ver `emailTecnicoDesdeUsuario` en src/services/authService.js, que
// reconstruye este mismo patrón del lado del cliente para hacer login sin
// ninguna llamada al servidor). El dominio no necesita ser real: nunca se le
// manda correo a esta dirección.
function emailTecnicoPara(usuario: string) {
  return `${usuario}@usuarios.booking.barber.cl`
}

// Misma normalización que `src/utils/usuarios.js` (inicial del primer nombre
// + último apellido) — duplicada acá porque una Edge Function no puede
// importar código del proyecto React, corre en un runtime Deno aparte.
function normalizarNombre(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()
    .toLowerCase()
}

function usuarioBaseDesdeNombre(nombreCompleto: string) {
  const partes = normalizarNombre(nombreCompleto).split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return partes[0][0] + partes[partes.length - 1]
  return partes[0] || 'usuario'
}

// Genera un `usuario` libre a partir del nombre, revisando contra la tabla
// real (no contra lo que el cliente cree que existe) — le agrega un número
// al final (jriquelme2, jriquelme3...) hasta encontrar uno sin usar.
async function generarUsuarioServidor(
  clienteAdmin: ReturnType<typeof createClient>,
  nombreCompleto: string
) {
  const base = usuarioBaseDesdeNombre(nombreCompleto)
  const { data: existentes } = await clienteAdmin
    .from('usuarios')
    .select('usuario')
    .ilike('usuario', `${base}%`)
  const ocupados = new Set((existentes ?? []).map((fila: { usuario: string }) => fila.usuario.toLowerCase()))

  let usuario = base
  let sufijo = 2
  while (ocupados.has(usuario)) {
    usuario = `${base}${sufijo}`
    sufijo += 1
  }
  return usuario
}

Deno.serve(async (req) => {
  const corsHeaders = encabezadosCors(req.headers.get('Origin'))
  const responder = (cuerpo: unknown, estado = 200) => jsonResponse(corsHeaders, cuerpo, estado)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const clienteAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // El cliente que llama manda su propio JWT en el header Authorization —
    // se arma un segundo cliente (sin la clave de servicio) que actúa COMO
    // ese usuario, para poder preguntar quién es sin tener que confiar en
    // nada que venga en el body de la petición.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return responder({ error: 'Falta autenticación.' }, 401)
    }
    const clienteComoQuienLlama = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: datosUsuario, error: errorUsuario } = await clienteComoQuienLlama.auth.getUser()
    if (errorUsuario || !datosUsuario.user) {
      return responder({ error: 'Sesión inválida.' }, 401)
    }

    const { data: quienLlama, error: errorPerfil } = await clienteAdmin
      .from('usuarios')
      .select('rol_id, barberia_id')
      .eq('id', datosUsuario.user.id)
      .single()
    if (errorPerfil || !quienLlama) {
      return responder({ error: 'No pudimos resolver tu perfil.' }, 403)
    }

    const esSuperadmin = quienLlama.rol_id === 1
    const esDueno = quienLlama.rol_id === 2

    const body = await req.json()
    const { accion } = body

    // ------------------------------------------------------------------
    // crear_dueno — solo superadmin.
    // ------------------------------------------------------------------
    if (accion === 'crear_dueno') {
      if (!esSuperadmin) return responder({ error: 'No autorizado.' }, 403)
      const { barberiaId, nombre, password } = body
      const usuario = await generarUsuarioServidor(clienteAdmin, nombre)

      const { data: creado, error: errorCrear } = await clienteAdmin.auth.admin.createUser({
        email: emailTecnicoPara(usuario),
        password,
        email_confirm: true,
      })
      if (errorCrear) return responder({ error: errorCrear.message }, 400)

      const { error: errorFila } = await clienteAdmin.from('usuarios').insert({
        id: creado.user.id,
        usuario,
        email_tecnico: emailTecnicoPara(usuario),
        nombre,
        rol_id: 2,
        barberia_id: barberiaId,
        barbero_id: null,
      })
      if (errorFila) {
        // Si falla la fila de `usuarios`, no dejar una cuenta de Auth huérfana.
        await clienteAdmin.auth.admin.deleteUser(creado.user.id)
        return responder({ error: errorFila.message }, 400)
      }

      return responder({ usuarioId: creado.user.id, usuario })
    }

    // ------------------------------------------------------------------
    // crear_barbero — superadmin, o el dueño de esa misma barbería.
    // ------------------------------------------------------------------
    if (accion === 'crear_barbero') {
      const { barberiaId, barberoId, nombre, password } = body
      if (!esSuperadmin && !(esDueno && quienLlama.barberia_id === barberiaId)) {
        return responder({ error: 'No autorizado.' }, 403)
      }
      const usuario = await generarUsuarioServidor(clienteAdmin, nombre)

      const { data: creado, error: errorCrear } = await clienteAdmin.auth.admin.createUser({
        email: emailTecnicoPara(usuario),
        password,
        email_confirm: true,
      })
      if (errorCrear) return responder({ error: errorCrear.message }, 400)

      const { error: errorFila } = await clienteAdmin.from('usuarios').insert({
        id: creado.user.id,
        usuario,
        email_tecnico: emailTecnicoPara(usuario),
        nombre,
        rol_id: 3,
        barberia_id: barberiaId,
        barbero_id: barberoId,
      })
      if (errorFila) {
        await clienteAdmin.auth.admin.deleteUser(creado.user.id)
        return responder({ error: errorFila.message }, 400)
      }

      return responder({ usuarioId: creado.user.id, usuario })
    }

    // ------------------------------------------------------------------
    // resetear_password — superadmin sobre cualquiera; dueño solo sobre un
    // usuario de su propia barbería (nunca sobre sí mismo ni otro dueño).
    // ------------------------------------------------------------------
    if (accion === 'resetear_password') {
      const { usuarioId, password } = body

      if (!esSuperadmin) {
        const { data: objetivo } = await clienteAdmin
          .from('usuarios')
          .select('barberia_id, rol_id')
          .eq('id', usuarioId)
          .single()
        const puedeDueno =
          esDueno && objetivo?.rol_id === 3 && objetivo.barberia_id === quienLlama.barberia_id
        if (!puedeDueno) return responder({ error: 'No autorizado.' }, 403)
      }

      const { error } = await clienteAdmin.auth.admin.updateUserById(usuarioId, { password })
      if (error) return responder({ error: error.message }, 400)
      return responder({ ok: true })
    }

    // ------------------------------------------------------------------
    // eliminar_cuenta — mismas reglas que resetear_password.
    // ------------------------------------------------------------------
    if (accion === 'eliminar_cuenta') {
      const { usuarioId } = body

      // Un superadmin puede eliminar cualquier cuenta, pero no la SUYA
      // propia por acá — sin este chequeo, nada se lo impedía (a diferencia
      // del dueño, que ya estaba acotado a barberos de su propia barbería).
      // Borrarse a mitad de su propia sesión es un error de un clic, no una
      // operación legítima.
      if (esSuperadmin && usuarioId === datosUsuario.user.id) {
        return responder({ error: 'No puedes eliminar tu propia cuenta desde acá.' }, 403)
      }

      if (!esSuperadmin) {
        const { data: objetivo } = await clienteAdmin
          .from('usuarios')
          .select('barberia_id, rol_id')
          .eq('id', usuarioId)
          .single()
        const puedeDueno =
          esDueno && objetivo?.rol_id === 3 && objetivo.barberia_id === quienLlama.barberia_id
        if (!puedeDueno) return responder({ error: 'No autorizado.' }, 403)
      }

      // Borra la cuenta de Auth — la fila de `usuarios` se va sola por el
      // `on delete cascade` de `usuarios.id -> auth.users.id` (000_schema.sql).
      const { error } = await clienteAdmin.auth.admin.deleteUser(usuarioId)
      if (error) return responder({ error: error.message }, 400)
      return responder({ ok: true })
    }

    return responder({ error: 'Acción no reconocida: ' + accion }, 400)
  } catch (error) {
    return responder({ error: error instanceof Error ? error.message : 'Error inesperado.' }, 500)
  }
})
