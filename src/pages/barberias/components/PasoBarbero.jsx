import { motion } from 'framer-motion'
import { BackButton } from '../../../components/common/BackButton'

export function PasoBarbero({ barberos, onSeleccionar, onVolver }) {
  const disponibles = barberos.filter((barbero) => barbero.activo)

  return (
    <div className="flex flex-col gap-3">
      <BackButton onClick={onVolver} />
      <h2 className="text-lg font-bold text-negro-barbero">Elige un barbero</h2>
      {disponibles.map((barbero) => (
        <motion.button
          key={barbero.id}
          type="button"
          onClick={() => onSeleccionar(barbero)}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-xl border border-gris-calido-200 bg-white/60 px-4 py-4 text-left font-semibold text-negro-barbero transition-colors hover:border-cobre hover:bg-white"
        >
          {barbero.nombre}
        </motion.button>
      ))}
    </div>
  )
}
