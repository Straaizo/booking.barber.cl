import { supabase } from './supabaseClient'

const MENSAJE_CREDENCIALES_INVALIDAS = 'Usuario o contraseña incorrectos.'

// El login es por `usuario`, pero Supabase Auth solo sabe de email/password.
// `obtener_email_por_usuario` es una función RPC (security definer) que expone
// únicamente el email técnico correspondiente a un usuario — nunca se lee la
// tabla `usuarios` completa desde un cliente sin sesión. Ver supabase/sql/.
async function resolverEmailPorUsuario(usuario) {
  const { data, error } = await supabase.rpc('obtener_email_por_usuario', {
    p_usuario: usuario,
  })
  if (error) throw error
  return data
}

export async function iniciarSesion({ usuario, password }) {
  const emailTecnico = await resolverEmailPorUsuario(usuario)
  if (!emailTecnico) {
    throw new Error(MENSAJE_CREDENCIALES_INVALIDAS)
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: emailTecnico,
    password,
  })
  // No se distingue "usuario no existe" de "password incorrecta": evita que
  // alguien pueda usar el formulario para adivinar qué usuarios existen.
  if (error) throw new Error(MENSAJE_CREDENCIALES_INVALIDAS)
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function obtenerPerfil(authUserId) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, usuario, nombre, rol_id, barberia_id, barbero_id')
    .eq('id', authUserId)
    .single()

  if (error) throw error
  return data
}
