import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from '../../components/common/Loader'
import { HoverLink } from '../../components/common/HoverLink'
import { Button } from '../../components/common/Button'
import {
  useBarberiaDetalle,
  useCambiarEstadoBarberia,
  useCambiarPlanBarberia,
} from './hooks/useBarberiasSuperadmin'
import { usePlanesSuperadmin } from './hooks/usePlanesSuperadmin'
import { useHistorialEstados } from './hooks/useHistorialEstados'
import { NOMBRE_ESTADO, TONO_ESTADO } from '../../utils/estados'

function formatoFecha(iso) {
  return new Date(iso).toLocaleString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PanelSuperadminBarberiaDetalle() {
  const { id } = useParams()
  const { data: barberia, isLoading, isError } = useBarberiaDetalle(id)
  const { data: planes } = usePlanesSuperadmin()
  const { data: historial, isLoading: cargandoHistorial } = useHistorialEstados(id)
  const cambiarEstado = useCambiarEstadoBarberia()
  const cambiarPlan = useCambiarPlanBarberia()

  const [estadoDestino, setEstadoDestino] = useState('')
  const [motivo, setMotivo] = useState('')
  const [errorEnvio, setErrorEnvio] = useState(null)

  async function confirmarCambioEstado(evento) {
    evento.preventDefault()
    setErrorEnvio(null)
    if (!estadoDestino || !motivo.trim()) {
      setErrorEnvio('Selecciona el nuevo estado e ingresa un motivo.')
      return
    }
    try {
      await cambiarEstado.mutateAsync({
        barberiaId: id,
        estadoNuevoId: Number(estadoDestino),
        motivo: motivo.trim(),
      })
      setEstadoDestino('')
      setMotivo('')
    } catch {
      setErrorEnvio('No pudimos cambiar el estado. Intenta de nuevo.')
    }
  }

  if (isLoading) {
    return (
      <div className="py-12">
        <Loader label="Cargando barbería" />
      </div>
    )
  }

  if (isError || !barberia) {
    return (
      <p role="alert" className="py-8 text-sm text-red-700">
        No pudimos cargar esta barbería.
      </p>
    )
  }

  return (
    <div>
      <HoverLink href="/admin" className="text-xs text-gris-calido-500">
        ← Volver a barberías
      </HoverLink>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
          {barberia.nombre}
        </h1>
        <span className={`versalitas text-xs ${TONO_ESTADO[barberia.estado_id]}`}>
          {NOMBRE_ESTADO[barberia.estado_id]}
        </span>
      </div>
      <p className="versalitas mt-1 text-xs text-gris-calido-500">
        booking.barber.cl/barberias/{barberia.slug}
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <section>
          <span className="versalitas text-xs text-cobre">— Plan contratado</span>
          <div className="mt-3 flex items-center gap-4">
            <select
              value={barberia.plan_id ?? ''}
              onChange={(e) => cambiarPlan.mutate({ id, planId: Number(e.target.value) })}
              className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
            >
              {planes?.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.nombre}
                </option>
              ))}
            </select>
            {cambiarPlan.isPending && (
              <span className="versalitas text-xs text-gris-calido-500">Guardando…</span>
            )}
          </div>
          <p className="mt-2 text-xs text-gris-calido-500">
            Máximo {barberia.planes?.max_barberos} barberos con este plan.
          </p>
        </section>

        <section>
          <span className="versalitas text-xs text-cobre">— Cambiar estado</span>
          <form onSubmit={confirmarCambioEstado} className="mt-3 flex flex-col gap-4">
            <select
              value={estadoDestino}
              onChange={(e) => setEstadoDestino(e.target.value)}
              className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
            >
              <option value="">Selecciona el nuevo estado</option>
              {Object.entries(NOMBRE_ESTADO)
                .filter(([idEstado]) => Number(idEstado) !== barberia.estado_id)
                .map(([idEstado, nombre]) => (
                  <option key={idEstado} value={idEstado}>
                    {nombre}
                  </option>
                ))}
            </select>
            <label className="flex flex-col gap-2">
              <span className="versalitas text-xs text-gris-calido-500">Motivo (obligatorio)</span>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={2}
                placeholder="Ej: atraso de pago de 2 meses"
                className="border-b border-gris-calido-200 bg-transparent py-2 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
              />
            </label>
            <Button as="button" type="submit" disabled={cambiarEstado.isPending} className="w-fit">
              {cambiarEstado.isPending ? 'Guardando…' : 'Confirmar cambio'}
            </Button>
            {errorEnvio && (
              <p role="alert" className="text-sm text-red-700">
                {errorEnvio}
              </p>
            )}
          </form>
        </section>
      </div>

      <div className="mt-10 border-t border-gris-calido-200 pt-6">
        <span className="versalitas text-xs text-cobre">— Historial de estados</span>

        {cargandoHistorial && (
          <div className="py-8">
            <Loader label="Cargando historial" />
          </div>
        )}

        {historial && historial.length === 0 && (
          <p className="py-6 text-sm text-gris-calido-700">Sin cambios de estado registrados.</p>
        )}

        {historial && historial.length > 0 && (
          <div className="mt-4">
            {historial.map((evento) => (
              <div key={evento.id} className="border-b border-gris-calido-200 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm text-negro-barbero">
                    {NOMBRE_ESTADO[evento.estado_anterior_id] ?? '—'} →{' '}
                    <strong>{NOMBRE_ESTADO[evento.estado_nuevo_id]}</strong>
                  </span>
                  <span className="numeros-tabulares text-xs text-gris-calido-500">
                    {formatoFecha(evento.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gris-calido-700">{evento.motivo}</p>
                <p className="versalitas mt-1 text-xs text-gris-calido-400">
                  por {evento.usuarios?.nombre ?? 'usuario eliminado'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
