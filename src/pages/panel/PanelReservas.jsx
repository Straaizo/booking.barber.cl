import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../../components/common/Loader'
import { HoverLink } from '../../components/common/HoverLink'
import { ModalConfirmacion } from '../../components/panel/ModalConfirmacion'
import { CalendarioReservas } from '../../components/panel/CalendarioReservas'
import { IconoLapiz } from '../../components/panel/IconoLapiz'
import { IconoX } from '../../components/panel/IconoX'
import { IconoRefrescar } from '../../components/panel/IconoRefrescar'
import { IconoCalendario } from '../../components/panel/IconosNav'
import { IconoWhatsApp } from '../../components/common/IconoWhatsApp'
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

      {reserva.estado === 'completada' ? (
        <span className="versalitas mt-1 text-xs text-verde-barberia">✓ Atendida</span>
      ) : (
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
      )}
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

// ---------------------------------------------------------------------------
// Celular (< md): agenda de día tipo app nativa en vez de la grilla semanal
// del calendario, que a 390px queda como una sola columna enorme y casi vacía.
// Usa exactamente los mismos datos y handlers que la vista de escritorio.
// ---------------------------------------------------------------------------

function formatoHora24(iso) {
  return new Date(iso).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Santiago',
  })
}

function sumarDias(fecha, dias) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias)
}

function claveDia(fecha) {
  return `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`
}

const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

