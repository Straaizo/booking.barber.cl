// Edge Function: meta
// ============================================================================
// El proyecto es una SPA de Vite: el mismo index.html se sirve para todas
// las rutas, y los rastreadores de WhatsApp/Facebook/Telegram/Twitter NO
// ejecutan JavaScript — cualquier <meta> que React ponga en el cliente les
// es invisible. Por eso esta función devuelve HTML mínimo con las etiquetas
// correctas ya adentro, servida SOLO a esos rastreadores (ver el `has` de
// User-Agent en vercel.json — un navegador real nunca llega hasta acá).
//
// Puente por la limitación de SPA de Vite — ver BITACORA_PROYECTO.md: migrar
// a Next.js resolvería esto de forma nativa (junto con SEO real y
// middleware de redirección de barberías inactivas).
//
// Deliberadamente NO reemplaza el filtro de vercel.json: aunque el ruteo ya
// solo manda acá a User-Agents conocidos, esta función vuelve a chequear
// por las suyas y, si por lo que sea el User-Agent no matchea ningún
// rastreador conocido, sirve la SPA real en vez de este HTML mínimo — nunca
// al revés (un navegador real viendo esto sería una página en blanco).
//
// EXCEPCIÓN: la home ("/") nunca llega hasta acá — Vercel sirve el
// `index.html` estático directo desde su CDN para esa ruta exacta, antes de
// evaluar cualquier rewrite (comprobado en vivo, ni con `has` de por medio).
// No es un problema porque el home no tiene contenido dinámico: sus
// etiquetas están fijas y duplicadas a mano en index.html, IDÉNTICAS a
// `metaGenerico()` acá abajo — si se cambia una, hay que cambiar la otra.
import { buscarBarberiaPorSlug } from './_lib/supabase.js'
import { clasificarRuta } from './_lib/rutas.js'
import { escaparHtml, truncar } from './_lib/texto.js'
import { BARBERIA_DEMO } from './_lib/demo.js'

// Runtime Node.js (no 'edge'): un rewrite de vercel.json hacia una Edge
// Function se pierde en silencio y cae al fallback de la SPA sin ningún
// error visible — comprobado en vivo (ver BITACORA_PROYECTO.md). Con
// runtime Node, el mismo rewrite sí invoca la función — pero con la firma
// clásica de Vercel (`req, res` al estilo Node, no `Request`/`Response` web
// estándar): `req.headers` es un objeto plano, no un `Headers` con `.get()`.

const RASTREADORES =
  /facebookexternalhit|Facebot|WhatsApp|Twitterbot|LinkedInBot|TelegramBot|Slackbot|Discordbot|Pinterest|Googlebot|Bingbot|Applebot|SkypeUriPreview|vkShare|redditbot/i

const SITIO = 'bookingbarber.cl'
const TITULO_HOME = 'Booking Barber — Reservas online para tu barbería'
const DESCRIPCION_HOME =
  'Tu propia página, tus servicios, tus horarios, tus barberos — todo en un solo lugar. Sin apps que instalar.'

function metaGenerico(origen, noindex) {
  return {
    titulo: TITULO_HOME,
    descripcion: DESCRIPCION_HOME,
    url: `${origen}/`,
    imagen: `${origen}/api/og`,
    alt: 'Booking Barber — Reservas online para barberías chilenas',
    noindex,
  }
}

function descripcionDesdeDatos(datos) {
  if (datos.eslogan) return datos.eslogan
  return `Reserva tu hora en ${datos.nombre}${datos.direccion ? `, ${datos.direccion}` : ''} — agenda simple, sin WhatsApp.`
}

function metaBarberia(origen, slug, datos) {
  return {
    titulo: truncar(`${datos.nombre} — Reserva tu hora online`, 60),
    descripcion: truncar(descripcionDesdeDatos(datos), 155),
    url: `${origen}/${slug}`,
    imagen: `${origen}/api/og?slug=${encodeURIComponent(slug)}`,
    alt: `${datos.nombre} — Booking Barber`,
    noindex: false,
  }
}

function construirHtml({ titulo, descripcion, url, imagen, alt, noindex }) {
  const t = escaparHtml(titulo)
  const d = escaparHtml(descripcion)
  const u = escaparHtml(url)
  const img = escaparHtml(imagen)
  const a = escaparHtml(alt)

  return `<!doctype html>
<html lang="es-CL">
<head>
<meta charset="UTF-8">
<title>${t}</title>
<meta name="description" content="${d}">
<link rel="canonical" href="${u}">
${noindex ? '<meta name="robots" content="noindex, nofollow">' : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITIO}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${u}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${a}">
<meta property="og:locale" content="es_CL">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${img}">
<meta name="theme-color" content="#1c1b19">
</head>
<body></body>
</html>`
}

export default async function handler(req, res) {
  const host = req.headers.host
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const origen = `${proto}://${host}`
  const userAgent = req.headers['user-agent'] || ''
  const pathSolicitado = req.query.path || '/'

  // Defensa además del filtro de vercel.json, no en su lugar (ver comentario
  // de arriba) — nunca servir este HTML a algo que no matcheó como bot.
  if (!RASTREADORES.test(userAgent)) {
    try {
      const spa = await fetch(new URL('/index.html', origen))
      const texto = await spa.text()
      res.status(spa.status).setHeader('content-type', 'text/html; charset=utf-8')
      return res.send(texto)
    } catch {
      res.statusCode = 302
      res.setHeader('location', `${origen}/`)
      return res.end()
    }
  }

  const ruta = clasificarRuta(pathSolicitado)
  let meta

  if (ruta.tipo === 'demo') {
    meta = metaBarberia(origen, 'demo', BARBERIA_DEMO)
  } else if (ruta.tipo === 'barberia') {
    const datos = await buscarBarberiaPorSlug(ruta.slug)
    meta = datos ? metaBarberia(origen, ruta.slug, datos) : metaGenerico(origen, false)
  } else if (ruta.tipo === 'privado' || ruta.tipo === 'no-encontrado') {
    meta = metaGenerico(origen, true)
  } else {
    meta = metaGenerico(origen, false)
  }

  res.setHeader('content-type', 'text/html; charset=utf-8')
  // Horas, no días — si el dueño cambia nombre/eslogan/logo, la
  // previsualización se pone al día en un plazo razonable. Los
  // rastreadores igual cachean por su cuenta encima de esto.
  res.setHeader('cache-control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  return res.status(200).send(construirHtml(meta))
}
