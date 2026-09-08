import { motion } from 'framer-motion'
import { BackButton } from '../../../components/common/BackButton'
import { formatoCLP, ofertaVigente } from '../../../utils/formatos'

// Primer paso del asistente — sin `onVolver` cuando no hay paso anterior
// (no lo tenía tampoco cuando el primer paso era "elige un barbero").
export function PasoServicio({ servicios, onSeleccionar, onVolver }) {
  return (
    <div>
      {onVolver && <BackButton onClick={onVolver} />}
      <h2 className={`font-display mb-1 text-xl font-light tracking-tight text-[var(--pb-texto)] md:text-2xl ${onVolver ? 'mt-3' : ''}`}>
        Elige un servicio
      </h2>

      {servicios.length === 0 && (
        <p className="mt-4 text-sm text-[var(--pb-texto-secundario)]">
          Esta barbería no tiene servicios disponibles por ahora.
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
              className="group relative flex items-center gap-5 border-b border-[var(--pb-borde)] py-5 text-left transition-colors first:border-t first:border-t-[var(--pb-borde)] hover:bg-cobre/5"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-0.5 scale-y-0 bg-cobre transition-transform duration-300 ease-entrada group-hover:scale-y-100"
              />
              {servicio.imagen_url ? (
                <img
                  src={servicio.imagen_url}
                  alt=""
                  className="ml-3 h-24 w-24 shrink-0 rounded-md object-cover md:h-28 md:w-28"
                />
              ) : (
                <span className="ml-3 h-24 w-24 shrink-0 rounded-md bg-cobre/5 md:h-28 md:w-28" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1">
                <span className="font-display block text-base font-normal text-[var(--pb-texto)] md:text-lg">
                  {servicio.nombre}
                </span>
                {servicio.descripcion && (
                  <span className="mt-1 block text-sm leading-snug text-[var(--pb-texto-secundario)]">
                    {servicio.descripcion}
                  </span>
                )}
                <span className="versalitas mt-1.5 block text-xs text-[var(--pb-texto-terciario)]">
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
