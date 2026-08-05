import { motion } from 'framer-motion'
import { EASE_ENTRADA } from './easing'

const contenedor = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.045 } },
}

const palabra = {
  oculto: { y: '110%' },
  visible: { y: '0%', transition: { duration: 0.8, ease: EASE_ENTRADA } },
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

// Revela un titular palabra por palabra con máscara (overflow-hidden), no un
// fade plano. Cada palabra vive en su propio contenedor recortado para que la
// animación de entrada no se vea "flotando" fuera de su línea.
export function TextReveal({ texto, as: Elemento = 'h1', className = '', delay = 0 }) {
  const palabras = tokenizar(texto)

  return (
    <motion.div
      variants={contenedor}
      initial="oculto"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delayChildren: delay }}
    >
      <Elemento className={className}>
        {palabras.map(({ texto: palabraTexto, esItalica }, indice) => (
          // El espacio va FUERA del span con overflow-hidden: adentro, el navegador
          // lo recorta como si fuera un espacio final de línea y las palabras se pegan.
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
        ))}
      </Elemento>
    </motion.div>
  )
}
