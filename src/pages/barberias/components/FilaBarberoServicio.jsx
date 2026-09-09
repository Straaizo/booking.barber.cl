import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useHorariosDisponibles } from '../hooks/useHorariosDisponibles'
import { useReservasDelDia } from '../hooks/useReservasDelDia'
import { useExcepcionesHorario } from '../hooks/useExcepcionesHorario'
import { calcularSlotsDisponibles, fechaISO } from '../../../utils/horarios'
import { Loader } from '../../../components/common/Loader'

// Una fila por barbero, para el día ya elegido en `PasoBarberoHorario` — cada
// una pide sus propios horarios/excepciones/reservas (mismos hooks que antes
// usaba el paso "Elige día y hora" para UN solo barbero), así que varias
// filas montadas a la vez piden en paralelo sin pisarse entre sí.
export function FilaBarberoServicio({ barbero, servicio, fecha, onSeleccionar }) {
  const { data: horarios, isLoading: cargandoHorarios } = useHorariosDisponibles(barbero.id)
  const { data: excepciones } = useExcepcionesHorario(barbero.id)
  const {
    data: reservasOcupadas,
    isLoading: cargandoReservas,
    isError: errorReservas,
  } = useReservasDelDia(barbero.id, fecha ? fechaISO(fecha) : null)

  const excepcionDelDia = useMemo(() => {
    if (!fecha || !excepciones) return undefined
    return excepciones.find((e) => e.fecha === fechaISO(fecha))
  }, [excepciones, fecha])

  const slots = useMemo(() => {
    if (!horarios || !reservasOcupadas || !fecha) return []
    return calcularSlotsDisponibles({
      horarios,
      reservasOcupadas,
      duracionMinutos: servicio.duracion_minutos,
      intervaloMinutos: barbero.intervalo_reserva_minutos,
      fecha,
      excepcionDelDia,
    })
  }, [horarios, reservasOcupadas, fecha, servicio.duracion_minutos, barbero.intervalo_reserva_minutos, excepcionDelDia])

  const cargando = cargandoHorarios || cargandoReservas

  return (
    <div className="border-b border-[var(--pb-borde)] py-5 first:border-t first:border-t-[var(--pb-borde)]">
      <div className="flex items-center gap-3">
        {barbero.foto_url ? (
          <img
            src={barbero.foto_url}
            alt={barbero.nombre}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
            style={{ objectPosition: `${barbero.foto_posicion_x ?? 50}% ${barbero.foto_posicion_y ?? 50}%` }}
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cobre/10 text-sm font-medium text-[var(--pb-acento-texto)]">
            {barbero.nombre.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-display text-base font-normal text-[var(--pb-texto)] md:text-lg">
          {barbero.nombre}
        </span>
      </div>

      <div className="mt-3">
        {cargando ? (
          <div className="py-2">
            <Loader label="Cargando horas" />
          </div>
        ) : errorReservas ? (
          <p className="text-sm text-red-700" role="alert">
            No pudimos cargar sus horas. Intenta de nuevo.
          </p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-[var(--pb-texto-terciario)]">Sin horas disponibles este día.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((hora) => (
              <motion.button
                key={hora}
                type="button"
                onClick={() => onSeleccionar({ barbero, fecha, hora })}
                whileTap={{ scale: 0.96 }}
                className="numeros-tabulares flex min-h-11 min-w-16 items-center justify-center rounded-full border border-[var(--pb-borde)] px-3 text-sm font-medium text-[var(--pb-texto)] transition-colors duration-200 hover:border-cobre hover:bg-cobre/5"
              >
                {hora}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
