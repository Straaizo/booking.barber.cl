import { supabase } from './supabaseClient'
import { ESTADO_ACTIVO, NOMBRE_ESTADO } from '../utils/estados'

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
// `obtener_email_por_usuario` es una función RPC (security definer) que expone
// únicamente el email técnico correspondiente a un usuario — nunca se lee la
// tabla `usuarios` completa desde un cliente sin sesión. Ver supabase/sql/.
async function resolverEmailPorUsuario(usuario) {
  const { data, error } = await supabase.rpc('obtener_email_por_usuario', {
    p_usuario: usuario,
  })
  if (error) {
    if (esErrorDeRed(error)) throw new ErrorLogin('conexion', MENSAJE_CONEXION)
    throw new ErrorLogin('credenciales', MENSAJE_CREDENCIALES_INVALIDAS)
  }
  return data
}

export async function iniciarSesion({ usuario, password }) {
  const emailTecnico = await resolverEmailPorUsuario(usuario)
  if (!emailTecnico) {
    throw new ErrorLogin('credenciales', MENSAJE_CREDENCIALES_INVALIDAS)
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: emailTecnico,
    password,
  })
  if (error) {
    if (esErrorDeRed(error)) throw new ErrorLogin('conexion', MENSAJE_CONEXION)
    // No se distingue "usuario no existe" de "password incorrecta": evita que
    // alguien pueda usar el formulario para adivinar qué usuarios existen.
    throw new ErrorLogin('credenciales', MENSAJE_CREDENCIALES_INVALIDAS)
  }
}

export async function cerrarSesion() {
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
