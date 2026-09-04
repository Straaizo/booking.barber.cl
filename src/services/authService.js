import { supabase } from './supabaseClient'
import { ESTADO_ACTIVO, NOMBRE_ESTADO } from '../utils/estados'
import { HAY_BACKEND_REAL } from '../mocks/datosProvisoriosSuperadmin'

const MENSAJE_CREDENCIALES_INVALIDAS = 'Usuario o contraseña incorrectos.'
const MENSAJE_CONEXION = 'No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.'

// Un solo tipo de error con una propiedad `tipo`, para que la UI decida qué
// mensaje mostrar sin tener que inspeccionar el texto — 'credenciales' |
// 'conexion' | 'cuenta_inactiva' | 'desconocido'.
export class ErrorLogin extends Error {
  constructor(tipo, mensaje) {
    super(mensaje)
    this.name = 'ErrorLogin'
    this.tipo = tipo
  }
}

// Supabase-js hace las llamadas con fetch: una falla de red real (sin
// conexión, DNS, CORS bloqueado) llega distinto según el cliente. El de Auth
// lanza TypeError o AuthRetryableFetchError; postgrest-js (usado por .rpc()
// y .from()) en cambio la devuelve como error plano con el fetch original
// serializado en `message` (nunca instanceof TypeError) — sin este chequeo
// de texto, una falla de red en la RPC de login terminaba mostrando "Usuario
// o contraseña incorrectos" en vez del mensaje de conexión.
function esErrorDeRed(error) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  if (error instanceof TypeError || error?.name === 'AuthRetryableFetchError') return true
  return /failed to fetch|networkerror|load failed/i.test(error?.message ?? '')
}

// El login es por `usuario`, pero Supabase Auth solo sabe de email/password.
// El email técnico es siempre `{usuario}@usuarios.booking.barber.cl` (mismo
// patrón que `emailTecnicoPara()` en supabase/functions/gestionar-usuario —
// es el único código que lo genera, y nunca diverge de este formato) — se
// construye acá mismo, sin ninguna llamada al servidor. Antes existía una
// función RPC (`obtener_email_por_usuario`) para resolver esto, pero era
// callable de forma anónima y respondía distinto según si el usuario existía
// o no (un email real vs. `null`) — con nombres generados de forma
// predecible (inicial + apellido), eso era un enumerador de cuentas
// disponible para cualquiera con acceso directo a la API, sin pasar por el
// formulario. Construir el email acá elimina esa función entera: el único
// punto que puede decir "esto existe o no" pasa a ser `signInWithPassword`,
// que Supabase Auth ya responde de forma deliberadamente genérica.
function emailTecnicoDesdeUsuario(usuario) {
  return `${usuario.trim().toLowerCase()}@usuarios.booking.barber.cl`
}

export async function iniciarSesion({ usuario, password }) {
  const { error } = await supabase.auth.signInWithPassword({
    email: emailTecnicoDesdeUsuario(usuario),
    password,
  })
  if (error) {
    if (esErrorDeRed(error)) throw new ErrorLogin('conexion', MENSAJE_CONEXION)
    // No se distingue "usuario no existe" de "password incorrecta": evita que
    // alguien pueda usar el formulario para adivinar qué usuarios existen.
    throw new ErrorLogin('credenciales', MENSAJE_CREDENCIALES_INVALIDAS)
  }
}

// Login directo con Google — SOLO funciona para una cuenta que ya vinculó su
// Google antes con `vincularGoogle()` (ver ahí el motivo: sin ese paso previo,
// Supabase crea una identidad nueva sin fila en `usuarios`, y `obtenerPerfil`
// la rechaza como sesión inválida). `redirectTo` vuelve siempre a `/login`:
// esa pantalla ya redirige sola por rol en cuanto detecta sesión + perfil.
export async function iniciarSesionConGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/login` },
  })
  if (error) throw new ErrorLogin('desconocido', MENSAJE_CONEXION)
}

// Ata la cuenta de Google de quien YA tiene una sesión activa (usuario/
// contraseña) al mismo `auth.users.id` que ya tiene — a diferencia de un
// login con Google normal, esto no crea una identidad separada, así que
// `usuarios.id = auth.uid()` sigue funcionando para cualquiera de las dos
// formas de entrar después. Requiere "Allow manual linking" prendido en
// Supabase (Authentication → Providers → Email, más abajo del todo).
export async function vincularGoogle() {
  const { error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/panel` },
  })
  if (error) throw error
}

// A diferencia de `resetearPasswordUsuario` (usuariosService.js, para que un
// dueño/superadmin cambie la contraseña de OTRA cuenta vía Edge Function),
// esto cambia la contraseña de quien está autenticado ahora mismo — Supabase
// lo permite directo desde el cliente porque ya viene con una sesión válida,
// sin necesitar la `SERVICE_ROLE_KEY`.
export async function cambiarPasswordPropia(password) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

export async function cerrarSesion() {
  // En modo provisorio (ver AuthContext) no hay sesión real de Supabase que
  // cerrar — intentarlo solo tira un error de red contra la URL de ejemplo.
  if (!HAY_BACKEND_REAL) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function obtenerPerfil(authUserId) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, usuario, nombre, rol_id, barberia_id, barbero_id, barberias(estado_id)')
    .eq('id', authUserId)
    .single()

  if (error) throw error
  return data
}

// Si el usuario pertenece a una barbería (admin o barbero) y esa barbería no
// está activa, no tiene sentido dejarlo pasar al panel — se corta acá, antes
// de la redirección, con un mensaje específico según el estado real.
export function verificarBarberiaActiva(perfil) {
  if (!perfil.barberia_id) return null // superadmin no tiene barbería asociada
  const estadoId = perfil.barberias?.estado_id
  if (estadoId === ESTADO_ACTIVO) return null

  const nombreEstado = NOMBRE_ESTADO[estadoId] ?? 'inactiva'
  return new ErrorLogin(
    'cuenta_inactiva',
    `Tu barbería está ${nombreEstado.toLowerCase()} en este momento. Contacta al administrador de la plataforma para más información.`
  )
}
