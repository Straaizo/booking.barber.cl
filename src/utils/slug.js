const RANGO_DIACRITICOS = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g')

export function generarSlug(texto) {
  return texto
    .normalize('NFD')
    .replace(RANGO_DIACRITICOS, '') // quita tildes (marcas diacríticas tras NFD)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
