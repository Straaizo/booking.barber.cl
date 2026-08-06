import { useAuth } from '../../hooks/useAuth'
import { PanelShell } from '../../components/panel/PanelShell'
import { Loader } from '../../components/common/Loader'
import { useServiciosDeBarberia, useActualizarPrecioServicio } from './hooks/useServiciosPanel'
import { FilaServicioPrecio } from './components/FilaServicioPrecio'

export function PanelBarbero() {
  const { perfil } = useAuth()
  const { data: servicios, isLoading, isError } = useServiciosDeBarberia(perfil.barberia_id)
  const actualizarPrecio = useActualizarPrecioServicio(perfil.barberia_id)

  return (
    <PanelShell titulo="Mis precios">
      <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
        Mis precios
      </h1>
      <p className="mt-2 max-w-lg text-sm text-gris-calido-700">
        Puedes actualizar el precio normal, el precio de oferta y activar o desactivar la oferta
        de cada servicio. El nombre y la duración los administra tu barbería.
      </p>

      <div className="mt-8">
        {isLoading && (
          <div className="py-12">
            <Loader label="Cargando servicios" />
          </div>
        )}

        {isError && (
          <p role="alert" className="py-8 text-sm text-red-700">
            No pudimos cargar tus servicios. Recarga la página o intenta más tarde.
          </p>
        )}

        {servicios && servicios.length === 0 && (
          <p className="py-8 text-sm text-gris-calido-700">
            Tu barbería aún no tiene servicios cargados. Pídele a tu administrador que los cree.
          </p>
        )}

        {servicios && servicios.length > 0 && (
          <div className="border-t border-gris-calido-200">
            {servicios.map((servicio) => (
              <FilaServicioPrecio
                key={servicio.id}
                servicio={servicio}
                onGuardar={(cambios) => actualizarPrecio.mutateAsync({ id: servicio.id, cambios })}
              />
            ))}
          </div>
        )}
      </div>
    </PanelShell>
  )
}
