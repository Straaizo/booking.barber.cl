import { supabase } from './supabaseClient'

// Verificación en dos pasos (TOTP — Google Authenticator, Microsoft
// Authenticator, Authy, cualquiera sirve: es un estándar, no algo propio de
// una app en particular) — solo para superadmin, ver SeccionAutenticacionDosPasos
// (panel/cuenta) y RutaProtegida (el filtro que exige el código en cada
// sesión antes de dejar pasar al panel).
//
// El QR que arma Supabase identifica la cuenta con su email REAL en Auth —
// que en esta app siempre es el técnico sintético (`{usuario}@usuarios...`,
// ver authService.js), nunca el email personal de quien entra — por eso se
// manda un `issuer` explícito al inscribir: así al menos el título que
// muestra la app de autenticación es reconocible ("Booking Barber"), aunque
// el subtítulo siga mostrando ese correo técnico (no hay forma de cambiar
// eso desde el cliente — lo arma Supabase a partir de auth.users.email).
const ISSUER = 'Booking Barber'

// Todos los factores TOTP de la cuenta, cualquier estado — a diferencia de
// filtrar solo los verificados, esto deja ver también uno que quedó a medio
// inscribir (se le dio "Activar" pero nunca se confirmó con un código, por
// ejemplo si se cerró la pestaña a mitad de camino) para poder limpiarlo,
// en vez de quedar invisible y sumando al límite de factores de la cuenta.
export async function listarFactoresTotp() {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error
  return data.all.filter((f) => f.factor_type === 'totp')
}

// El primer factor VERIFICADO — alcanza cualquiera de ellos para resolver el
// desafío de login (RutaProtegida/DesafioMFA no necesitan elegir cuál).
export async function primerFactorVerificado() {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error
  return data.totp[0] ?? null
}

// Nivel de la sesión ACTUAL — 'aal1' (solo contraseña) vs 'aal2' (contraseña
// + segundo factor ya verificado en esta sesión). `nextLevel` distinto de
// `currentLevel` es la señal de "hay un factor activo y todavía no se pasó
// por él en esta sesión" — la usa RutaProtegida para decidir si exige el
// código antes de dejar entrar al panel.
export async function nivelDeSesion() {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) throw error
  return data
}

// Arranca la inscripción: crea un factor SIN VERIFICAR todavía (no cuenta
// como activo hasta confirmarlo con un código real, ver confirmarCodigo) y
// devuelve el QR + secreto para escanear con la app de autenticación.
export async function empezarInscripcion() {
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: ISSUER })
  if (error) throw error
  return data
}

// Confirma una inscripción nueva, o resuelve el desafío al entrar con una
// cuenta que ya tiene el factor activo — mismo par challenge+verify en los
// dos casos, por eso una sola función para ambos.
export async function confirmarCodigo(factorId, codigo) {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: codigo })
  if (error) throw error
}

// Desactiva un factor puntual — sea uno a medio inscribir (se cancela sin
// confirmar) o uno ya activo (si era el único, la cuenta vuelve a depender
// solo de la contraseña).
export async function desactivarFactor(factorId) {
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) throw error
}
