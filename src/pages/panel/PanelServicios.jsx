import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../../components/common/Loader'
import { Button } from '../../components/common/Button'
import { useServiciosAdmin, useCrearServicio, useActualizarServicioAdmin } from './hooks/useServiciosAdmin'
import { FilaServicioAdmin } from './components/FilaServicioAdmin'

const SERVICIO_VACIO = { nombre: '', duracion_minutos: '30', precio_clp: '' }

export function PanelServicios() {
  const { perfil } = useAuth()
  const { data: servicios, isLoading, isError } = useServiciosAdmin(perfil.barberia_id)
  const crearServicio = useCrearServicio(perfil.barberia_id)
  const actualizarServicio = useActualizarServicioAdmin(perfil.barberia_id)

  const [nuevo, setNuevo] = useState(SERVICIO_VACIO)
  const [errorEnvio, setErrorEnvio] = useState(null)

  async function agregarServicio(evento) {
    evento.preventDefault()
    setErrorEnvio(null)
    const duracion = Number(nuevo.duracion_minutos)
    const precio = Number(nuevo.precio_clp)
    if (!nuevo.nombre.trim() || !Number.isFinite(duracion) || !Number.isFinite(precio)) {
      setErrorEnvio('Completa nombre, duración y precio.')
      return
    }
    try {
      await crearServicio.mutateAsync({
        nombre: nuevo.nombre.trim(),
        duracion_minutos: duracion,
        precio_clp: precio,
        precio_oferta: null,
        oferta_activa: false,
      })
      setNuevo(SERVICIO_VACIO)
    } catch {
      setErrorEnvio('No pudimos crear el servicio. Intenta de nuevo.')
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
        Servicios
      </h1>
      <p className="mt-2 max-w-lg text-sm text-gris-calido-700">
        Crea y edita los servicios que tus clientes ven al reservar. Los cambios se guardan solos.
      </p>

      <div className="mt-8">
        {isLoading && (
          <div className="py-12">
            <Loader label="Cargando servicios" />
          </div>
        )}

        {isError && (
          <p role="alert" className="py-8 text-sm text-red-700">
            No pudimos cargar los servicios. Recarga la página o intenta más tarde.
          </p>
        )}

        {servicios && servicios.length === 0 && (
          <p className="py-8 text-sm text-gris-calido-700">
            Aún no tienes servicios. Crea el primero abajo.
          </p>
        )}

        {servicios && servicios.length > 0 && (
          <div className="border-t border-gris-calido-200">
            {servicios.map((servicio) => (
              <FilaServicioAdmin
                key={servicio.id}
                servicio={servicio}
                onGuardar={(cambios) => actualizarServicio.mutateAsync({ id: servicio.id, cambios })}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 border-t border-cobre/25 pt-6">
        <span className="versalitas text-xs text-cobre">— Nuevo servicio</span>
        <form
          onSubmit={agregarServicio}
          className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-[1.4fr_6rem_8rem_auto] md:items-end"
        >
          <label className="col-span-2 flex flex-col gap-2 md:col-span-1">
            <span className="versalitas text-xs text-gris-calido-500">Nombre</span>
            <input
              type="text"
              value={nuevo.nombre}
              onChange={(e) => setNuevo((n) => ({ ...n, nombre: e.target.value }))}
              placeholder="Ej: Corte + Barba"
              className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="versalitas text-xs text-gris-calido-500">Duración (min)</span>
            <input
              type="number"
              min="0"
              value={nuevo.duracion_minutos}
              onChange={(e) => setNuevo((n) => ({ ...n, duracion_minutos: e.target.value }))}
              className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="versalitas text-xs text-gris-calido-500">Precio</span>
            <input
              type="number"
              min="0"
              value={nuevo.precio_clp}
              onChange={(e) => setNuevo((n) => ({ ...n, precio_clp: e.target.value }))}
              placeholder="12000"
              className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
            />
          </label>
          <Button as="button" type="submit" disabled={crearServicio.isPending} className="h-fit">
            {crearServicio.isPending ? 'Creando…' : 'Crear servicio'}
          </Button>
        </form>
        {errorEnvio && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {errorEnvio}
          </p>
        )}
      </div>
    </div>
  )
}
