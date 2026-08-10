import { AnimatePresence, motion } from 'framer-motion'
import { EASE_ENTRADA } from '../../../components/animations/easing'

// Revelado por máscara para el slogan del carrusel: la máscara (overflow
// hidden) queda fija, y el texto entrante/saliente se desliza dentro de ella
// — igual criterio que TextReveal en el resto del sitio, pero con salida
// propia (TextReveal no la tiene, está pensado para revelarse una sola vez
// al entrar en scroll, no para repetirse cada pocos segundos).
export function TextoSlogan({ id, texto, className }) {
  return (
    <div className="overflow-hidden pb-[0.2em]">
      <AnimatePresence mode="wait">
        <motion.p
          key={id}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE_ENTRADA }}
          className={className}
        >
          {texto}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
