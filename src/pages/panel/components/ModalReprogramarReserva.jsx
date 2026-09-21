import { useEffect, useMemo, useState } from 'react'
import { ModalFormulario } from '../../../components/panel/ModalFormulario'
import { Button } from '../../../components/common/Button'
import { Loader } from '../../../components/common/Loader'
import { useHorariosDisponibles } from '../../barberias/hooks/useHorariosDisponibles'
import { useReservasDelDia } from '../../barberias/hooks/useReservasDelDia'
import { useExcepcionesHorario } from '../../barberias/hooks/useExcepcionesHorario'
import { calcularSlotsDisponibles, fechaISO } from '../../../utils/horarios'
import { formatoCLP } from '../../../utils/formatos'
import { claveFechaSantiago, horaMinutoEnSantiago, santiagoAFechaUTC } from '../../../utils/horaLocal'

function fechaParaInput(fecha) {
  return claveFechaSantiago(fecha)
}
function horaParaInput(fecha) {
  const { hora, minuto } = horaMinutoEnSantiago(fecha)
  return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`
}

// Editar hora y/o servicio de una reserva ya confirmada — para cuando el
// cliente se equivocó y avisó directamente a la barbería. El barbero no se
// puede cambiar acá (eso sería otra reserva distinta) — `servicios` ya viene
// filtrado por quien llama a lo que ESE barbero realmente ofrece (compartidos
// + los que el dueño le asignó puntualmente).
//
// Las horas NO se escriben a mano: se recalculan con la MISMA función que usa
// el asistente de reserva público (`calcularSlotsDisponibles`), respetando el
// horario real del barbero, sus excepciones, sus reservas ya tomadas y la
// duración PROPIA del servicio elegido — así nunca se puede guardar una hora
// que en los hechos no es válida (antes esto era un `<input type="time">"
// libre, sin ningún límite hasta que la base lo rechazaba con un error
// críptico al guardar).
export function ModalReprogramarReserva({ reserva, servicios, onGuardar, onCerrar }) {
  const fechaActual = useMemo(() => new Date(reserva.fecha_hora), [reserva.fecha_hora])
  const [servicioId, setServicioId] = useState(reserva.servicio_id)
  const [fechaInput, setFechaInput] = useState(fechaParaInput(fechaActual))
  const [horaElegida, setHoraElegida] = useState(null)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const servicio = servicios.find((s) => s.id === servicioId) ?? servicios[0]
  const intervalo = reserva.barberos?.intervalo_reserva_minutos ?? 30

  // Date "puro" (sin huso) a partir del input de fecha — mismo patrón que ya
  // usa el asistente público para calcular slots por día.
  const fechaElegida = useMemo(() => {
    const [anio, mes, dia] = fechaInput.split('-').map(Number)
    return new Date(anio, mes - 1, dia)
  }, [fechaInput])

  const { data: horarios, isLoading: cargandoHorarios } = useHorariosDisponibles(reserva.barbero_id)
  const { data: excepciones } = useExcepcionesHorario(reserva.barbero_id)
  const {
    data: reservasDelDia,
    isLoading: cargandoReservas,
    isError: errorReservas,
  } = useReservasDelDia(reserva.barbero_id, fechaISO(fechaElegida))

  const excepcionDelDia = useMemo(() => {
    if (!excepciones) return undefined
    return excepciones.find((e) => e.fecha === fechaISO(fechaElegida))
  }, [excepciones, fechaElegida])

  // La reserva que se está editando todavía cuenta como "ocupada" en su
  // propio rango (sigue confirmada en la base mientras se edita) — sin
  // sacarla de la lista, ni siquiera se podría volver a elegir el mismo
  // horario de siempre. Se identifica por el inicio exacto (un barbero no
  // puede tener dos reservas arrancando al mismo instante).
  const reservasOcupadas = useMemo(() => {
    if (!reservasDelDia) return []
    if (fechaISO(fechaElegida) !== fechaISO(fechaActual)) return reservasDelDia
    const inicioActualMs = fechaActual.getTime()
    return reservasDelDia.filter((r) => new Date(r.fecha_hora).getTime() !== inicioActualMs)
  }, [reservasDelDia, fechaElegida, fechaActual])

  const slots = useMemo(() => {
    if (!horarios || !reservasDelDia || !servicio) return []
    return calcularSlotsDisponibles({
      horarios,
      reservasOcupadas,
      duracionMinutos: servicio.duracion_minutos,
      intervaloMinutos: intervalo,
      fecha: fechaElegida,
      excepcionDelDia,
    })
  }, [horarios, reservasDelDia, reservasOcupadas, servicio, intervalo, fechaElegida, excepcionDelDia])

  // Al cambiar fecha o servicio, la hora elegida deja de ser válida — se
  // limpia para no guardar una hora vieja que ya no aplica.
  useEffect(() => {
    setHoraElegida(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInput, servicioId])

  // Si la hora actual de la reserva sigue siendo una opción válida ese mismo
  // día, queda preseleccionada — reprogramar por error no obliga a re-elegir
  // todo de cero.
  useEffect(() => {
    if (horaElegida !== null) return
    if (fechaISO(fechaElegida) !== fechaISO(fechaActual)) return
    const horaActual = horaParaInput(fechaActual)
    if (slots.includes(horaActual)) setHoraElegida(horaActual)
  }, [slots, fechaElegida, fechaActual, horaElegida])

  async function guardar(evento) {
    evento.preventDefault()
    setError(null)
    if (!horaElegida) {
      setError('Elige una hora disponible.')
      return
    }
    setGuardando(true)
    try {
      const [horas, minutos] = horaElegida.split(':').map(Number)
      const [anio, mes, dia] = fechaInput.split('-').map(Number)
      // La hora elegida ES hora de Chile — sin esto, guardar desde un
      // dispositivo con otro huso horario movería la reserva a una hora
      // distinta a la que se ve en pantalla.
      const nuevaFecha = santiagoAFechaUTC(anio, mes, dia, horas, minutos)
      await onGuardar({ id: reserva.id, servicio_id: servicioId, fecha_hora: nuevaFecha.toISOString() })
      onCerrar()
    } catch (e) {
      setError(e.message || 'No pudimos guardar el cambio.')
    } finally {
      setGuardando(false)
    }
  }

  const cargando = cargandoHorarios || cargandoReservas

  return (
    <ModalFormulario abierto titulo={`Editar reserva de ${reserva.cliente_nombre}`} onCerrar={onCerrar} ancho="md">
      {servicios.length === 0 ? (
        <p className="text-sm text-gris-calido-700">
          Este barbero no tiene ningún servicio asignado ahora mismo — asígnale uno desde Servicios
          antes de reprogramar.
        </p>
      ) : (
        <form onSubmit={guardar} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="versalitas text-xs text-gris-calido-500">Servicio</span>
            <select
              value={servicioId}
              onChange={(e) => setServicioId(Number(e.target.value))}
              className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
            >
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} — {formatoCLP(s.precio_clp)} ({s.duracion_minutos} min)
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="versalitas text-xs text-gris-calido-500">Fecha</span>
            <input
              type="date"
              value={fechaInput}
              onChange={(e) => setFechaInput(e.target.value)}
              className="min-h-11 w-full border-b border-gris-calido-200 bg-transparent py-2 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="versalitas text-xs text-gris-calido-500">Hora</span>
            {cargando ? (
              <div className="py-4">
                <Loader label="Cargando horas" />
              </div>
            ) : errorReservas ? (
              <p className="text-sm text-red-700" role="alert">
                No pudimos cargar las horas. Intenta de nuevo.
              </p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-gris-calido-500">Sin horas disponibles ese día para este servicio.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((hora) => (
                  <button
                    key={hora}
                    type="button"
                    onClick={() => setHoraElegida(hora)}
                    className={`numeros-tabulares min-h-11 min-w-16 rounded-full border px-3 text-sm font-medium transition-colors ${
                      horaElegida === hora
                        ? 'border-cobre bg-cobre text-hueso'
                        : 'border-gris-calido-200 text-negro-barbero hover:border-cobre/50'
                    }`}
                  >
                    {hora}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <Button as="button" type="submit" disabled={guardando || !horaElegida} className="w-fit">
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </form>
      )}
    </ModalFormulario>
  )
}
