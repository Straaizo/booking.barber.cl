import { motion } from 'framer-motion'
import { EASE_ENTRADA } from './easing'

export function ScrollReveal({ children, delay = 0, offset = 24, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: offset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: EASE_ENTRADA }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
