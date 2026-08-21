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

// La página pública de cada barbería vive en la raíz (`/:slug`, ver
// AppRouter.jsx) — así que cualquiera de estas palabras, si se usara como
// slug, competiría con una ruta real de la app. React Router ya prioriza las
// rutas fijas sobre las dinámicas (nadie podría "robarse" `/login` con una
// barbería), pero esa barbería quedaría con una página pública inalcanzable
// para siempre — mejor avisarlo antes de crearla que dejarla huérfana.
const SLUGS_RESERVADOS = new Set(['login', 'demo', 'panel', 'admin', '_preview-barberia'])

export function esSlugReservado(slug) {
  return SLUGS_RESERVADOS.has(slug)
}
