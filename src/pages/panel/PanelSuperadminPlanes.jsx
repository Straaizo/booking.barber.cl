import { useState } from 'react'
import { Loader } from '../../components/common/Loader'
import { Button } from '../../components/common/Button'
import { usePlanesSuperadmin, useCrearPlan, useActualizarPlan } from './hooks/usePlanesSuperadmin'
import { FilaPlan } from './components/FilaPlan'

const PLAN_VACIO = { nombre: '', precio_clp: '', max_barberos: '' }

export function PanelSuperadminPlanes() {
  const { data: planes, isLoading, isError } = usePlanesSuperadmin()
  const crearPlan = useCrearPlan()
  const actualizarPlan = useActualizarPlan()

  const [nuevo, setNuevo] = useState(PLAN_VACIO)
  const [errorEnvio, setErrorEnvio] = useState(null)

  async function agregarPlan(evento) {
    evento.preventDefault()
    setErrorEnvio(null)
    const precio = Number(nuevo.precio_clp)
    const maxBarberos = Number(nuevo.max_barberos)
    if (!nuevo.nombre.trim() || !Number.isFinite(precio) || !Number.isFinite(maxBarberos)) {
      setErrorEnvio('Completa nombre, precio y máximo de barberos.')
      return
    }
    try {
      await crearPlan.mutateAsync({
        nombre: nuevo.nombre.trim(),
        precio_clp: precio,
        max_barberos: maxBarberos,
        orden: (planes?.length ?? 0) + 1,
      })
      setNuevo(PLAN_VACIO)
    } catch {
      setErrorEnvio('No pudimos crear el plan. Intenta de nuevo.')
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
        Planes
      </h1>
      <p className="mt-2 max-w-lg text-sm text-gris-calido-700">
        Los planes que las barberías pueden contratar. Los cambios se reflejan de inmediato en la
        landing y en los límites de cada barbería.
      </p>

      <div className="mt-8">
        {isLoading && (
          <div className="py-12">
            <Loader label="Cargando planes" />
          </div>
        )}

        {isError && (
          <p role="alert" className="py-8 text-sm text-red-700">
            No pudimos cargar los planes. Recarga la página o intenta más tarde.
          </p>
        )}

        {planes && planes.length > 0 && (
          <div className="border-t border-gris-calido-200">
            {planes.map((plan) => (
              <FilaPlan
                key={plan.id}
                plan={plan}
                onGuardar={(cambios) => actualizarPlan.mutateAsync({ id: plan.id, cambios })}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 border-t border-cobre/25 pt-6">
        <span className="versalitas text-xs text-cobre">— Nuevo plan</span>
        <form
          onSubmit={agregarPlan}
          className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-[1fr_8rem_8rem_auto] md:items-end"
        >
          <label className="col-span-2 flex flex-col gap-2 md:col-span-1">
            <span className="versalitas text-xs text-gris-calido-500">Nombre</span>
            <input
              type="text"
              value={nuevo.nombre}
              onChange={(e) => setNuevo((n) => ({ ...n, nombre: e.target.value }))}
              placeholder="Ej: Premium"
              className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="versalitas text-xs text-gris-calido-500">Precio/mes</span>
            <input
              type="number"
              min="0"
              value={nuevo.precio_clp}
              onChange={(e) => setNuevo((n) => ({ ...n, precio_clp: e.target.value }))}
              placeholder="8000"
              className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="versalitas text-xs text-gris-calido-500">Máx. barberos</span>
            <input
              type="number"
              min="1"
              value={nuevo.max_barberos}
              onChange={(e) => setNuevo((n) => ({ ...n, max_barberos: e.target.value }))}
              placeholder="5"
              className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
            />
          </label>
          <Button as="button" type="submit" disabled={crearPlan.isPending} className="h-fit">
            {crearPlan.isPending ? 'Creando…' : 'Crear plan'}
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
