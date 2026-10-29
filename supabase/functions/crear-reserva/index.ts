// Edge Function: crear-reserva
//
// Única puerta para crear una reserva desde la página pública. Valida el
// captcha (Cloudflare Turnstile) y recién ahí inserta — la tabla `reservas`
// ya no acepta inserts directos de anon/authenticated, así que un bot no
// puede saltarse el captcha llamando a la API de Supabase por su cuenta.
//
// Inserta con la clave de servicio, pero solo las columnas que llena el
// formulario: precio, duración, fin, estado y token los siguen calculando
// los triggers de la base, y todas las validaciones (horario, solape,
// enfriamiento por teléfono, freno por barbería) corren igual que antes.
//
// Secretos requeridos (supabase secrets set ...):
//   TURNSTILE_SECRET_KEY — "Secret Key" del widget en Cloudflare Turnstile.
//   ORIGENES_PERMITIDOS (opcional) — mismo formato que gestionar-usuario.
//
// Desplegar con: supabase functions deploy crear-reserva --no-verify-jwt
// (la llama un visitante sin sesión; la autenticación es el captcha).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ORIGENES_PERMITIDOS = (
  Deno.env.get('ORIGENES_PERMITIDOS') ??
    'https://bookingbarber.cl,http://localhost:5173'
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

const ERROR_GENERICO = 'No pudimos confirmar tu reserva. Intenta nuevamente.'

async function captchaValido(token: string, ip: string | null) {
  const datos = new FormData()
  datos.append('secret', Deno.env.get('TURNSTILE_SECRET_KEY') ?? '')
  datos.append('response', token)
  if (ip) datos.append('remoteip', ip)
  try {
    const respuesta = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: datos,
    })
    const resultado = await respuesta.json()
    return resultado.success === true
  } catch {
    return false
  }
}

const esEntero = (valor: unknown) => Number.isInteger(valor) && (valor as number) > 0
const esTexto = (valor: unknown, max: number) => typeof valor === 'string' && valor.length > 0 && valor.length <= max

Deno.serve(async (req) => {
  const corsHeaders = encabezadosCors(req.headers.get('Origin'))
  const responder = (cuerpo: unknown, estado = 200) =>
    new Response(JSON.stringify(cuerpo), {
      status: estado,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return responder({ error: ERROR_GENERICO }, 405)
  }

  try {
    const body = await req.json()
    const { barberia_id, barbero_id, servicio_id, fecha_hora, cliente_nombre, cliente_telefono, captcha } = body ?? {}

    if (
      !esEntero(barberia_id) ||
      !esEntero(barbero_id) ||
      !esEntero(servicio_id) ||
      !esTexto(fecha_hora, 40) ||
      Number.isNaN(Date.parse(fecha_hora)) ||
      !esTexto(cliente_nombre, 80) ||
      !esTexto(cliente_telefono, 20) ||
      !esTexto(captcha, 4096)
    ) {
      return responder({ error: ERROR_GENERICO }, 400)
    }

    const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null
    if (!(await captchaValido(captcha, ip))) {
      return responder(
        { error: 'No pudimos verificar que no eres un robot. Intenta nuevamente.', code: 'P0001' },
        400
      )
    }

    const clienteAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Lo que antes exigía la policy `reservas_insert_publico` (la clave de
    // servicio se salta RLS): solo barberías activas reciben reservas.
    const { data: barberia } = await clienteAdmin
      .from('barberias')
      .select('estado_id')
      .eq('id', barberia_id)
      .maybeSingle()
    if (barberia?.estado_id !== 1) {
      return responder({ error: ERROR_GENERICO }, 400)
    }

    const { error } = await clienteAdmin.from('reservas').insert({
      barberia_id,
      barbero_id,
      servicio_id,
      fecha_hora,
      cliente_nombre,
      cliente_telefono,
      estado: 'confirmada',
    })
    if (error) {
      // P0001 = validaciones de negocio, con mensaje en español para el
      // cliente; cualquier otro error se responde genérico.
      return responder(
        error.code === 'P0001' ? { error: error.message, code: 'P0001' } : { error: ERROR_GENERICO },
        400
      )
    }

    return responder({ ok: true })
  } catch {
    return responder({ error: ERROR_GENERICO }, 500)
  }
})