// Tira de días desplazable: una semana atrás y un mes adelante desde hoy
// (se estira si el día elegido cae fuera, ej. al tocar una "próxima reserva"
// lejana). El punto bajo el número avisa qué días tienen reservas sin tener
// que abrirlos uno por uno.
function TiraDias({ reservas, diaSeleccionado, onSeleccionarDia }) {
  const tiraRef = useRef(null)
  const hoy = hoyEnSantiago()

  let inicio = sumarDias(hoy, -7)
  let fin = sumarDias(hoy, 30)
  if (diaSeleccionado < inicio) inicio = diaSeleccionado
  if (diaSeleccionado > fin) fin = diaSeleccionado
  const dias = []
  for (let d = inicio; d <= fin; d = sumarDias(d, 1)) dias.push(d)

  const diasConReservas = useMemo(() => {
    const conjunto = new Set()
    for (const r of reservas) {
      if (r.estado !== 'cancelada') conjunto.add(claveDia(diaSantiagoComoFechaLocal(new Date(r.fecha_hora))))
    }
    return conjunto
  }, [reservas])

  // Centra el día elegido moviendo solo la tira (scrollIntoView movería
  // también la página entera en iOS).
  useEffect(() => {
    const tira = tiraRef.current
    const elegido = tira?.querySelector('[data-elegido="true"]')
    if (!tira || !elegido) return
    tira.scrollTo({
      left: elegido.offsetLeft - tira.clientWidth / 2 + elegido.clientWidth / 2,
      behavior: 'smooth',
    })
  }, [diaSeleccionado])

  const esHoySeleccionado = mismoDia(diaSeleccionado, hoy)

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[17px] font-semibold capitalize text-negro-barbero">
          {diaSeleccionado.toLocaleDateString('es-CL', { month: 'long' })} {diaSeleccionado.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => onSeleccionarDia(hoy)}
          disabled={esHoySeleccionado}
          className="min-h-11 rounded-full px-4 text-[15px] font-semibold text-cobre-texto transition-colors active:bg-cobre/10 disabled:text-gris-calido-400"
        >
          Hoy
        </button>
      </div>
      <div
        ref={tiraRef}
        className="-mx-4 mt-2 flex snap-x gap-2 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {dias.map((dia) => {
          const elegido = mismoDia(dia, diaSeleccionado)
          const esHoy = mismoDia(dia, hoy)
          const conReservas = diasConReservas.has(claveDia(dia))
          return (
            <button
              key={claveDia(dia)}
              type="button"
              data-elegido={elegido}
              onClick={() => onSeleccionarDia(dia)}
              aria-pressed={elegido}
              aria-label={dia.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
              className={`flex h-[72px] w-[52px] shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-2xl border transition-colors ${
                elegido
                  ? 'border-cobre-oscuro bg-cobre-oscuro text-hueso'
                  : esHoy
                    ? 'border-cobre/60 bg-white text-cobre-texto'
                    : 'border-gris-calido-200 bg-white text-negro-barbero'
              }`}
            >
              <span className={`text-[12px] font-semibold uppercase tracking-[0.04em] ${elegido ? 'text-hueso/80' : esHoy ? '' : 'text-gris-calido-500'}`}>
                {DIAS_CORTOS[dia.getDay()]}
              </span>
              <span className="numeros-tabulares text-[19px] font-semibold leading-none">{dia.getDate()}</span>
              <span
                aria-hidden="true"
                className={`mt-1 h-1.5 w-1.5 rounded-full ${conReservas ? (elegido ? 'bg-hueso' : 'bg-cobre') : 'bg-transparent'}`}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TarjetaReservaMovil({ reserva, onEditar, onPedirCancelar }) {
  return (
    <article className="rounded-2xl border border-gris-calido-200 bg-white p-4">
      <div className="flex items-start gap-4">
        <div className="w-16 shrink-0">
          <span className="numeros-tabulares block text-[22px] font-semibold leading-none text-negro-barbero">
            {formatoHora24(reserva.fecha_hora)}
          </span>
          {reserva.fecha_hora_fin && (
            <span className="numeros-tabulares mt-1 block text-[13px] text-gris-calido-500">
              {formatoHora24(reserva.fecha_hora_fin)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 border-l border-gris-calido-200 pl-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[17px] font-semibold text-negro-barbero">{reserva.cliente_nombre}</span>
            <span className="numeros-tabulares shrink-0 text-[15px] font-medium text-negro-barbero">
              {formatoCLP(reserva.servicios?.precio_clp ?? 0)}
            </span>
          </div>
          <span className="mt-0.5 block truncate text-[15px] text-gris-calido-700">{reserva.servicios?.nombre}</span>
          <span className="mt-0.5 block truncate text-[14px] text-gris-calido-500">con {reserva.barberos?.nombre}</span>
        </div>
      </div>

      {reserva.estado === 'completada' ? (
        <p className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-verde-barberia/10 text-[15px] font-semibold text-verde-barberia">
          ✓ Atendida
        </p>
      ) : (
      <div className="mt-4 grid grid-cols-3 gap-2">
        <a
          href={linkWhatsApp(reserva.cliente_telefono)}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-verde-barberia/10 text-[14px] font-semibold text-verde-barberia active:bg-verde-barberia/20"
        >
          <IconoWhatsApp className="h-[18px] w-[18px]" />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={onEditar}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-gris-calido-100 text-[14px] font-semibold text-negro-barbero active:bg-gris-calido-200"
        >
          <IconoLapiz className="h-4 w-4" />
          Editar
        </button>
        <button
          type="button"
          onClick={onPedirCancelar}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-red-50 text-[14px] font-semibold text-red-700 active:bg-red-100"
        >
          <IconoX className="h-4 w-4" />
          Cancelar
        </button>
      </div>
      )}
    </article>
  )
}

function TarjetaCanceladaMovil({ reserva, onPedirReactivar, reactivando }) {
  return (
    <article className="rounded-2xl border border-gris-calido-200 bg-white p-4">
      <span className="numeros-tabulares block text-[14px] font-medium text-gris-calido-500 first-letter:uppercase">
        {formatoFechaHora(reserva.fecha_hora)}
      </span>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="truncate text-[17px] font-semibold text-gris-calido-400 line-through">{reserva.cliente_nombre}</span>
        <span className="numeros-tabulares shrink-0 text-[15px] text-gris-calido-400">
          {formatoCLP(reserva.servicios?.precio_clp ?? 0)}
        </span>
      </div>
      <span className="mt-0.5 block truncate text-[15px] text-gris-calido-500">
        {reserva.servicios?.nombre} · {reserva.barberos?.nombre}
      </span>
      <button
        type="button"
        onClick={onPedirReactivar}
        disabled={reactivando}
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gris-calido-100 text-[15px] font-semibold text-cobre-texto active:bg-gris-calido-200 disabled:opacity-50"
      >
        <IconoRefrescar className="h-4 w-4" />
        Reactivar
      </button>
    </article>
  )
}

function EstadoVacioMovil({ titulo, texto }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-gris-calido-200 bg-white/60 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gris-calido-100 text-gris-calido-500">
        <IconoCalendario className="h-6 w-6" />
      </span>
      <p className="mt-3 text-[16px] font-semibold text-negro-barbero">{titulo}</p>
      <p className="mt-1 max-w-xs text-[15px] text-gris-calido-500">{texto}</p>
    </div>
  )
}

const ETIQUETA_SECCION_MOVIL = 'text-[13px] font-semibold uppercase tracking-[0.06em] text-gris-calido-500'

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
        (r) => r.estado !== 'cancelada' && mismoDia(diaSantiagoComoFechaLocal(new Date(r.fecha_hora)), diaSeleccionado)
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
      if (r.estado === 'cancelada') return false
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
      <h1 className="font-display text-[28px]/[1.15] font-light tracking-tight text-negro-barbero md:text-3xl">
        Reservas
      </h1>
      <p className="mt-1 text-[15px] text-gris-calido-500 md:hidden">Tu agenda del día y las canceladas.</p>
      <p className="mt-2 hidden max-w-lg text-sm text-gris-calido-700 md:block">
        Todas las reservas de tu barbería. Elige un día en el calendario para ver sus horas, o mira las
        canceladas para reactivar alguna si fue un error.
      </p>

      {/* Celular: control segmentado a todo el ancho, como las apps nativas. */}
      <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-gris-calido-100 p-1 md:hidden" role="tablist">
        {[
          ['dia', 'Agenda'],
          ['canceladas', `Canceladas${reservasCanceladas.length > 0 ? ` (${reservasCanceladas.length})` : ''}`],
        ].map(([valor, texto]) => (
          <button
            key={valor}
            type="button"
            role="tab"
            aria-selected={vista === valor}
            onClick={() => setVista(valor)}
            className={`min-h-10 rounded-lg text-[15px] font-semibold transition-colors ${
              vista === valor ? 'bg-white text-negro-barbero shadow-sm' : 'text-gris-calido-500'
            }`}
          >
            {texto}
          </button>
        ))}
      </div>

      <div className="mt-6 hidden gap-2 md:flex">
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
        <div className="mt-5 md:hidden">
          {vista === 'dia' && (
            <>
              <TiraDias reservas={reservas} diaSeleccionado={diaSeleccionado} onSeleccionarDia={setDiaSeleccionado} />

              <h2 className="mt-6 text-[22px] font-semibold capitalize tracking-tight text-negro-barbero">
                {esHoy ? 'Hoy' : diaSeleccionado.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>

              <div className="mt-3 grid grid-cols-3 divide-x divide-gris-calido-200 rounded-2xl border border-gris-calido-200 bg-white py-3">
                {[
                  ['Reservas', reservasDelDia.length],
                  ['Ingresos', formatoCLP(reservasDelDia.reduce((total, r) => total + (r.servicios?.precio_clp ?? 0), 0))],
                  ['Semana', reservasSemana],
                ].map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="min-w-0 px-2 text-center">
                    <span className="block text-[12px] font-semibold uppercase tracking-[0.06em] text-gris-calido-500">
                      {etiqueta}
                    </span>
                    <span className="numeros-tabulares mt-0.5 block truncate text-[18px] font-semibold text-negro-barbero">
                      {valor}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {reservasDelDia.length === 0 ? (
                  <EstadoVacioMovil
                    titulo="Día libre"
                    texto="No hay reservas confirmadas este día. Desliza la tira de arriba para ver otros días."
                  />
                ) : (
                  reservasDelDia.map((reserva) => (
                    <TarjetaReservaMovil
                      key={reserva.id}
                      reserva={reserva}
                      onEditar={() => setReservaEditando(reserva)}
                      onPedirCancelar={() => setReservaCancelando(reserva)}
                    />
                  ))
                )}
              </div>

              {proximasReservas.length > 0 && (
                <div className="mt-8">
                  <p role="heading" aria-level={3} className={ETIQUETA_SECCION_MOVIL}>
                    Próximas reservas
                  </p>
                  <div className="mt-2 divide-y divide-gris-calido-100 overflow-hidden rounded-2xl border border-gris-calido-200 bg-white">
                    {proximasReservas.map((reserva) => (
                      <button
                        key={reserva.id}
                        type="button"
                        onClick={() => setDiaSeleccionado(diaSantiagoComoFechaLocal(new Date(reserva.fecha_hora)))}
                        className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left active:bg-gris-calido-100"
                      >
                        <span className="w-[72px] shrink-0">
                          <span className="block text-[13px] font-medium capitalize text-gris-calido-500">
                            {new Date(reserva.fecha_hora).toLocaleDateString('es-CL', {
                              weekday: 'short',
                              day: 'numeric',
                              timeZone: 'America/Santiago',
                            })}
                          </span>
                          <span className="numeros-tabulares block text-[16px] font-semibold text-negro-barbero">
                            {formatoHora24(reserva.fecha_hora)}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium text-negro-barbero">
                            {reserva.cliente_nombre}
                          </span>
                          <span className="block truncate text-[13px] text-gris-calido-500">{reserva.barberos?.nombre}</span>
                        </span>
                        <span aria-hidden="true" className="shrink-0 text-xl text-gris-calido-400">
                          ›
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
              <p role="heading" aria-level={2} className={ETIQUETA_SECCION_MOVIL}>
                {reservasCanceladas.length} reserva{reservasCanceladas.length === 1 ? '' : 's'} cancelada
                {reservasCanceladas.length === 1 ? '' : 's'}
              </p>
              <div className="mt-3 flex flex-col gap-3">
                {reservasCanceladas.length === 0 ? (
                  <EstadoVacioMovil
                    titulo="Sin canceladas"
                    texto="Si cancelas una reserva por error, aparecerá aquí para que puedas reactivarla."
                  />
                ) : (
                  reservasCanceladas.map((reserva) => (
                    <TarjetaCanceladaMovil
                      key={reserva.id}
                      reserva={reserva}
                      onPedirReactivar={() => {
                        setErrorReactivar(null)
                        setReservaReactivando(reserva)
                      }}
                      reactivando={reservaReactivando?.id === reserva.id && procesando}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {reservas && (
        <div className="mt-8 hidden gap-8 md:grid lg:grid-cols-[420px_minmax(0,1fr)] lg:items-stretch">
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
              onAbrirReserva={(reserva) => reserva.estado === 'confirmada' && setReservaEditando(reserva)}
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
