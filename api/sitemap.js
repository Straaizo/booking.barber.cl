// Function: sitemap (runtime Node.js clásico — no 'edge')
// ============================================================================
// Genera sitemap.xml al momento consultando Supabase — no puede ser estático:
// las barberías se crean/suspenden/reactivan seguido, y listar una inactiva
// es peor que no listarla (Google indexaría una URL que redirige a la home).
//
// Runtime Node.js a propósito, no 'edge': esta función es DESTINO de un
// rewrite (`/sitemap.xml` -> `/api/sitemap` en vercel.json) — un rewrite
// hacia una Edge Function se pierde en silencio y cae al fallback de la SPA
// sin ningún error visible (mismo hallazgo que api/meta.js, ver
// BITACORA_PROYECTO.md). Con runtime Node, el rewrite sí la invoca — pero
// con la firma clásica de Vercel (`req, res`, no Request/Response web
// estándar).
import { listarSlugsActivos } from './_lib/supabase.js'
import { escaparHtml as escaparXml } from './_lib/texto.js'

const SITIO = 'https://bookingbarber.cl'

function entradaUrl({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${escaparXml(loc)}</loc>`,
    // Nunca se inventa una fecha: si no hay `updated_at` real, se omite el
    // `lastmod` de esa entrada entera antes que mentirle a Google sobre
    // cuándo se actualizó de verdad.
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n')
}

// `updated_at` de Supabase viene como timestamptz ISO completo
// ("2026-08-28T14:32:10.123Z") — el sitemap solo quiere la fecha (YYYY-MM-DD).
function soloFecha(timestamp) {
  if (!timestamp) return null
  const fecha = String(timestamp).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : null
}

function construirSitemap(barberias) {
  const entradas = [
    entradaUrl({ loc: `${SITIO}/`, lastmod: null, changefreq: 'weekly', priority: '1.0' }),
    ...barberias.map((b) =>
      entradaUrl({
        loc: `${SITIO}/${b.slug}`,
        lastmod: soloFecha(b.updated_at),
        changefreq: 'weekly',
        priority: '0.8',
      })
    ),
  ]

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entradas.join('\n') +
    '\n</urlset>\n'
  )
}

export default async function handler(req, res) {
  // `listarSlugsActivos()` nunca lanza (ver api/_lib/supabase.js) — si
  // Supabase falla o tarda más de su timeout, devuelve `[]` y acá se arma
  // igual un sitemap válido, solo que con nada más que la home.
  const barberias = await listarSlugsActivos()

  res.setHeader('content-type', 'application/xml; charset=utf-8')
  // Una barbería nueva no debería tardar más de un rato en aparecer acá, y
  // Google consulta esto seguido — ni sin caché ni por días.
  res.setHeader('cache-control', 'public, s-maxage=10800, stale-while-revalidate=21600')
  res.status(200).send(construirSitemap(barberias))
}
