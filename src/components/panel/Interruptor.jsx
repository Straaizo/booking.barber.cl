import { motion } from 'framer-motion'
import { EASE_ENTRADA } from '../animations/easing'

// Interruptor propio (no de librería de iconos) — una píldora con un punto
// que se desliza, mismo lenguaje de movimiento del resto del sitio. Se usa
// para cualquier toggle booleano de los paneles (ofertas, barberos, horarios).
export function Interruptor({ activo, onCambiar, disabled = false, etiqueta }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      disabled={disabled}
      onClick={() => onCambiar(!activo)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-laton disabled:opacity-40 ${
        activo ? 'bg-cobre' : 'bg-gris-calido-200'
      }`}
    >
      <motion.span
        className="absolute top-1 h-5 w-5 rounded-full bg-hueso shadow"
        animate={{ left: activo ? '1.5rem' : '0.25rem' }}
        transition={{ duration: 0.25, ease: EASE_ENTRADA }}
      />
    </button>
  )
}
