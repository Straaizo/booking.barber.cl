// Edge Function: og
// ============================================================================
// Genera la imagen de previsualización (1200x630) con @vercel/og — sin slug,
// la genérica de la plataforma; con `?slug=`, la de esa barbería (su logo +
// nombre). Reutiliza los tokens de color/tipografía reales del proyecto
// (src/index.css) en vez de definir una paleta aparte para esta imagen.
//
// Runtime 'edge' acá SÍ, a diferencia de api/meta.js: esta función nunca es
// destino de un rewrite (el `og:image` de los metadatos apunta a su URL
// directa, /api/og, que cualquiera pide tal cual) — el problema de rewrites
// con Edge Functions no aplica. Además `@vercel/og` lo necesita de verdad:
// probado en runtime Node, su WASM (resvg) falla al cargar
// (`ERR_MODULE_NOT_FOUND` sobre un paquete interno 'wbg') — ver
// BITACORA_PROYECTO.md.
//
// SIN JSX a propósito, aunque `@vercel/og` normalmente se usa con JSX: un
// archivo `.jsx` bajo /api NO se reconoce como función (Vercel lo ignora en
// silencio, sin error — mismo hallazgo, ver BITACORA_PROYECTO.md). JSX no es
// más que azúcar sintáctico sobre `{ type, props }` — `h()` de acá abajo
// arma exactamente ese mismo árbol a mano, sin depender de que ningún paso
// de build transpile este archivo.
import { ImageResponse } from '@vercel/og'
import { buscarBarberiaPorSlug } from './_lib/supabase.js'
import { BARBERIA_DEMO } from './_lib/demo.js'
import { quitarEmojis } from './_lib/texto.js'

export const config = { runtime: 'edge' }

const ANCHO = 1200
const ALTO = 630

const COLOR_FONDO = '#1c1b19' // --color-negro-barbero
const COLOR_TEXTO = '#f3eee3' // --color-hueso
const COLOR_ACENTO = '#dd9569' // --color-cobre-claro (texto cobre sobre fondo oscuro)
const COLOR_MARCA = '#8b847a' // --color-gris-calido-400
const COLOR_PUNTO = '#a85c32' // --color-cobre

function h(type, props, ...children) {
  return { type, props: { ...props, children: children.length <= 1 ? children[0] : children } }
}

function tamanoNombre(nombre) {
  if (nombre.length <= 20) return 84
  if (nombre.length <= 32) return 64
  if (nombre.length <= 46) return 50
  return 38
}

function marca() {
  return h(
    'div',
    { style: { display: 'flex', alignItems: 'center', gap: 10 } },
    h('div', { style: { display: 'flex', width: 8, height: 8, borderRadius: 999, background: COLOR_PUNTO } }),
    h(
      'div',
      { style: { display: 'flex', fontSize: 22, letterSpacing: 3, textTransform: 'uppercase', color: COLOR_MARCA } },
      'bookingbarber.cl'
    )
  )
}

function lienzo({ nombre, descripcion, logoUrl }) {
  const hijosFila = []

  if (logoUrl) {
    hijosFila.push(
      h(
        'div',
        {
          style: {
            display: 'flex',
            width: 140,
            height: 140,
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 20,
            background: COLOR_TEXTO,
            overflow: 'hidden',
          },
        },
        h('img', { src: logoUrl, width: 140, height: 140, style: { objectFit: 'contain' } })
      )
    )
  }

  const anchoColumna = logoUrl ? 860 : 1000

  const hijosTexto = [
    h(
      'div',
      {
        style: {
          display: 'flex',
          width: '100%',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: tamanoNombre(nombre),
          fontWeight: 600,
          lineHeight: 1.15,
          color: COLOR_TEXTO,
        },
      },
      nombre
    ),
  ]
  if (descripcion) {
    hijosTexto.push(
      h(
        'div',
        {
          style: {
            display: 'flex',
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: 22,
            fontSize: 30,
            fontWeight: 400,
            color: COLOR_ACENTO,
          },
        },
        descripcion
      )
    )
  }
  hijosFila.push(
    h('div', { style: { display: 'flex', flexDirection: 'column', width: anchoColumna } }, ...hijosTexto)
  )

  return h(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '72px',
        background: COLOR_FONDO,
        fontFamily: 'Fraunces',
      },
    },
    h('div', { style: { display: 'flex', width: '100%', alignItems: 'center', gap: 32 } }, ...hijosFila),
    marca()
  )
}

async function cargarFuentes() {
  const [regular, semibold] = await Promise.all([
    fetch(new URL('./_lib/fonts/Fraunces-Regular.ttf', import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL('./_lib/fonts/Fraunces-SemiBold.ttf', import.meta.url)).then((r) => r.arrayBuffer()),
  ])
  return [
    { name: 'Fraunces', data: regular, weight: 400, style: 'normal' },
    { name: 'Fraunces', data: semibold, weight: 600, style: 'normal' },
  ]
}

export default async function handler(request) {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug')

  let nombre = 'Booking Barber'
  let descripcion = 'Reservas online para barberías chilenas'
  let logoUrl = null

  if (slug === 'demo') {
    nombre = BARBERIA_DEMO.nombre
    descripcion = BARBERIA_DEMO.eslogan
  } else if (slug) {
    const datos = await buscarBarberiaPorSlug(slug)
    if (datos) {
      nombre = datos.nombre
      descripcion = datos.eslogan || datos.direccion || 'Reserva tu hora online'
      logoUrl = datos.logo_url
    } else {
      // Un `slug` que no existe (o una barbería inactiva) no debe forzar un
      // render completo (fuente + WASM) por cada valor distinto que alguien
      // pruebe — eso es una forma barata de hacer gastar cómputo sin límite
      // variando el slug en la URL. Redirige a la imagen genérica, que sí
      // converge en una sola URL cacheada fuerte.
      return Response.redirect(`${url.origin}/api/og`, 302)
    }
  }

  nombre = quitarEmojis(nombre) || 'Booking Barber'
  descripcion = quitarEmojis(descripcion)

  const fonts = await cargarFuentes()
  const cabeceras = {
    // Horas, no días: si el dueño cambia su logo o nombre, la
    // previsualización se pone al día en un plazo razonable.
    'cache-control': 'public, s-maxage=10800, stale-while-revalidate=86400',
  }

  try {
    return new ImageResponse(lienzo({ nombre, descripcion, logoUrl }), {
      width: ANCHO,
      height: ALTO,
      fonts,
      headers: cabeceras,
    })
  } catch {
    // El logo puede ser una URL rota, un formato que Satori no soporta, o no
    // cargar a tiempo — nunca dejar caer la imagen entera por eso: se
    // reintenta sin logo, solo tipografía.
    return new ImageResponse(lienzo({ nombre, descripcion, logoUrl: null }), {
      width: ANCHO,
      height: ALTO,
      fonts,
      headers: cabeceras,
    })
  }
}
