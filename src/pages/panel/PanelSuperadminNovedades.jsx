import { useState } from 'react'
import { Loader } from '../../components/common/Loader'
import { Button } from '../../components/common/Button'
import {
  useNovedadesSuperadmin,
  useCrearNovedad,
  useActualizarNovedad,
  useEliminarNovedad,
} from './hooks/useNovedadesSuperadmin'
import { FilaNovedad } from './components/FilaNovedad'

function hoyISO() {
  const ahora = new Date()
  const mes = String(ahora.getMonth() + 1).padStart(2, '0')
  const dia = String(ahora.getDate()).padStart(2, '0')
  return `${ahora.getFullYear()}-${mes}-${dia}`
}

const NUEVA_VACIA = { titulo: '', descripcion: '', etiqueta: '' }

export function PanelSuperadminNovedades() {
  const { data: novedades, isLoading, isError } = useNovedadesSuperadmin()
  const crear = useCrearNovedad()
  const actualizar = useActualizarNovedad()
  const eliminar = useEliminarNovedad()

  const [nueva, setNueva] = useState(NUEVA_VACIA)
  const [errorEnvio, setErrorEnvio] = useState(null)

  async function agregarNovedad(evento) {
    evento.preventDefault()
    setErrorEnvio(null)
    if (!nueva.titulo.trim() || !nueva.descripcion.trim()) {
      setErrorEnvio('Completa título y descripción.')
      return
    }
    try {
      await crear.mutateAsync({
        titulo: nueva.titulo.trim(),
        descripcion: nueva.descripcion.trim(),
        etiqueta: nueva.etiqueta.trim() || null,
        fecha: hoyISO(),
        orden: (novedades?.length ?? 0) + 1,
        activo: 1,
      })
      setNueva(NUEVA_VACIA)
    } catch {
      setErrorEnvio('No pudimos crear la novedad. Intenta de nuevo.')
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
        Novedades
      </h1>
      <p className="mt-2 max-w-lg text-sm text-gris-calido-700">
        Las actualizaciones y funcionalidades nuevas que se muestran en el carrusel del landing —
        "visible en el landing" las apaga sin borrarlas, por si quieres reactivar una más adelante.
      </p>

      <div className="mt-8">
        {isLoading && (
          <div className="py-12">
            <Loader label="Cargando novedades" />
          </div>
        )}

        {isError && (
          <p role="alert" className="py-8 text-sm text-red-700">
            No pudimos cargar las novedades. Recarga la página o intenta más tarde.
          </p>
        )}

        {novedades && novedades.length > 0 && (
          <div className="border-t border-gris-calido-200">
            {novedades.map((novedad) => (
              <FilaNovedad
                key={novedad.id}
                novedad={novedad}
                onGuardar={(cambios) => actualizar.mutateAsync({ id: novedad.id, cambios })}
                onEliminar={() => eliminar.mutateAsync(novedad.id)}
              />
            ))}
          </div>
        )}

        {novedades && novedades.length === 0 && (
          <p className="border-t border-gris-calido-200 py-8 text-sm text-gris-calido-500">
            Todavía no hay ninguna novedad cargada.
          </p>
        )}
      </div>

      <div className="mt-10 border-t border-cobre/25 pt-6">
        <span className="versalitas text-xs text-cobre">— Nueva novedad</span>
        <form onSubmit={agregarNovedad} className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-[1fr_10rem]">
            <label className="col-span-2 flex flex-col gap-2 md:col-span-1">
              <span className="versalitas text-xs text-gris-calido-500">Título</span>
              <input
                type="text"
                value={nueva.titulo}
                onChange={(e) => setNueva((n) => ({ ...n, titulo: e.target.value }))}
                placeholder="Ej: Modo oscuro para tu página"
                className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="versalitas text-xs text-gris-calido-500">Etiqueta (opcional)</span>
              <input
                type="text"
                value={nueva.etiqueta}
                onChange={(e) => setNueva((n) => ({ ...n, etiqueta: e.target.value }))}
                placeholder="Ej: Nuevo"
                className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2">
            <span className="versalitas text-xs text-gris-calido-500">Descripción</span>
            <textarea
              rows={2}
              value={nueva.descripcion}
              onChange={(e) => setNueva((n) => ({ ...n, descripcion: e.target.value }))}
              placeholder="Contale a las barberías qué cambió, en un par de líneas."
              className="border-b border-gris-calido-200 bg-transparent py-2 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
            />
          </label>
          <Button as="button" type="submit" disabled={crear.isPending} className="w-fit">
            {crear.isPending ? 'Creando…' : 'Crear novedad'}
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
