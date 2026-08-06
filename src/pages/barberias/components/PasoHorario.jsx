import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHorariosDisponibles } from '../hooks/useHorariosDisponibles'
import { useReservasDelDia } from '../hooks/useReservasDelDia'
import { proximosDiasConHorario, calcularSlotsDisponibles } from '../../../utils/horarios'
import { formatoFechaCorta } from '../../../utils/formatos'
import { BackButton } from '../../../components/common/BackButton'
import { Loader } from '../../../components/common/Loader'
import { EASE_ENTRADA } from '../../../components/animations/easing'

function fechaISO(fecha) {
  return fecha.toISOString().slice(0, 10)
}

export function PasoHorario({ barbero, servicio, onSeleccionar, onVolver }) {
  const {
    data: horarios,
    isLoading: cargandoHorarios,
    isError: errorHorarios,
  } = useHorariosDisponibles(barbero.id)
  const dias = useMemo(
    () => (horarios ? proximosDiasConHorario(horarios) : []),
    [horarios]
  )
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null)

  const fechaActiva = fechaSeleccionada ?? dias[0] ?? null
  const {
    data: reservasOcupadas,
    isLoading: cargandoReservas,
    isError: errorReservas,
  } = useReservasDelDia(barbero.id, fechaActiva ? fechaISO(fechaActiva) : null)

  const slots = useMemo(() => {
    if (!horarios || !reservasOcupadas || !fechaActiva) return []
    return calcularSlotsDisponibles({
      horarios,
      reservasOcupadas,
      duracionMinutos: servicio.duracion_minutos,
      fecha: fechaActiva,
    })
  }, [horarios, reservasOcupadas, fechaActiva, servicio.duracion_minutos])

  if (cargandoHorarios) {
    return (
      <div className="py-6">
        <Loader label="Cargando horarios" />
      </div>
    )
  }

  if (errorHorarios) {
    return (
      <div>
        <BackButton onClick={onVolver} />
        <p className="mt-4 text-sm text-red-700" role="alert">
          No pudimos cargar los horarios. Intenta de nuevo.
        </p>
      </div>
    )
  }

  if (dias.length === 0) {
    return (
      <div>
        <BackButton onClick={onVolver} />
        <p className="mt-4 text-sm text-gris-calido-700">
          Este barbero no tiene horarios disponibles por ahora.
        </p>
      </div>
    )
  }

  return (
    <div>
      <BackButton onClick={onVolver} />
      <h2 className="font-display mb-4 mt-3 text-xl font-light tracking-tight text-negro-barbero md:text-2xl">
        Elige día y hora
      </h2>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {dias.map((dia) => {
          const activa = fechaActiva && fechaISO(dia) === fechaISO(fechaActiva)
          return (
            <button
              key={fechaISO(dia)}
              type="button"
              onClick={() => setFechaSeleccionada(dia)}
              className={`versalitas min-h-11 shrink-0 rounded-full border px-4 text-xs capitalize transition-colors duration-200 ${
                activa
                  ? 'border-cobre bg-cobre text-hueso'
                  : 'border-gris-calido-200 text-gris-calido-700 hover:border-cobre/50'
              }`}
            >
              {formatoFechaCorta(dia)}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {cargandoReservas ? (
          <motion.div key="loading" exit={{ opacity: 0 }} className="py-8">
            <Loader label="Cargando horas" />
          </motion.div>
        ) : errorReservas ? (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            role="alert"
            className="mt-6 text-sm text-red-700"
          >
            No pudimos cargar las horas disponibles. Intenta de nuevo.
          </motion.p>
        ) : slots.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-sm text-gris-calido-700"
          >
            No quedan horas disponibles ese día.
          </motion.p>
        ) : (
          <motion.div
            key={fechaActiva ? fechaISO(fechaActiva) : 'slots'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_ENTRADA }}
            className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4"
          >
            {slots.map((hora) => (
              <motion.button
                key={hora}
                type="button"
                onClick={() => onSeleccionar({ fecha: fechaActiva, hora })}
                whileTap={{ scale: 0.96 }}
                className="numeros-tabulares flex min-h-11 items-center justify-center rounded-md border border-gris-calido-200 text-sm font-medium text-negro-barbero transition-colors duration-200 hover:border-cobre hover:bg-cobre/5"
              >
                {hora}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
