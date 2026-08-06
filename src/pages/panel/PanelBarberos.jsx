import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../../components/common/Loader'
import { Button } from '../../components/common/Button'
import { Interruptor } from '../../components/panel/Interruptor'
import { useBarberiaAdmin } from './hooks/useBarberiaAdmin'
import { useBarberosAdmin, useCrearBarbero, useActualizarBarbero } from './hooks/useBarberosAdmin'

export function PanelBarberos() {
  const { perfil } = useAuth()
  const { data: barberia } = useBarberiaAdmin(perfil.barberia_id)
  const { data: barberos, isLoading, isError } = useBarberosAdmin(perfil.barberia_id)
  const crearBarbero = useCrearBarbero(perfil.barberia_id)
  const actualizarBarbero = useActualizarBarbero(perfil.barberia_id)

  const [nombreNuevo, setNombreNuevo] = useState('')
  const [errorEnvio, setErrorEnvio] = useState(null)

  const maxBarberos = barberia?.planes?.max_barberos ?? null
  const totalBarberos = barberos?.length ?? 0
  const limiteAlcanzado = maxBarberos !== null && totalBarberos >= maxBarberos

  async function agregarBarbero(evento) {
    evento.preventDefault()
    if (!nombreNuevo.trim()) return
    setErrorEnvio(null)
    try {
      await crearBarbero.mutateAsync(nombreNuevo.trim())
      setNombreNuevo('')
    } catch {
      setErrorEnvio('No pudimos agregar el barbero. Intenta de nuevo.')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
          Barberos
        </h1>
        {maxBarberos !== null && (
          <span className="numeros-tabulares text-sm text-gris-calido-500">
            {totalBarberos} / {maxBarberos}{' '}
            <span className="versalitas text-xs">según tu plan {barberia?.planes?.nombre}</span>
          </span>
        )}
      </div>

      <div className="mt-8">
        {isLoading && (
          <div className="py-12">
            <Loader label="Cargando barberos" />
          </div>
        )}

        {isError && (
          <p role="alert" className="py-8 text-sm text-red-700">
            No pudimos cargar tus barberos. Recarga la página o intenta más tarde.
          </p>
        )}

        {barberos && barberos.length === 0 && (
          <p className="py-8 text-sm text-gris-calido-700">
            Aún no tienes barberos cargados. Agrega el primero abajo.
          </p>
        )}

        {barberos && barberos.length > 0 && (
          <div className="border-t border-gris-calido-200">
            {barberos.map((barbero) => (
              <div
                key={barbero.id}
                className="flex items-center justify-between gap-4 border-b border-gris-calido-200 py-4"
              >
                <span className={`font-medium ${barbero.activo ? 'text-negro-barbero' : 'text-gris-calido-400 line-through'}`}>
                  {barbero.nombre}
                </span>
                <div className="flex items-center gap-3">
                  <span className="versalitas text-xs text-gris-calido-500">
                    {barbero.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <Interruptor
                    activo={barbero.activo}
                    etiqueta={`Activar/desactivar a ${barbero.nombre}`}
                    onCambiar={(valor) =>
                      actualizarBarbero.mutate({ id: barbero.id, cambios: { activo: valor } })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 border-t border-cobre/25 pt-6">
        {limiteAlcanzado ? (
          <p className="text-sm text-gris-calido-700">
            Alcanzaste el límite de <strong>{maxBarberos} barberos</strong> de tu plan{' '}
            <strong>{barberia?.planes?.nombre}</strong>. Para agregar más, actualiza tu plan.
          </p>
        ) : (
          <form onSubmit={agregarBarbero} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-2">
              <span className="versalitas text-xs text-gris-calido-500">Nombre del nuevo barbero</span>
              <input
                type="text"
                value={nombreNuevo}
                onChange={(evento) => setNombreNuevo(evento.target.value)}
                placeholder="Nombre y apellido"
                className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
              />
            </label>
            <Button as="button" type="submit" disabled={crearBarbero.isPending} className="sm:w-auto">
              {crearBarbero.isPending ? 'Agregando…' : 'Agregar barbero'}
            </Button>
          </form>
        )}
        {errorEnvio && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {errorEnvio}
          </p>
        )}
      </div>
    </div>
  )
}
