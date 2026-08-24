import { useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../../components/common/Loader'
import { HoverLink } from '../../components/common/HoverLink'
import { Button } from '../../components/common/Button'
import { ModalFormulario } from '../../components/panel/ModalFormulario'
import { ModalConfirmacion } from '../../components/panel/ModalConfirmacion'
import { CalendarioReservas } from '../../components/panel/CalendarioReservas'
import { IconoLapiz } from '../../components/panel/IconoLapiz'
import { IconoX } from '../../components/panel/IconoX'
import {
  useReservasBandeja,
  useCancelarReserva,
  useReactivarReserva,
  useServiciosParaReprogramar,
  useReprogramarReserva,
} from './hooks/useReservasBandeja'
import { formatoCLP, linkWhatsApp } from '../../utils/formatos'
import {
  horaMinutoEnSantiago,
  claveFechaSantiago,
  diaSantiagoComoFechaLocal,
  hoyEnSantiago,
  santiagoAFechaUTC,
} from '../../utils/horaLocal'

// El negocio corre siempre en hora de Chile — estas dos SIEMPRE la fijan
// (`timeZone`), en vez de mostrar la hora local de quien esté mirando el
// panel (ver utils/horaLocal.js para el porqué).
function formatoHora(iso) {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' })
}

function formatoFechaHora(iso) {
  return new Date(iso).toLocaleString('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Santiago',
  })
}

