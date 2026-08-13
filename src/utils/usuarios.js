const RANGO_DIACRITICOS = new RegExp('[̀-ͯ]', 'g')

function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(RANGO_DIACRITICOS, '') // quita tildes (NFD separa la tilde como marca combinante)
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()
    .toLowerCase()
}

// "Juan Riquelme" -> "jriquelme" (inicial del primer nombre + último
// apellido). Si el usuario generado ya existe, se le agrega un número al
// final (jriquelme2, jriquelme3...) hasta encontrar uno libre.
export function generarUsuarioDesdeNombre(nombreCompleto, usuariosExistentes = []) {
  const partes = normalizar(nombreCompleto).split(/\s+/).filter(Boolean)
  const base = partes.length >= 2 ? partes[0][0] + partes[partes.length - 1] : partes[0] || 'barbero'
  const existentes = new Set(usuariosExistentes.map((u) => u.toLowerCase()))

  let usuario = base
  let sufijo = 2
  while (existentes.has(usuario)) {
    usuario = `${base}${sufijo}`
    sufijo += 1
  }
  return usuario
}
