import { useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../../components/common/Loader'
import { HoverLink } from '../../components/common/HoverLink'
import { ModalConfirmacion } from '../../components/panel/ModalConfirmacion'
import { CalendarioReservas } from '../../components/panel/CalendarioReservas'
import { IconoLapiz } from '../../components/panel/IconoLapiz'
import { IconoX } from '../../components/panel/IconoX'
import { IconoRefrescar } from '../../components/panel/IconoRefrescar'
import { ModalReprogramarReserva } from './components/ModalReprogramarReserva'
import {
  useReservasBandeja,
  useCancelarReserva,
  useReactivarReserva,
  useServiciosParaReprogramar,
  useReprogramarReserva,
  useRealtimeReservas,
} from './hooks/useReservasBandeja'
import { formatoCLP, linkWhatsApp } from '../../utils/formatos'
import { diaSantiagoComoFechaLocal, hoyEnSantiago, inicioDeSemanaLunes } from '../../utils/horaLocal'

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

// Filas apiladas en vez de una grilla de 4 columnas — esta lista vive en la
// columna ANGOSTA (420px) al lado del calendario grande, no en una columna
// ancha como al principio. La vieja grilla de 4 columnas (hora / cliente /
// servicio / acciones lado a lado) necesitaba mucho más ancho del que tiene
// acá: el botón "Cancelar" quedaba cortado contra el borde de la tarjeta.
// Acá cada dato tiene su propia línea, y las 2 acciones se separan al máximo
// con `justify-between` en vez de ir amontonadas — nunca les falta espacio,
// sin importar cuán angosta quede la columna.
function FilaReservaActiva({ reserva, onEditar, onPedirCancelar }) {
  return (
    <div className="flex flex-col gap-2 border-b border-gris-calido-200 py-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="numeros-tabulares text-sm font-medium text-negro-barbero">
          {formatoHora(reserva.fecha_hora)}
        </span>
        <span className="numeros-tabulares text-xs text-gris-calido-500">
          {formatoCLP(reserva.servicios?.precio_clp ?? 0)}
        </span>
      </div>

      <div>
        <span className="block font-medium text-negro-barbero">{reserva.cliente_nombre}</span>
        <HoverLink href={linkWhatsApp(reserva.cliente_telefono)} className="text-xs text-gris-calido-500">
          {reserva.cliente_telefono}
        </HoverLink>
      </div>

      <div>
        <span className="block text-sm text-negro-barbero">{reserva.servicios?.nombre}</span>
        <span className="versalitas block text-xs text-gris-calido-500">{reserva.barberos?.nombre}</span>
      </div>

      <div className="mt-1 flex items-center justify-between">
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
    <div className="flex flex-col gap-2 border-b border-gris-calido-200 py-4 opacity-70">
      <span className="numeros-tabulares text-xs text-gris-calido-500">{formatoFechaHora(reserva.fecha_hora)}</span>

      <div>
        <span className="block font-medium text-gris-calido-400 line-through">{reserva.cliente_nombre}</span>
        <span className="text-xs text-gris-calido-500">{reserva.cliente_telefono}</span>
      </div>

      <div>
        <span className="block text-sm text-gris-calido-500 line-through">{reserva.servicios?.nombre}</span>
        <span className="versalitas block text-xs text-gris-calido-400">
          {reserva.barberos?.nombre} · {formatoCLP(reserva.servicios?.precio_clp ?? 0)}
        </span>
      </div>

      <div className="mt-1">
        <button
          type="button"
          onClick={onPedirReactivar}
          disabled={reactivando}
          className="versalitas flex items-center gap-1.5 text-xs text-cobre-texto underline decoration-cobre-texto/40 hover:decoration-cobre-texto disabled:opacity-50"
        >
          <IconoRefrescar className="h-3.5 w-3.5" />
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
  useRealtimeReservas({ barberiaId: perfil.barberia_id })

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

  // Cuenta confirmadas de la semana que contiene el día elegido (lunes a
  // domingo) — un número que da una idea de la carga de la semana completa,
  // no solo del día puntual. Reemplaza a "Primera" (la hora de la próxima
  // reserva), que Enzo no sentía relevante ahí.
  const reservasSemana = useMemo(() => {
    if (!reservas) return 0
    const inicio = inicioDeSemanaLunes(diaSeleccionado)
    const fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 7)
    return reservas.filter((r) => {
      if (r.estado !== 'confirmada') return false
      const dia = diaSantiagoComoFechaLocal(new Date(r.fecha_hora))
      return dia >= inicio && dia < fin
    }).length
  }, [reservas, diaSeleccionado])

  // Las próximas reservas en general (no solo las del día elegido) — llena
  // con algo útil el espacio que sobra cuando el día tiene pocas o ninguna,
  // en vez de dejarlo en blanco nomás. Se excluyen las que ya se ven arriba
  // (las del día elegido) para no repetir la misma reserva dos veces.
  const proximasReservas = useMemo(() => {
    if (!reservas) return []
    const idsDelDia = new Set(reservasDelDia.map((r) => r.id))
    const ahora = new Date()
    return reservas
      .filter((r) => r.estado === 'confirmada' && new Date(r.fecha_hora) > ahora && !idsDelDia.has(r.id))
      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
      .slice(0, 4)
  }, [reservas, reservasDelDia])

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
        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_minmax(0,1fr)] lg:items-stretch">
          {/* Columna izquierda: la lista — angosta, como el formulario de
              Personalización — según la vista, el día elegido o todas las
              canceladas. En mobile va primero el calendario (se elige el día
              antes de ver algo), acá abajo por orden CSS. `items-stretch` (no
              `items-start`) para que esta tarjeta tenga la misma altura que
              el calendario — antes, con un día corto, quedaba mucho más baja
              y quedaba flotando un bloque de vacío al lado, en vez de sentirse
              como dos paneles equivalentes. */}
          <div className="order-2 flex flex-col rounded-lg border border-gris-calido-200 bg-white p-6 lg:order-1">
            {vista === 'dia' && (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  {/* Sin `font-display`: la serif fina (Fraunces) se ve bien
                      como título grande de página, pero acá — un título
                      chico en una pantalla con harta información — se lee
                      débil. La tipografía normal del panel (sans, con más
                      peso) se ve más clara. */}
                  <h2 className="text-xl font-semibold capitalize tracking-tight text-negro-barbero">
                    {esHoy ? 'Hoy' : diaSeleccionado.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h2>
                  <span className="versalitas numeros-tabulares text-xs text-gris-calido-500">
                    {reservasDelDia.length} reserva{reservasDelDia.length === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Siempre visible (no solo con reservas ese día) — da una
                    vista más amplia de la semana completa, no solo del día
                    puntual elegido. Separados a los extremos de la tarjeta
                    con `justify-between`, no con un simple gap chico. */}
                <div className="mt-4 flex items-baseline justify-between border-b border-gris-calido-100 pb-4">
                  <div>
                    <span className="versalitas block text-[10px] text-gris-calido-500">Ingreso del día</span>
                    <span className="numeros-tabulares text-lg font-medium text-negro-barbero">
                      {formatoCLP(reservasDelDia.reduce((total, r) => total + (r.servicios?.precio_clp ?? 0), 0))}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="versalitas block text-[10px] text-gris-calido-500">Reservas esta semana</span>
                    <span className="numeros-tabulares text-lg font-medium text-negro-barbero">{reservasSemana}</span>
                  </div>
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

                {proximasReservas.length > 0 && (
                  <div className="mt-8">
                    <h3 className="versalitas text-xs text-gris-calido-500">Próximas reservas</h3>
                    <div className="mt-2 flex flex-col divide-y divide-gris-calido-100">
                      {proximasReservas.map((reserva) => (
                        <button
                          key={reserva.id}
                          type="button"
                          onClick={() => setDiaSeleccionado(diaSantiagoComoFechaLocal(new Date(reserva.fecha_hora)))}
                          className="flex items-center gap-3 py-2.5 text-left transition-colors hover:bg-cobre/5"
                        >
                          <span className="numeros-tabulares shrink-0 text-xs text-gris-calido-500">
                            {formatoFechaHora(reserva.fecha_hora)}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm text-negro-barbero">
                            {reserva.cliente_nombre}
                          </span>
                          <span className="versalitas shrink-0 text-xs text-gris-calido-400">
                            {reserva.barberos?.nombre}
                          </span>
                        </button>
                      ))}
                    </div>
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
          servicios={servicios.filter(
            (s) => s.barbero_ids.length === 0 || s.barbero_ids.includes(reservaEditando.barbero_id)
          )}
          onGuardar={(cambios) => reprogramarReserva.mutateAsync(cambios)}
          onCerrar={() => setReservaEditando(null)}
        />
      )}

      <ModalConfirmacion
        abierto={Boolean(reservaCancelando)}
        titulo="Cancelar reserva"
        mensaje={
          reservaCancelando
            ? `¿Cancelar la reserva de ${reservaCancelando.cliente_nombre} (${formatoFechaHora(reservaCancelando.fecha_hora)})? Puedes reactivarla después desde "Canceladas" si fue un error.`
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