// Marcadores de día "puros" (los que arma el calendario, sin huso real) se
// comparan con getters locales de siempre.
function mismoDia(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// Fecha/hora para prellenar el formulario de "Editar" — en hora de Chile,
// no la del dispositivo del dueño (si no, editar desde fuera de Chile
// mostraría, y guardaría, una hora distinta a la real de la reserva).
function fechaParaInput(fecha) {
  return claveFechaSantiago(fecha)
}
function horaParaInput(fecha) {
  const { hora, minuto } = horaMinutoEnSantiago(fecha)
  return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`
}

// Editar hora y/o servicio de una reserva ya confirmada — para cuando el
// cliente se equivocó y avisó directamente a la barbería. El barbero no se
// puede cambiar acá (eso sería una reserva distinta) — el servicio se limita
// al catálogo real de ESE barbero (propio o compartido), igual que en el
// asistente de reserva público.
function ModalReprogramarReserva({ reserva, servicios, onGuardar, onCerrar }) {
  const serviciosDelBarbero = servicios.filter((s) =>
    reserva.barberos?.usa_catalogo_propio ? s.barbero_id === reserva.barbero_id : !s.barbero_id
  )
  const fechaActual = new Date(reserva.fecha_hora)
  const [servicioId, setServicioId] = useState(reserva.servicio_id)
  const [fecha, setFecha] = useState(fechaParaInput(fechaActual))
  const [hora, setHora] = useState(horaParaInput(fechaActual))
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  async function guardar(evento) {
    evento.preventDefault()
    setError(null)
    if (!fecha || !hora) return
    setGuardando(true)
    try {
      const [horas, minutos] = hora.split(':').map(Number)
      const [anio, mes, dia] = fecha.split('-').map(Number)
      // La hora que escribió el dueño ES hora de Chile — sin esto, guardar
      // desde un dispositivo con otro huso horario movería la reserva a una
      // hora distinta a la que se ve en pantalla.
      const nuevaFecha = santiagoAFechaUTC(anio, mes, dia, horas, minutos)
      await onGuardar({ id: reserva.id, servicio_id: servicioId, fecha_hora: nuevaFecha.toISOString() })
      onCerrar()
    } catch (e) {
      setError(e.message || 'No pudimos guardar el cambio.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <ModalFormulario abierto titulo={`Editar reserva de ${reserva.cliente_nombre}`} onCerrar={onCerrar}>
      <form onSubmit={guardar} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="versalitas text-xs text-gris-calido-500">Servicio</span>
          <select
            value={servicioId}
            onChange={(e) => setServicioId(Number(e.target.value))}
            className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
          >
            {serviciosDelBarbero.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} — {formatoCLP(s.precio_clp)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="versalitas text-xs text-gris-calido-500">Fecha</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="min-h-11 w-full border-b border-gris-calido-200 bg-transparent py-2 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="versalitas text-xs text-gris-calido-500">Hora</span>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="min-h-11 w-full border-b border-gris-calido-200 bg-transparent py-2 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        <Button as="button" type="submit" disabled={guardando} className="w-fit">
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </form>
    </ModalFormulario>
  )
}

function FilaReservaActiva({ reserva, onEditar, onPedirCancelar }) {
  return (
    <div className="grid grid-cols-2 items-center gap-x-4 gap-y-2 border-b border-gris-calido-200 py-5 md:grid-cols-[5rem_1fr_1fr_auto]">
      <span className="numeros-tabulares text-sm font-medium text-negro-barbero">{formatoHora(reserva.fecha_hora)}</span>

      <div>
        <span className="block font-medium text-negro-barbero">{reserva.cliente_nombre}</span>
        <HoverLink href={linkWhatsApp(reserva.cliente_telefono)} className="text-xs text-gris-calido-500">
          {reserva.cliente_telefono}
        </HoverLink>
      </div>

      <div className="col-span-2 md:col-span-1">
        <span className="block text-sm text-negro-barbero">{reserva.servicios?.nombre}</span>
        <span className="versalitas block text-xs text-gris-calido-500">
          {reserva.barberos?.nombre} · {formatoCLP(reserva.servicios?.precio_clp ?? 0)}
        </span>
      </div>

      <div className="flex items-center justify-end gap-4 text-right md:justify-start md:text-left">
        <button
          type="button"
          onClick={onEditar}
          className="versalitas flex items-center gap-1.5 text-xs text-cobre-texto underline decoration-cobre-texto/40 hover:decoration-cobre-texto"
        >
          <IconoLapiz className="h-3.5 w-3.5" />
          Editar
        </button>
        <button
          type="button"
          onClick={onPedirCancelar}
          className="versalitas flex items-center gap-1.5 text-xs text-red-700 underline decoration-red-700/40 hover:decoration-red-700"
        >
          <IconoX className="h-3.5 w-3.5" />
          Cancelar
        </button>
      </div>
    </div>
  )
}

function FilaReservaCancelada({ reserva, onPedirReactivar, reactivando }) {
  return (
    <div className="grid grid-cols-2 items-center gap-x-4 gap-y-2 border-b border-gris-calido-200 py-5 md:grid-cols-[9rem_1fr_1fr_auto] md:opacity-70">
      <span className="numeros-tabulares text-sm text-gris-calido-700">{formatoFechaHora(reserva.fecha_hora)}</span>

      <div>
        <span className="block font-medium text-gris-calido-400 line-through">{reserva.cliente_nombre}</span>
        <span className="text-xs text-gris-calido-500">{reserva.cliente_telefono}</span>
      </div>

      <div className="col-span-2 md:col-span-1">
        <span className="block text-sm text-gris-calido-500 line-through">{reserva.servicios?.nombre}</span>
        <span className="versalitas block text-xs text-gris-calido-400">
          {reserva.barberos?.nombre} · {formatoCLP(reserva.servicios?.precio_clp ?? 0)}
        </span>
      </div>

      <div className="text-right md:text-left">
        <button
          type="button"
          onClick={onPedirReactivar}
          disabled={reactivando}
          className="versalitas text-xs text-cobre-texto underline decoration-cobre-texto/40 hover:decoration-cobre-texto disabled:opacity-50"
        >
          Reactivar
        </button>
      </div>
    </div>
  )
}

export function PanelReservas() {
  const { perfil } = useAuth()
  const { data: reservas, isLoading, isError } = useReservasBandeja(perfil.barberia_id)
  const { data: servicios } = useServiciosParaReprogramar(perfil.barberia_id)
  const cancelarReserva = useCancelarReserva(perfil.barberia_id)
  const reactivarReserva = useReactivarReserva(perfil.barberia_id)
  const reprogramarReserva = useReprogramarReserva(perfil.barberia_id)

  const [vista, setVista] = useState('dia') // 'dia' | 'canceladas'
  const [diaSeleccionado, setDiaSeleccionado] = useState(() => hoyEnSantiago())
  const [reservaEditando, setReservaEditando] = useState(null)
  const [reservaCancelando, setReservaCancelando] = useState(null)
  const [reservaReactivando, setReservaReactivando] = useState(null)
  const [errorReactivar, setErrorReactivar] = useState(null)
  const [procesando, setProcesando] = useState(false)

  const reservasDelDia = useMemo(() => {
    if (!reservas) return []
    return reservas
      .filter(
        (r) => r.estado === 'confirmada' && mismoDia(diaSantiagoComoFechaLocal(new Date(r.fecha_hora)), diaSeleccionado)
      )
      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
  }, [reservas, diaSeleccionado])

  const reservasCanceladas = useMemo(() => {
    if (!reservas) return []
    return reservas
      .filter((r) => r.estado === 'cancelada')
      .sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
  }, [reservas])

  async function confirmarCancelacion() {
    if (!reservaCancelando) return
    setProcesando(true)
    try {
      await cancelarReserva.mutateAsync(reservaCancelando.id)
      setReservaCancelando(null)
    } finally {
      setProcesando(false)
    }
  }

  async function confirmarReactivacion() {
    if (!reservaReactivando) return
    setProcesando(true)
    try {
      await reactivarReserva.mutateAsync(reservaReactivando.id)
      setReservaReactivando(null)
    } catch (e) {
      // Se deja el modal abierto para que se vea el motivo (ej: el horario
      // ya lo ocupó otra reserva mientras esta estaba cancelada).
      setErrorReactivar(e.message || 'No pudimos reactivar la reserva.')
    } finally {
      setProcesando(false)
    }
  }

  const esHoy = mismoDia(diaSeleccionado, hoyEnSantiago())

  return (
    <div>
      <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
        Reservas
      </h1>
      <p className="mt-2 max-w-lg text-sm text-gris-calido-700">
        Todas las reservas de tu barbería. Elige un día en el calendario para ver sus horas, o mira las
        canceladas para reactivar alguna si fue un error.
      </p>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setVista('dia')}
          className={`versalitas rounded-full px-4 py-2 text-xs transition-colors ${
            vista === 'dia' ? 'bg-cobre text-hueso' : 'bg-gris-calido-100 text-gris-calido-600 hover:bg-cobre/10'
          }`}
        >
          Reservas del día
        </button>
        <button
          type="button"
          onClick={() => setVista('canceladas')}
          className={`versalitas rounded-full px-4 py-2 text-xs transition-colors ${
            vista === 'canceladas' ? 'bg-cobre text-hueso' : 'bg-gris-calido-100 text-gris-calido-600 hover:bg-cobre/10'
          }`}
        >
          Canceladas{reservasCanceladas.length > 0 ? ` (${reservasCanceladas.length})` : ''}
        </button>
      </div>

      {isLoading && (
        <div className="py-12">
          <Loader label="Cargando reservas" />
        </div>
      )}

      {isError && (
        <p role="alert" className="py-8 text-sm text-red-700">
          No pudimos cargar las reservas. Recarga la página o intenta más tarde.
        </p>
      )}

      {reservas && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_minmax(0,1fr)] lg:items-start">
          {/* Columna izquierda: la lista — angosta, como el formulario de
              Personalización — según la vista, el día elegido o todas las
              canceladas. En mobile va primero el calendario (se elige el día
              antes de ver algo), acá abajo por orden CSS. */}
          <div className="order-2 rounded-lg border border-gris-calido-200 bg-white p-6 lg:order-1">
            {vista === 'dia' && (
              <>
                <div className="flex items-baseline justify-between gap-3 border-b border-gris-calido-100 pb-4">
                  <h2 className="font-display text-xl font-light capitalize tracking-tight text-negro-barbero">
                    {esHoy ? 'Hoy' : diaSeleccionado.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h2>
                  <span className="versalitas numeros-tabulares text-xs text-gris-calido-500">
                    {reservasDelDia.length} reserva{reservasDelDia.length === 1 ? '' : 's'}
                  </span>
                </div>
                {reservasDelDia.length === 0 ? (
                  <p className="py-10 text-center text-sm text-gris-calido-500">No hay reservas confirmadas ese día.</p>
                ) : (
                  <div>
                    {reservasDelDia.map((reserva) => (
                      <FilaReservaActiva
                        key={reserva.id}
                        reserva={reserva}
                        onEditar={() => setReservaEditando(reserva)}
                        onPedirCancelar={() => setReservaCancelando(reserva)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {vista === 'canceladas' && (
              <>
                <h2 className="versalitas border-b border-gris-calido-100 pb-4 text-xs text-gris-calido-700">
                  {reservasCanceladas.length} reserva{reservasCanceladas.length === 1 ? '' : 's'} cancelada
                  {reservasCanceladas.length === 1 ? '' : 's'}
                </h2>
                {reservasCanceladas.length === 0 ? (
                  <p className="py-10 text-center text-sm text-gris-calido-500">No tienes ninguna reserva cancelada.</p>
                ) : (
                  <div>
                    {reservasCanceladas.map((reserva) => (
                      <FilaReservaCancelada
                        key={reserva.id}
                        reserva={reserva}
                        onPedirReactivar={() => {
                          setErrorReactivar(null)
                          setReservaReactivando(reserva)
                        }}
                        reactivando={reservaReactivando?.id === reserva.id && procesando}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Columna derecha: el calendario — la parte grande y dominante,
              como la vista previa de Personalización. Siempre visible, así
              se puede saltar de "canceladas" a un día concreto sin ida y
              vuelta. */}
          <div className="order-1 min-w-0 rounded-lg border border-gris-calido-200 bg-white p-6 lg:order-2 lg:sticky lg:top-6">
            <CalendarioReservas
              reservas={reservas}
              diaSeleccionado={diaSeleccionado}
              onSeleccionarDia={(fecha) => {
                setDiaSeleccionado(fecha)
                setVista('dia')
              }}
              onAbrirReserva={(reserva) => setReservaEditando(reserva)}
            />
          </div>
        </div>
      )}

      {reservaEditando && servicios && (
        <ModalReprogramarReserva
          reserva={reservaEditando}
          servicios={servicios}
          onGuardar={(cambios) => reprogramarReserva.mutateAsync(cambios)}
          onCerrar={() => setReservaEditando(null)}
        />
      )}

      <ModalConfirmacion
        abierto={Boolean(reservaCancelando)}
        titulo="Cancelar reserva"
        mensaje={
          reservaCancelando
            ? `¿Cancelar la reserva de ${reservaCancelando.cliente_nombre} (${formatoFechaHora(reservaCancelando.fecha_hora)})? Podés reactivarla después desde "Canceladas" si fue un error.`
            : ''
        }
        textoConfirmar="Sí, cancelar"
        variante="peligro"
        confirmando={procesando}
        onConfirmar={confirmarCancelacion}
        onCerrar={() => setReservaCancelando(null)}
      />

      <ModalConfirmacion
        abierto={Boolean(reservaReactivando)}
        titulo="Reactivar reserva"
        mensaje={
          errorReactivar ||
          (reservaReactivando
            ? `¿Reactivar la reserva de ${reservaReactivando.cliente_nombre} (${formatoFechaHora(reservaReactivando.fecha_hora)})?`
            : '')
        }
        textoConfirmar="Sí, reactivar"
        variante="normal"
        confirmando={procesando}
        onConfirmar={confirmarReactivacion}
        onCerrar={() => {
          setReservaReactivando(null)
          setErrorReactivar(null)
        }}
      />
    </div>
  )
}
