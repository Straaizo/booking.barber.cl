import { motion } from 'framer-motion'
import { EASE_ENTRADA, DURACION_LENTA, STAGGER_TEXTO } from './easing'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

const contenedor = {
  oculto: {},
  visible: { transition: { staggerChildren: STAGGER_TEXTO } },
}

const palabra = {
  oculto: { y: '110%' },
  visible: { y: '0%', transition: { duration: DURACION_LENTA, ease: EASE_ENTRADA } },
}

// Divide el texto en palabras, marcando como itálica cualquier segmento entre
// *asteriscos* — permite mezclar romana/itálica en el mismo titular sin tener
// que armar el JSX a mano cada vez.
function tokenizar(texto) {
  const segmentos = texto.split(/(\*[^*]+\*)/g).filter(Boolean)
  const palabras = []

  for (const segmento of segmentos) {
    const esItalica = segmento.startsWith('*') && segmento.endsWith('*')
    const contenido = esItalica ? segmento.slice(1, -1) : segmento
    contenido.split(' ').forEach((texto) => {
      if (texto) palabras.push({ texto, esItalica })
    })
  }
  return palabras
}

function renderPalabras(palabras) {
  return palabras.map(({ texto: palabraTexto, esItalica }, indice) => (
    <span key={indice}>
      <span className="inline-block overflow-hidden pb-1 align-top">
        <motion.span
          variants={palabra}
          className={`inline-block ${esItalica ? 'font-display italic' : ''}`}
        >
          {palabraTexto}
        </motion.span>
      </span>
      {indice < palabras.length - 1 ? ' ' : ''}
    </span>
  ))
}

// Revela un titular palabra por palabra con máscara (overflow-hidden), no un
// fade plano. Con prefers-reduced-motion activo, el texto aparece completo sin
// máscara ni desplazamiento — solo se anima cuando animar no cuesta claridad.
export function TextReveal({ texto, as: Elemento = 'h1', className = '', delay = 0, style }) {
  const palabras = tokenizar(texto)
  const prefiereReducido = usePrefersReducedMotion()

  if (prefiereReducido) {
    return (
      <Elemento className={className} style={style}>
        {palabras.map(({ texto: palabraTexto, esItalica }, indice) => (
          <span key={indice} className={esItalica ? 'font-display italic' : ''}>
            {palabraTexto}
            {indice < palabras.length - 1 ? ' ' : ''}
          </span>
        ))}
      </Elemento>
    )
  }

  return (
    <motion.div
      variants={contenedor}
      initial="oculto"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delayChildren: delay }}
    >
      <Elemento className={className} style={style}>{renderPalabras(palabras)}</Elemento>
    </motion.div>
  )
}
