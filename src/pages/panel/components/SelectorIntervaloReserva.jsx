import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useIsMobile } from '../../../hooks/useIsMobile'

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
  const esMovil = useIsMobile()

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

  const textoEstado = (
    <AnimatePresence mode="wait">
      {estado && (
        <motion.span
          key={estado}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role={estado === 'error' ? 'alert' : undefined}
          className={`text-[13px] font-medium ${estado === 'error' ? 'text-red-700' : 'text-verde-barberia'}`}
        >
          {ESTADOS[estado]}
        </motion.span>
      )}
    </AnimatePresence>
  )

  // En el celular es una fila de ajustes tipo iOS: etiqueta a la izquierda y
  // el valor elegible a la derecha.
  if (esMovil) {
    return (
      <div>
        <label className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-gris-calido-200 bg-white px-4">
          <span className="text-base text-negro-barbero">Intervalo entre horas</span>
          <span className="relative flex items-center">
            <select
              name="intervalo_reserva_minutos"
              value={valorActual}
              onChange={(e) => guardar(e.target.value)}
              className="min-h-12 appearance-none bg-transparent pr-6 text-right text-base font-medium text-cobre-texto outline-none"
            >
              {OPCIONES.map((minutos) => (
                <option key={minutos} value={minutos}>
                  {etiquetaIntervalo(minutos)}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="pointer-events-none absolute right-0 h-4 w-4 text-cobre-texto"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </label>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 px-1 text-[13px] leading-snug text-gris-calido-500">
          <span>Separación entre las horas que se ofrecen al reservar.</span>
          {textoEstado}
        </p>
      </div>
    )
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
