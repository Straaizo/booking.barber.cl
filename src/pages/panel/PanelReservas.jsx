import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../../components/common/Loader'
import { HoverLink } from '../../components/common/HoverLink'
import { useReservasBandeja, useCancelarReserva } from './hooks/useReservasBandeja'
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

function FilaReserva({ reserva, onCancelar, cancelando }) {
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
          {reserva.barberos?.nombre} · {formatoCLP(reserva.servicios?.precio_clp ?? 0)}
        </span>
      </div>

      <div className="text-right md:text-left">
        {cancelada ? (
          <span className="versalitas text-xs text-gris-calido-400">Cancelada</span>
        ) : (
          <button
            type="button"
            onClick={() => onCancelar(reserva.id)}
            disabled={cancelando}
            className="versalitas text-xs text-red-700 underline decoration-red-700/40 hover:decoration-red-700 disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
}

export function PanelReservas() {
  const { perfil } = useAuth()
  const { data: reservas, isLoading, isError } = useReservasBandeja(perfil.barberia_id)
  const cancelarReserva = useCancelarReserva(perfil.barberia_id)
  const [cancelandoId, setCancelandoId] = useState(null)

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
      <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
        Reservas
      </h1>
      <p className="mt-2 max-w-lg text-sm text-gris-calido-700">
        Todas las reservas de tu barbería, ordenadas por fecha.
      </p>

      <div className="mt-8">
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

        {reservas && reservas.length === 0 && (
          <p className="py-8 text-sm text-gris-calido-700">Todavía no tienes reservas.</p>
        )}

        {reservas && reservas.length > 0 && (
          <div className="border-t border-gris-calido-200">
            {reservas.map((reserva) => (
              <FilaReserva
                key={reserva.id}
                reserva={reserva}
                onCancelar={cancelar}
                cancelando={cancelandoId === reserva.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
