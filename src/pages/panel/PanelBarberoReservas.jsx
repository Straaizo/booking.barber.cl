import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../../components/common/Loader'
import { HoverLink } from '../../components/common/HoverLink'
import { IconoLapiz } from '../../components/panel/IconoLapiz'
import { IconoX } from '../../components/panel/IconoX'
import { IconoCalendario } from '../../components/panel/IconosNav'
import { ModalConfirmacion } from '../../components/panel/ModalConfirmacion'
import { IconoWhatsApp } from '../../components/common/IconoWhatsApp'
import { diaSantiagoComoFechaLocal, hoyEnSantiago } from '../../utils/horaLocal'
import { ModalReprogramarReserva } from './components/ModalReprogramarReserva'
import {
  useReservasDeBarbero,
  useCancelarReserva,
  useCompletarReserva,
  useServiciosParaReprogramar,
  useReprogramarReserva,
  useRealtimeReservas,
  useReservasArchivadas,
  inicioMesArchivado,
} from './hooks/useReservasBandeja'
import { formatoCLP, linkWhatsApp } from '../../utils/formatos'

// Estado que se muestra en el historial. Una reserva confirmada de un día ya
// pasado que nadie marcó como atendida queda "Sin confirmar" — sigue
// pudiendo confirmarse desde ahí.
const ESTADOS_HISTORIAL = {
  completada: { texto: 'Atendida', clases: 'bg-verde-barberia/10 text-verde-barberia' },
  cancelada: { texto: 'Cancelada', clases: 'bg-gris-calido-100 text-gris-calido-500' },
  confirmada: { texto: 'Sin confirmar', clases: 'bg-amber-100 text-amber-800' },
}

const FORMATO_MES = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' })

function nombreMes(fecha) {
  const texto = FORMATO_MES.format(fecha)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function formatoFechaHora(iso) {
  return new Date(iso).toLocaleString('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatoHora24(iso) {
  return new Date(iso).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Santiago',
  })
}

function diaDe(reserva) {
  return diaSantiagoComoFechaLocal(new Date(reserva.fecha_hora))
}

// Mantiene el orden que trae la lista; solo la corta en grupos consecutivos
// del mismo día (en hora de Chile).
function agruparPorDia(reservas) {
  const grupos = []
  for (const reserva of reservas) {
    const dia = diaDe(reserva)
    const clave = `${dia.getFullYear()}-${dia.getMonth()}-${dia.getDate()}`
    const ultimo = grupos[grupos.length - 1]
    if (ultimo?.clave === clave) ultimo.reservasDelDia.push(reserva)
    else grupos.push({ clave, dia, reservasDelDia: [reserva] })
  }
  return grupos
}

function etiquetaDia(dia) {
  const hoy = hoyEnSantiago()
  const diferencia = Math.round((dia - hoy) / 86_400_000)
  if (diferencia === 0) return 'Hoy'
  if (diferencia === 1) return 'Mañana'
  if (diferencia === -1) return 'Ayer'
  return dia.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
}

