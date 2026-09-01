// Mismas palabras reservadas que la constraint `barberias_slug_no_reservado`
// (supabase/migrations/20260819120000_schema.sql) — ninguna barbería real
// puede tener uno de estos slugs, así que si la ruta pedida es una de estas
// (y no es exactamente 'demo', que tiene su propio caso), nunca hace falta
// ni consultar la base para saber que no es una barbería.
const PALABRAS_RESERVADAS = new Set([
  'nuevo', 'nueva', 'crear', 'editar', 'buscar', 'listado',
  'admin', 'login', 'panel', 'api', 'app', 'www', 'auth',
  'demo', 'assets', 'static', 'public', '404', 'health',
  '_preview-barberia',
])

// Clasifica la ruta pedida calcando las prioridades reales del router
// (src/routes/AppRouter.jsx): rutas fijas primero, y todo lo que no es una
// palabra reservada se trata como un posible slug de barbería EN LA RAÍZ
// (`/:slug`) — no bajo `/barberias/:slug` (ese prefijo ya no es donde vive
// la página pública, solo redirige ahí para links viejos ya compartidos;
// ver `RedirigirBarberiaSinPrefijo` en el router real). Por eso acá también
// se acepta `/barberias/:slug` como alias del mismo caso "barbería".
export function clasificarRuta(pathname) {
  const limpio = decodeURIComponent(pathname || '/').replace(/^\/+|\/+$/g, '')
  const segmentos = limpio ? limpio.split('/') : []

  if (segmentos.length === 0) return { tipo: 'home' }

  const [primero, segundo] = segmentos

  if (primero === 'demo' && segmentos.length === 1) {
    return { tipo: 'demo' }
  }

  if (primero === 'barberias' && segmentos.length === 2 && segundo) {
    return { tipo: 'barberia', slug: segundo.toLowerCase() }
  }

  if (primero === 'panel') return { tipo: 'privado' }
  if (segmentos.length === 1 && (primero === 'login' || primero === 'admin' || primero === '_preview-barberia')) {
    return { tipo: 'privado' }
  }

  if (segmentos.length === 1 && !PALABRAS_RESERVADAS.has(primero)) {
    return { tipo: 'barberia', slug: primero.toLowerCase() }
  }

  return { tipo: 'no-encontrado' }
}
