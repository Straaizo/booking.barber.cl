import { motion } from 'framer-motion'
import { EASE_ENTRADA, DURACION_BASE } from './easing'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

export function ScrollReveal({ children, delay = 0, offset = 24, className = '' }) {
  const prefiereReducido = usePrefersReducedMotion()

  if (prefiereReducido) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: offset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: DURACION_BASE + 0.1, delay, ease: EASE_ENTRADA }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