function ChipEstado({ estado }) {
  const info = ESTADOS_HISTORIAL[estado]
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[13px] font-semibold md:text-xs ${info.clases}`}>
      {info.texto}
    </span>
  )
}

function FilaReserva({ reserva, enHistorial, puedeConfirmar, onConfirmar, onEditar, onCancelar }) {
  const cancelada = reserva.estado === 'cancelada'

  return (
    <div className="grid grid-cols-2 items-center gap-x-4 gap-y-2 border-b border-gris-calido-200 py-5 md:grid-cols-[9rem_1fr_1fr_auto]">
      <span className="numeros-tabulares text-sm text-gris-calido-700">{formatoFechaHora(reserva.fecha_hora)}</span>

      <div>
        <span className={`block font-medium ${cancelada ? 'text-gris-calido-400 line-through' : 'text-negro-barbero'}`}>
          {reserva.cliente_nombre}
        </span>
        <HoverLink href={linkWhatsApp(reserva.cliente_telefono)} className="text-xs text-gris-calido-500">
          {reserva.cliente_telefono}
        </HoverLink>
      </div>

      <div className="col-span-2 md:col-span-1">
        <span className="block text-sm text-negro-barbero">{reserva.servicios?.nombre}</span>
        <span className="versalitas block text-xs text-gris-calido-500">
          {formatoCLP(reserva.servicios?.precio_clp ?? 0)}
        </span>
      </div>

      <div className="flex items-center justify-end gap-4 text-right md:text-left">
        {enHistorial && <ChipEstado estado={reserva.estado} />}
        {puedeConfirmar && (
          <button
            type="button"
            onClick={onConfirmar}
            className="versalitas text-xs text-verde-barberia underline decoration-verde-barberia/40 hover:decoration-verde-barberia"
          >
            Confirmar asistencia
          </button>
        )}
        {!enHistorial && (
          <>
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
              onClick={onCancelar}
              className="versalitas text-xs text-red-700 underline decoration-red-700/40 hover:decoration-red-700"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function TarjetaReservaMovil({ reserva, enHistorial, puedeConfirmar, onConfirmar, onEditar, onCancelar }) {
  const cancelada = reserva.estado === 'cancelada'

  return (
    <article className={`rounded-2xl border border-gris-calido-200 bg-white p-4 ${cancelada ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="w-16 shrink-0">
          <span
            className={`numeros-tabulares block text-[22px] font-semibold leading-none ${
              cancelada ? 'text-gris-calido-400' : 'text-negro-barbero'
            }`}
          >
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
            <span
              className={`truncate text-[17px] font-semibold ${
                cancelada ? 'text-gris-calido-400 line-through' : 'text-negro-barbero'
              }`}
            >
              {reserva.cliente_nombre}
            </span>
            <span className="numeros-tabulares shrink-0 text-[15px] font-medium text-negro-barbero">
              {formatoCLP(reserva.servicios?.precio_clp ?? 0)}
            </span>
          </div>
          <span className="mt-0.5 block truncate text-[15px] text-gris-calido-700">{reserva.servicios?.nombre}</span>
          {enHistorial && (
            <span className="mt-2 block">
              <ChipEstado estado={reserva.estado} />
            </span>
          )}
        </div>
      </div>

      {puedeConfirmar && (
        <button
          type="button"
          onClick={onConfirmar}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-verde-barberia text-base font-semibold text-hueso active:brightness-110"
        >
          <span aria-hidden="true">✓</span>
          Confirmar asistencia
        </button>
      )}

      {!enHistorial && (
        <div className={`grid grid-cols-3 gap-2 ${puedeConfirmar ? 'mt-2' : 'mt-4'}`}>
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
            onClick={onCancelar}
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

function EstadoVacio({ titulo, texto }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-gris-calido-200 bg-white/60 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gris-calido-100 text-gris-calido-500">
        <IconoCalendario className="h-6 w-6" />
      </span>
      <p className="mt-3 text-[16px] font-semibold text-negro-barbero">{titulo}</p>
      <p className="mt-1 max-w-xs text-[15px] text-gris-calido-500">{texto}</p>
    </div>
  )
}

export function PanelBarberoReservas() {
  const { perfil } = useAuth()
  const { data: reservas, isLoading, isError } = useReservasDeBarbero(perfil.barbero_id)
  const { data: servicios } = useServiciosParaReprogramar(perfil.barberia_id)
  const cancelarReserva = useCancelarReserva(null, perfil.barbero_id)
  const completarReserva = useCompletarReserva(null, perfil.barbero_id)
  const reprogramarReserva = useReprogramarReserva(null, perfil.barbero_id)
  useRealtimeReservas({ barberoId: perfil.barbero_id })

  // El Inicio puede mandar directo al historial (aviso de "sin confirmar").
  const { state } = useLocation()
  const [vista, setVista] = useState(state?.vista === 'historial' ? 'historial' : 'proximas') // 'proximas' | 'historial'
  const [mesHistorial, setMesHistorial] = useState(() => {
    const hoy = hoyEnSantiago()
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  })
  const [reservaEditando, setReservaEditando] = useState(null)
  const [reservaCancelando, setReservaCancelando] = useState(null)
  const [reservaConfirmando, setReservaConfirmando] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [errorAccion, setErrorAccion] = useState(null)

  const hoy = hoyEnSantiago()
  const mesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  // Meses anteriores al mes pasado ya no están en `reservas`: se leen del
  // histórico (solo lectura, sin acciones).
  const mesArchivado = mesHistorial < inicioMesArchivado()
  const archivadas = useReservasArchivadas(perfil.barbero_id, mesHistorial, vista === 'historial' && mesArchivado)

  // Próximas: solo lo que todavía está por atenderse (confirmadas de hoy en
  // adelante), de la más cercana a la más lejana. Todo lo demás — atendidas,
  // canceladas y confirmadas de días ya pasados — vive en el historial.
  const proximas = useMemo(() => {
    if (!reservas) return []
    const inicioHoy = hoyEnSantiago()
    return reservas
      .filter((r) => r.estado === 'confirmada' && diaDe(r) >= inicioHoy)
      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
  }, [reservas])

  const historialDelMes = useMemo(() => {
    if (mesArchivado) return archivadas.data ?? []
    if (!reservas) return []
    const idsProximas = new Set(proximas.map((r) => r.id))
    return reservas
      .filter((r) => {
        if (idsProximas.has(r.id)) return false
        const dia = diaDe(r)
        return dia.getFullYear() === mesHistorial.getFullYear() && dia.getMonth() === mesHistorial.getMonth()
      })
      .sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
  }, [reservas, proximas, mesHistorial, mesArchivado, archivadas.data])

  const resumenMes = useMemo(() => {
    const atendidas = historialDelMes.filter((r) => r.estado === 'completada')
    return {
      atendidas: atendidas.length,
      canceladas: historialDelMes.filter((r) => r.estado === 'cancelada').length,
      sinConfirmar: historialDelMes.filter((r) => r.estado === 'confirmada').length,
      ingresos: atendidas.reduce((total, r) => total + (r.servicios?.precio_clp ?? 0), 0),
    }
  }, [historialDelMes])

  const enHistorial = vista === 'historial'
  const lista = enHistorial ? historialDelMes : proximas

  function puedeConfirmar(reserva) {
    return !reserva.archivada && reserva.estado === 'confirmada' && diaDe(reserva) <= hoy
  }

  function cambiarMes(delta) {
    setMesHistorial((mes) => new Date(mes.getFullYear(), mes.getMonth() + delta, 1))
  }

  async function ejecutar(accion, cerrar) {
    setProcesando(true)
    setErrorAccion(null)
    try {
      await accion()
      cerrar()
    } catch (error) {
      setErrorAccion(error?.message ?? 'No se pudo completar la acción. Intenta de nuevo.')
      cerrar()
    } finally {
      setProcesando(false)
    }
  }

  function propsDeAcciones(reserva) {
    return {
      reserva,
      enHistorial,
      puedeConfirmar: puedeConfirmar(reserva),
      onConfirmar: () => setReservaConfirmando(reserva),
      onEditar: () => setReservaEditando(reserva),
      onCancelar: () => setReservaCancelando(reserva),
    }
  }

  return (
    <div>
      <h1 className="font-display text-[28px]/[1.15] font-light tracking-tight text-negro-barbero md:text-3xl">
        Mis reservas
      </h1>
      <p className="mt-1 text-[15px] text-gris-calido-500 md:mt-2 md:max-w-lg md:text-sm md:text-gris-calido-700">
        {enHistorial
          ? 'Lo que ya pasó: atendidas, canceladas y sin confirmar.'
          : 'Lo que viene, de la más cercana a la más lejana.'}
      </p>

      <div className="mt-5 grid grid-cols-2 rounded-xl bg-gris-calido-100 p-1 md:max-w-sm" role="tablist">
        {[
          ['proximas', `Próximas${proximas.length ? ` (${proximas.length})` : ''}`],
          ['historial', 'Historial'],
        ].map(([valor, texto]) => (
          <button
            key={valor}
            type="button"
            role="tab"
            aria-selected={vista === valor}
            onClick={() => setVista(valor)}
            className={`min-h-11 rounded-lg text-[15px] transition-colors md:min-h-9 md:text-sm ${
              vista === valor ? 'bg-white font-semibold text-negro-barbero shadow-sm' : 'text-gris-calido-500'
            }`}
          >
            {texto}
          </button>
        ))}
      </div>

      {enHistorial && (
        <div className="mt-4 rounded-2xl border border-gris-calido-200 bg-white p-2 md:max-w-xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => cambiarMes(-1)}
              aria-label="Mes anterior"
              className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-negro-barbero active:bg-gris-calido-100"
            >
              ‹
            </button>
            <span className="text-[17px] font-semibold text-negro-barbero md:text-base">{nombreMes(mesHistorial)}</span>
            <button
              type="button"
              onClick={() => cambiarMes(1)}
              disabled={mesHistorial >= mesActual}
              aria-label="Mes siguiente"
              className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-negro-barbero active:bg-gris-calido-100 disabled:opacity-25"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-3 border-t border-gris-calido-200 pt-2 text-center">
            <div>
              <p className="numeros-tabulares text-[17px] font-semibold text-verde-barberia">{resumenMes.atendidas}</p>
              <p className="text-[12px] text-gris-calido-500">Atendidas</p>
            </div>
            <div>
              <p className="numeros-tabulares text-[17px] font-semibold text-negro-barbero">
                {formatoCLP(resumenMes.ingresos)}
              </p>
              <p className="text-[12px] text-gris-calido-500">Ingresos</p>
            </div>
            <div>
              <p className="numeros-tabulares text-[17px] font-semibold text-gris-calido-500">{resumenMes.canceladas}</p>
              <p className="text-[12px] text-gris-calido-500">Canceladas</p>
            </div>
          </div>
          {mesArchivado && (
            <p className="mt-2 rounded-xl bg-gris-calido-100 px-3 py-2 text-[13px] text-gris-calido-700">
              Mes archivado: se muestra solo para consulta.
            </p>
          )}
          {resumenMes.sinConfirmar > 0 && (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
              {resumenMes.sinConfirmar} {resumenMes.sinConfirmar === 1 ? 'reserva quedó' : 'reservas quedaron'} sin
              confirmar asistencia.
            </p>
          )}
        </div>
      )}

      {errorAccion && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[15px] text-red-700 md:text-sm">
          {errorAccion}
        </p>
      )}

      {reservas && (
        <div className="mt-5 md:hidden">
          {enHistorial && mesArchivado && archivadas.isLoading ? (
            <div className="py-12">
              <Loader label="Cargando historial" />
            </div>
          ) : lista.length === 0 ? (
            enHistorial ? (
              <EstadoVacio
                titulo={`Sin movimientos en ${nombreMes(mesHistorial).toLowerCase()}`}
                texto="Aquí aparecen las reservas atendidas, canceladas o que quedaron sin confirmar."
              />
            ) : (
              <EstadoVacio
                titulo="No tienes reservas próximas"
                texto="Cuando un cliente reserve contigo, aparecerá aquí al instante. Revisa tus horarios para que tengan horas disponibles."
              />
            )
          ) : (
            agruparPorDia(lista).map(({ clave, dia, reservasDelDia }) => (
              <section key={clave} className="mb-6">
                {/* Pegajoso justo bajo la barra superior del panel (h-14 +
                    safe-area), para saber siempre en qué día se está. */}
                <p
                  role="heading"
                  aria-level={2}
                  className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-10 -mx-4 bg-hueso/95 px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-gris-calido-500 backdrop-blur"
                >
                  {etiquetaDia(dia)}
                </p>
                <div className="mt-1 flex flex-col gap-3">
                  {reservasDelDia.map((reserva) => (
                    <TarjetaReservaMovil key={reserva.id} {...propsDeAcciones(reserva)} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      <div className={`mt-8 ${reservas ? 'hidden md:block' : ''}`}>
        {isLoading && (
          <div className="py-12">
            <Loader label="Cargando reservas" />
          </div>
        )}

        {isError && (
          <p role="alert" className="py-8 text-sm text-red-700">
            No pudimos cargar tus reservas. Recarga la página o intenta más tarde.
          </p>
        )}

        {reservas && lista.length === 0 && (
          <p className="py-8 text-sm text-gris-calido-700">
            {enHistorial ? 'No hay movimientos en este mes.' : 'No tienes reservas próximas.'}
          </p>
        )}

        {reservas && lista.length > 0 && (
          <div className="border-t border-gris-calido-200">
            {lista.map((reserva) => (
              <FilaReserva key={reserva.id} {...propsDeAcciones(reserva)} />
            ))}
          </div>
        )}
      </div>

      <ModalConfirmacion
        abierto={Boolean(reservaConfirmando)}
        titulo="Confirmar asistencia"
        mensaje={
          reservaConfirmando &&
          `¿${reservaConfirmando.cliente_nombre} llegó a su hora de las ${formatoHora24(reservaConfirmando.fecha_hora)}? La reserva pasará a tu historial como atendida.`
        }
        textoConfirmar="Sí, llegó"
        textoCancelar="Volver"
        variante="exito"
        confirmando={procesando}
        onConfirmar={() =>
          ejecutar(() => completarReserva.mutateAsync(reservaConfirmando.id), () => setReservaConfirmando(null))
        }
        onCerrar={() => setReservaConfirmando(null)}
      />

      <ModalConfirmacion
        abierto={Boolean(reservaCancelando)}
        titulo="Cancelar reserva"
        mensaje={
          reservaCancelando &&
          `Se cancelará la reserva de ${reservaCancelando.cliente_nombre} (${formatoFechaHora(reservaCancelando.fecha_hora)}). Avísale por WhatsApp para que no venga.`
        }
        textoConfirmar="Cancelar reserva"
        textoCancelar="Volver"
        confirmando={procesando}
        onConfirmar={() =>
          ejecutar(() => cancelarReserva.mutateAsync(reservaCancelando.id), () => setReservaCancelando(null))
        }
        onCerrar={() => setReservaCancelando(null)}
      />

      {reservaEditando && servicios && (
        <ModalReprogramarReserva
          reserva={reservaEditando}
          servicios={servicios.filter((s) => s.barbero_ids.length === 0 || s.barbero_ids.includes(perfil.barbero_id))}
          onGuardar={(cambios) => reprogramarReserva.mutateAsync(cambios)}
          onCerrar={() => setReservaEditando(null)}
        />
      )}
    </div>
  )
}
