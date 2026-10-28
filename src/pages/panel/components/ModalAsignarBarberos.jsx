import { useEffect, useState } from 'react'
import { ModalFormulario } from '../../../components/panel/ModalFormulario'

// Compartido entre `FilaServicioAdmin` (servicio ya creado) y `PanelServicios`
// (formulario de "Nuevo servicio") — misma card difuminada en los dos casos,
// para no duplicar el explicativo de qué significa marcar uno o ninguno.
export function ModalAsignarBarberos({ abierto, servicioNombre, barberos, barberoIds, onGuardar, onCerrar }) {
  const [seleccionados, setSeleccionados] = useState(barberoIds ?? [])

  useEffect(() => {
    if (abierto) setSeleccionados(barberoIds ?? [])
  }, [abierto, barberoIds])

  function alternar(id) {
    setSeleccionados((actuales) =>
      actuales.includes(id) ? actuales.filter((existente) => existente !== id) : [...actuales, id]
    )
  }

  function guardar(evento) {
    evento.preventDefault()
    onGuardar(seleccionados)
    onCerrar()
  }

  return (
    <ModalFormulario abierto={abierto} titulo={`Barberos — ${servicioNombre}`} onCerrar={onCerrar}>
      <form onSubmit={guardar} className="flex flex-col gap-4">
        <p className="text-[15px] text-gris-calido-600 md:text-sm">
          Marca uno o varios barberos y el servicio queda solo para ellos. Sin ninguno marcado, el
          servicio queda disponible para cualquier barbero.
        </p>
        <div className="flex flex-col divide-y divide-gris-calido-100 overflow-hidden rounded-xl border border-gris-calido-200 md:gap-3 md:divide-y-0 md:overflow-visible md:rounded-none md:border-0">
          {barberos?.map((barbero) => (
            <label key={barbero.id} className="flex min-h-13 items-center gap-3 px-4 text-base text-negro-barbero md:min-h-0 md:gap-2 md:px-0 md:text-sm">
              <input
                type="checkbox"
                checked={seleccionados.includes(barbero.id)}
                onChange={() => alternar(barbero.id)}
                className="h-5 w-5 accent-cobre md:h-4 md:w-4"
              />
              {barbero.nombre}
            </label>
          ))}
          {!barberos?.length && (
            <p className="px-4 py-3 text-[15px] text-gris-calido-400 md:p-0 md:text-sm">Todavía no tienes barberos creados.</p>
          )}
        </div>
        <button
          type="submit"
          className="mt-1 min-h-12 rounded-xl bg-cobre-oscuro px-4 py-2.5 text-base font-semibold md:min-h-0 md:rounded-md md:text-sm text-hueso transition-[filter] hover:brightness-110"
        >
          Guardar
        </button>
      </form>
    </ModalFormulario>
  )
}
