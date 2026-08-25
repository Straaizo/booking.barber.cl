import { motion } from 'framer-motion'
import { BackButton } from '../../../components/common/BackButton'
import { formatoCLP, ofertaVigente } from '../../../utils/formatos'

export function PasoServicio({ servicios, onSeleccionar, onVolver }) {
  return (
    <div>
      <BackButton onClick={onVolver} />
      <h2 className="font-display mt-3 mb-1 text-xl font-light tracking-tight text-[var(--pb-texto)] md:text-2xl">
        Elige un servicio
      </h2>

      {servicios.length === 0 && (
        <p className="mt-4 text-sm text-[var(--pb-texto-secundario)]">
          Este barbero no tiene servicios disponibles por ahora.
        </p>
      )}

      <div className="mt-4 flex flex-col">
        {servicios.map((servicio) => {
          const enOferta = ofertaVigente(servicio)
          return (
            <motion.button
              key={servicio.id}
              type="button"
              onClick={() => onSeleccionar(servicio)}
              whileTap={{ scale: 0.99 }}
              className="group relative flex min-h-16 items-center justify-between gap-4 border-b border-[var(--pb-borde)] py-4 text-left transition-colors first:border-t first:border-t-[var(--pb-borde)] hover:bg-cobre/5"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-0.5 scale-y-0 bg-cobre transition-transform duration-300 ease-entrada group-hover:scale-y-100"
              />
              <span className="pl-3">
                <span className="font-display block text-base font-normal text-[var(--pb-texto)] md:text-lg">
                  {servicio.nombre}
                </span>
                <span className="versalitas mt-0.5 block text-xs text-[var(--pb-texto-terciario)]">
                  {servicio.duracion_minutos} min
                </span>
              </span>
              <span className="numeros-tabulares shrink-0 pr-1 text-right">
                {enOferta ? (
                  <>
                    <span className="block text-xs text-[var(--pb-texto-sutil)] line-through">
                      {formatoCLP(servicio.precio_clp)}
                    </span>
                    <span className="block text-base font-semibold text-[var(--pb-acento-texto)]">
                      {formatoCLP(servicio.precio_oferta)}
                    </span>
                  </>
                ) : (
                  <span className="block text-base font-semibold text-[var(--pb-texto)]">
                    {formatoCLP(servicio.precio_clp)}
                  </span>
                )}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
