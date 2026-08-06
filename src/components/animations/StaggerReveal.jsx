import { Children, isValidElement } from 'react'
import { motion } from 'framer-motion'
import { EASE_ENTRADA, DURACION_BASE, STAGGER_LISTA } from './easing'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

const contenedor = {
  oculto: {},
  visible: { transition: { staggerChildren: STAGGER_LISTA } },
}

const item = {
  oculto: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: DURACION_BASE, ease: EASE_ENTRADA } },
}

// Envuelve una lista de elementos y anima cada hijo en cascada al entrar en
// viewport — usado en pasos, beneficios y filas de la tabla de precios.
// Con prefers-reduced-motion activo, se muestra directo sin animar.
export function StaggerReveal({ children, className = '' }) {
  const prefiereReducido = usePrefersReducedMotion()

  if (prefiereReducido) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      variants={contenedor}
      initial="oculto"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className={className}
    >
      {Children.map(children, (hijo) => (isValidElement(hijo) ? <motion.div variants={item}>{hijo}</motion.div> : hijo))}
    </motion.div>
  )
}
