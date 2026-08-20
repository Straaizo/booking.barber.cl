import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const OPCIONES = [15, 20, 30, 45, 60, 90]

const ESTADOS = {
  guardando: 'Guardando…',
  guardado: 'Guardado',
  error: 'No se pudo guardar',
}

function etiquetaIntervalo(minutos) {
  if (minutos === 60) return 'Cada 1 hora'
  if (minutos === 90) return 'Cada 1 h 30'
  return `Cada ${minutos} min`
}

export function SelectorIntervaloReserva({ barbero, onGuardar }) {
  const [estado, setEstado] = useState(null)
  const valorActual = barbero.intervalo_reserva_minutos ?? 30

  useEffect(() => {
    if (estado !== 'guardado') return
    const temporizador = setTimeout(() => setEstado(null), 1800)
    return () => clearTimeout(temporizador)
  }, [estado])

  async function guardar(valorCrudo) {
    const valor = Number(valorCrudo)
    if (valor === valorActual) return
    setEstado('guardando')
    try {
      await onGuardar(valor)
      setEstado('guardado')
    } catch {
      setEstado('error')
    }
  }

  return (
    <div className="rounded-lg border border-gris-calido-200 bg-white p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="flex flex-col gap-1">
          <span className="versalitas text-xs text-gris-calido-500">Intervalo entre reservas</span>
          <select
            name="intervalo_reserva_minutos"
            value={valorActual}
            onChange={(e) => guardar(e.target.value)}
            className="min-h-11 min-w-40 border-b border-gris-calido-200 bg-transparent py-1 text-base font-medium text-negro-barbero outline-none transition-colors focus:border-cobre"
          >
            {OPCIONES.map((minutos) => (
              <option key={minutos} value={minutos}>
                {etiquetaIntervalo(minutos)}
              </option>
            ))}
          </select>
        </label>
        <div className="h-4">
          <AnimatePresence mode="wait">
            {estado && (
              <motion.span
                key={estado}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                role={estado === 'error' ? 'alert' : undefined}
                className={`versalitas text-xs ${estado === 'error' ? 'text-red-700' : 'text-verde-barberia'}`}
              >
                {ESTADOS[estado]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      <p className="mt-2 max-w-md text-xs text-gris-calido-500">
        Cuánto tiempo se deja entre una hora ofrecida y la siguiente al agendar — no tiene que
        coincidir con la duración de cada servicio.
      </p>
    </div>
  )
}
