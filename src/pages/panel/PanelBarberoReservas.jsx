import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../../components/common/Loader'
import { HoverLink } from '../../components/common/HoverLink'
import { IconoLapiz } from '../../components/panel/IconoLapiz'
import { IconoX } from '../../components/panel/IconoX'
import { IconoCalendario } from '../../components/panel/IconosNav'
import { IconoWhatsApp } from '../../components/common/IconoWhatsApp'
import { diaSantiagoComoFechaLocal, hoyEnSantiago } from '../../utils/horaLocal'
import { ModalReprogramarReserva } from './components/ModalReprogramarReserva'
import {
  useReservasDeBarbero,
  useCancelarReserva,
  useServiciosParaReprogramar,
  useReprogramarReserva,
  useRealtimeReservas,
} from './hooks/useReservasBandeja'
import { formatoCLP, linkWhatsApp } from '../../utils/formatos'

function formatoFechaHora(iso) {
  return new Date(iso).toLocaleString('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function FilaReserva({ reserva, onEditar, onCancelar, cancelando }) {
  const cancelada = reserva.estado === 'cancelada'

  return (
    <div className="grid grid-cols-2 items-center gap-x-4 gap-y-2 border-b border-gris-calido-200 py-5 md:grid-cols-[9rem_1fr_1fr_auto]">
      <span className="numeros-tabulares text-sm text-gris-calido-700">
        {formatoFechaHora(reserva.fecha_hora)}
      </span>

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
        {cancelada ? (
          <span className="versalitas text-xs text-gris-calido-400">Cancelada</span>
        ) : (
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
              onClick={() => onCancelar(reserva.id)}
              disabled={cancelando}
              className="versalitas text-xs text-red-700 underline decoration-red-700/40 hover:decoration-red-700 disabled:opacity-50"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Celular (< md): lista agrupada por día con tarjetas grandes, en vez de la
// tabla de 4 columnas del escritorio.
// ---------------------------------------------------------------------------

function formatoHora24(iso) {
  return new Date(iso).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Santiago',
  })
}

// Mantiene el orden que ya trae la consulta; solo corta la lista en grupos
// consecutivos del mismo día (en hora de Chile).
function agruparPorDia(reservas) {
  const grupos = []
  for (const reserva of reservas) {
    const dia = diaSantiagoComoFechaLocal(new Date(reserva.fecha_hora))
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

function TarjetaReservaMovil({ reserva, onEditar, onCancelar, cancelando }) {
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
          {cancelada && (
            <span className="mt-2 inline-block rounded-full bg-gris-calido-100 px-2.5 py-0.5 text-[13px] font-semibold text-gris-calido-500">
              Cancelada
            </span>
          )}
        </div>
      </div>

      {!cancelada && (
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
            onClick={() => onCancelar(reserva.id)}
            disabled={cancelando}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-red-50 text-[14px] font-semibold text-red-700 active:bg-red-100 disabled:opacity-50"
          >
            <IconoX className="h-4 w-4" />
            Cancelar
          </button>
        </div>
      )}
    </article>
  )
}

export function PanelBarberoReservas() {
  const { perfil } = useAuth()
  const { data: reservas, isLoading, isError } = useReservasDeBarbero(perfil.barbero_id)
  const { data: servicios } = useServiciosParaReprogramar(perfil.barberia_id)
  const cancelarReserva = useCancelarReserva(null, perfil.barbero_id)
  const reprogramarReserva = useReprogramarReserva(null, perfil.barbero_id)
  useRealtimeReservas({ barberoId: perfil.barbero_id })
  const [cancelandoId, setCancelandoId] = useState(null)
  const [reservaEditando, setReservaEditando] = useState(null)

  async function cancelar(id) {
    setCancelandoId(id)
    try {
      await cancelarReserva.mutateAsync(id)
    } finally {
      setCancelandoId(null)
    }
  }

  return (
    <div>
      <h1 className="font-display text-[28px]/[1.15] font-light tracking-tight text-negro-barbero md:text-3xl">
        Mis reservas
      </h1>
      <p className="mt-1 text-[15px] text-gris-calido-500 md:mt-2 md:max-w-lg md:text-sm md:text-gris-calido-700">
        Las reservas que tus clientes hicieron contigo, ordenadas por fecha.
      </p>

      {reservas && (
        <div className="mt-5 md:hidden">
          {reservas.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-gris-calido-200 bg-white/60 px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gris-calido-100 text-gris-calido-500">
                <IconoCalendario className="h-6 w-6" />
              </span>
              <p className="mt-3 text-[16px] font-semibold text-negro-barbero">Todavía no tienes reservas</p>
              <p className="mt-1 max-w-xs text-[15px] text-gris-calido-500">
                Cuando un cliente reserve contigo, aparecerá aquí al instante. Revisa tus horarios para que tengan
                horas disponibles.
              </p>
            </div>
          ) : (
            agruparPorDia(reservas).map(({ clave, dia, reservasDelDia }) => (
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
                    <TarjetaReservaMovil
                      key={reserva.id}
                      reserva={reserva}
                      onEditar={() => setReservaEditando(reserva)}
                      onCancelar={cancelar}
                      cancelando={cancelandoId === reserva.id}
                    />
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

        {reservas && reservas.length === 0 && (
          <p className="py-8 text-sm text-gris-calido-700">Todavía no tienes reservas.</p>
        )}

        {reservas && reservas.length > 0 && (
          <div className="border-t border-gris-calido-200">
            {reservas.map((reserva) => (
              <FilaReserva
                key={reserva.id}
                reserva={reserva}
                onEditar={() => setReservaEditando(reserva)}
                onCancelar={cancelar}
                cancelando={cancelandoId === reserva.id}
              />
            ))}
          </div>
        )}
      </div>

      {reservaEditando && servicios && (
        <ModalReprogramarReserva
          reserva={reservaEditando}
          servicios={servicios.filter(
            (s) => s.barbero_ids.length === 0 || s.barbero_ids.includes(perfil.barbero_id)
          )}
          onGuardar={(cambios) => reprogramarReserva.mutateAsync(cambios)}
          onCerrar={() => setReservaEditando(null)}
        />
      )}
    </div>
  )
}
