import { motion } from 'framer-motion'
import { formatoCLP, ofertaVigente } from '../../../utils/formatos'

export function PasoServicio({ servicios, onSeleccionar }) {
  const disponibles = servicios.filter((servicio) => servicio.activo)

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-negro-barbero">Elige un servicio</h2>
      {disponibles.map((servicio) => {
        const enOferta = ofertaVigente(servicio)
        return (
          <motion.button
            key={servicio.id}
            type="button"
            onClick={() => onSeleccionar(servicio)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-between rounded-xl border border-gris-calido-200 bg-white/60 px-4 py-4 text-left transition-colors hover:border-cobre hover:bg-white"
          >
            <span>
              <span className="block font-semibold text-negro-barbero">
                {servicio.nombre}
              </span>
              <span className="block text-sm text-gris-calido-700">
                {servicio.duracion_minutos} min
              </span>
            </span>
            <span className="text-right">
              {enOferta ? (
                <>
                  <span className="block text-xs text-gris-calido-400 line-through">
                    {formatoCLP(servicio.precio_clp)}
                  </span>
                  <span className="block font-bold text-cobre">
                    {formatoCLP(servicio.precio_oferta)}
                  </span>
                </>
              ) : (
                <span className="block font-bold text-negro-barbero">
                  {formatoCLP(servicio.precio_clp)}
                </span>
              )}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
