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
        <p className="text-sm text-gris-calido-600">
          Marca uno o varios barberos y el servicio queda solo para ellos. Sin ninguno marcado, el
          servicio queda disponible para cualquier barbero.
        </p>
        <div className="flex flex-col gap-3">
          {barberos?.map((barbero) => (
            <label key={barbero.id} className="flex items-center gap-2 text-sm text-negro-barbero">
              <input
                type="checkbox"
                checked={seleccionados.includes(barbero.id)}
                onChange={() => alternar(barbero.id)}
                className="h-4 w-4 accent-cobre"
              />
              {barbero.nombre}
            </label>
          ))}
          {!barberos?.length && (
            <p className="text-sm text-gris-calido-400">Todavía no tienes barberos creados.</p>
          )}
        </div>
        <button
          type="submit"
          className="mt-1 rounded-md bg-cobre-oscuro px-4 py-2.5 text-sm font-semibold text-hueso transition-[filter] hover:brightness-110"
        >
          Guardar
        </button>
      </form>
    </ModalFormulario>
  )
}
