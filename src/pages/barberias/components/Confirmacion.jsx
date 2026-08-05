import { motion } from 'framer-motion'

export function Confirmacion({ resumen }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-verde-barberia text-2xl text-hueso"
      >
        ✓
      </motion.div>
      <h2 className="text-lg font-bold text-negro-barbero">¡Reserva confirmada!</h2>
      <p className="max-w-sm text-sm text-gris-calido-700">{resumen}</p>
      <p className="text-xs text-gris-calido-400">
        Te esperamos. Cualquier cambio, contacta directamente a la barbería.
      </p>
    </div>
  )
}
