import { Children, isValidElement } from 'react'
import { motion } from 'framer-motion'
import { EASE_ENTRADA } from './easing'

const contenedor = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.09 } },
}

const item = {
  oculto: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_ENTRADA } },
}

// Envuelve una lista de elementos y anima cada hijo en cascada al entrar en
// viewport — usado en pasos, beneficios y filas de la tabla de precios.
export function StaggerReveal({ children, className = '' }) {
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
