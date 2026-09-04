import { motion } from 'framer-motion'
import { EASE_REBOTE } from '../animations/easing'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

// Círculo rojo con una X — para el instante en que algo falló de verdad
// (login rechazado, acción bloqueada), no para errores de validación de
// formulario chicos (esos ya tienen su propio texto en rojo bajo el campo).
export function IconoErrorAnimado({ className = 'h-6 w-6' }) {
  const prefiereMenosMovimiento = usePrefersReducedMotion()

  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      initial={prefiereMenosMovimiento ? false : { scale: 0.4, rotate: -25, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE_REBOTE }}
    >
      <circle cx="12" cy="12" r="10.5" stroke="#b91c1c" strokeWidth="1.4" />
      <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#b91c1c" strokeWidth="1.6" strokeLinecap="round" />
    </motion.svg>
  )
}
