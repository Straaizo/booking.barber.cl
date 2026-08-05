import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHorariosDisponibles } from '../hooks/useHorariosDisponibles'
import { useReservasDelDia } from '../hooks/useReservasDelDia'
import { proximosDiasConHorario, calcularSlotsDisponibles } from '../../../utils/horarios'
import { formatoFechaCorta } from '../../../utils/formatos'
import { BackButton } from '../../../components/common/BackButton'
import { Loader } from '../../../components/common/Loader'

function fechaISO(fecha) {
  return fecha.toISOString().slice(0, 10)
}

export function PasoHorario({ barbero, servicio, onSeleccionar, onVolver }) {
  const { data: horarios, isLoading: cargandoHorarios } = useHorariosDisponibles(
    barbero.id
  )
  const dias = useMemo(
    () => (horarios ? proximosDiasConHorario(horarios) : []),
    [horarios]
  )
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null)

  const fechaActiva = fechaSeleccionada ?? dias[0] ?? null
  const { data: reservasOcupadas, isLoading: cargandoReservas } = useReservasDelDia(
    barbero.id,
    fechaActiva ? fechaISO(fechaActiva) : null
  )

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
    return <Loader label="Cargando horarios" />
  }

  if (dias.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <BackButton onClick={onVolver} />
        <p className="text-gris-calido-700">
          Este barbero no tiene horarios disponibles por ahora.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <BackButton onClick={onVolver} />
      <h2 className="text-lg font-bold text-negro-barbero">Elige día y hora</h2>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {dias.map((dia) => {
          const activa = fechaActiva && fechaISO(dia) === fechaISO(fechaActiva)
          return (
            <button
              key={fechaISO(dia)}
              type="button"
              onClick={() => setFechaSeleccionada(dia)}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium capitalize transition ${
                activa
                  ? 'bg-negro-barbero text-hueso'
                  : 'bg-white/60 text-gris-calido-700 hover:bg-white'
              }`}
            >
              {formatoFechaCorta(dia)}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {cargandoReservas ? (
          <motion.div key="loading" exit={{ opacity: 0 }}>
            <Loader label="Cargando horas" />
          </motion.div>
        ) : slots.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gris-calido-700"
          >
            No quedan horas disponibles ese día.
          </motion.p>
        ) : (
          <motion.div
            key={fechaActiva ? fechaISO(fechaActiva) : 'slots'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-3 gap-2"
          >
            {slots.map((hora) => (
              <motion.button
                key={hora}
                type="button"
                onClick={() => onSeleccionar({ fecha: fechaActiva, hora })}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                className="rounded-lg border border-gris-calido-200 bg-white/60 py-2 text-sm font-semibold text-negro-barbero transition-colors hover:border-cobre hover:bg-white"
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
