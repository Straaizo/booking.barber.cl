import { motion } from 'framer-motion'
import { BackButton } from '../../../components/common/BackButton'

// `onVolver` es opcional: elegir barbero es el primer paso del asistente
// (para poder filtrar los servicios según lo que ese barbero ofrece), así
// que no hay un paso anterior al cual volver.
export function PasoBarbero({ barberos, onSeleccionar, onVolver }) {
  return (
    <div>
      {onVolver && <BackButton onClick={onVolver} />}
      <h2 className={`font-display mb-1 text-xl font-light tracking-tight text-negro-barbero md:text-2xl ${onVolver ? 'mt-3' : ''}`}>
        Elige un barbero
      </h2>

      <div className="mt-4 flex flex-col">
        {barberos.map((barbero) => (
          <motion.button
            key={barbero.id}
            type="button"
            onClick={() => onSeleccionar(barbero)}
            whileTap={{ scale: 0.99 }}
            className="group relative flex min-h-16 items-center border-b border-gris-calido-200 py-4 text-left transition-colors first:border-t first:border-t-gris-calido-200 hover:bg-cobre/5"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-0.5 scale-y-0 bg-cobre transition-transform duration-300 ease-entrada group-hover:scale-y-100"
            />
            <span className="font-display pl-3 text-base font-normal text-negro-barbero md:text-lg">
              {barbero.nombre}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
