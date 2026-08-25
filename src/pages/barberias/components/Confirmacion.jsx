import { motion } from 'framer-motion'
import { TextReveal } from '../../../components/animations/TextReveal'
import { EASE_REBOTE } from '../../../components/animations/easing'

export function Confirmacion({ resumen }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: EASE_REBOTE }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-verde-barberia text-2xl text-hueso"
      >
        ✓
      </motion.div>

      <TextReveal
        texto="¡Reserva confirmada!"
        as="h2"
        className="font-display text-2xl font-light tracking-tight text-[var(--pb-texto)] md:text-3xl"
      />

      <p className="max-w-sm border-t border-cobre/25 pt-4 text-sm text-[var(--pb-texto-secundario)]">
        {resumen}
      </p>
      <p className="versalitas text-xs text-[var(--pb-texto-sutil)]">
        Te esperamos. Cualquier cambio, contacta directamente a la barbería.
      </p>
    </div>
  )
}
