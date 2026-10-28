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
import { ModalConfirmacion } from '../../components/panel/ModalConfirmacion'

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
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [novedadAEliminar, setNovedadAEliminar] = useState(null)

  async function confirmarEliminar() {
    try {
      await eliminar.mutateAsync(novedadAEliminar.id)
    } catch {
      setErrorEnvio('No se pudo eliminar la novedad. Intenta de nuevo.')
    } finally {
      setNovedadAEliminar(null)
    }
  }

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
      <h1 className="font-display text-[28px] font-light leading-tight tracking-tight text-negro-barbero md:text-3xl md:leading-9">
        Novedades
      </h1>
      <p className="mt-1 text-[15px] text-gris-calido-500 md:hidden">
        Lo que se muestra en el carrusel del landing.
      </p>
      <p className="mt-2 hidden max-w-lg text-sm text-gris-calido-700 md:block">
        Las actualizaciones y funcionalidades nuevas que se muestran en el carrusel del landing —
        "visible en el landing" las apaga sin borrarlas, por si quieres reactivar una más adelante.
      </p>

      <div className="mt-8 max-md:mt-6">
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
          <div className="border-t border-gris-calido-200 max-md:flex max-md:flex-col max-md:gap-3 max-md:border-t-0">
            {novedades.map((novedad) => (
              <FilaNovedad
                key={novedad.id}
                novedad={novedad}
                onGuardar={(cambios) => actualizar.mutateAsync({ id: novedad.id, cambios })}
                onEliminar={() => setNovedadAEliminar(novedad)}
              />
            ))}
          </div>
        )}

        {novedades && novedades.length === 0 && (
          <p className="border-t border-gris-calido-200 py-8 text-sm text-gris-calido-500 max-md:rounded-2xl max-md:border max-md:bg-white max-md:p-4 max-md:text-[15px]">
            Todavía no hay ninguna novedad cargada.
          </p>
        )}
      </div>

      {/* En el celular el formulario de alta queda plegado tras un botón */}
      {!formularioAbierto && (
        <Button
          as="button"
          type="button"
          onClick={() => setFormularioAbierto(true)}
          className="mt-6 min-h-12 w-full max-md:rounded-xl max-md:text-base md:hidden"
        >
          + Nueva novedad
        </Button>
      )}

      <div
        className={`relative mt-10 border-t border-cobre/25 pt-6 max-md:mt-6 max-md:rounded-2xl max-md:border max-md:border-gris-calido-200 max-md:bg-white max-md:p-4 ${formularioAbierto ? '' : 'max-md:hidden'}`}
      >
        <button
          type="button"
          onClick={() => setFormularioAbierto(false)}
          className="absolute right-2 top-1.5 min-h-11 px-2 text-[15px] text-gris-calido-500 md:hidden"
        >
          Cancelar
        </button>
        <span className="text-xs font-semibold uppercase tracking-[0.07em] text-cobre max-md:text-[13px] max-md:tracking-[0.06em] max-md:text-gris-calido-500">— Nueva novedad</span>
        <form onSubmit={agregarNovedad} className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-[1fr_10rem]">
            <label className="col-span-2 flex flex-col gap-2 md:col-span-1">
              <span className="text-xs font-semibold uppercase tracking-[0.07em] text-gris-calido-500 max-md:text-[13px] max-md:tracking-[0.06em]">Título</span>
              <input
                type="text"
                value={nueva.titulo}
                onChange={(e) => setNueva((n) => ({ ...n, titulo: e.target.value }))}
                placeholder="Ej: Modo oscuro para tu página"
                className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre max-md:min-h-12 max-md:rounded-xl max-md:border max-md:bg-white max-md:px-3.5"
              />
            </label>
            <label className="flex flex-col gap-2 max-md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.07em] text-gris-calido-500 max-md:text-[13px] max-md:tracking-[0.06em]">Etiqueta (opcional)</span>
              <input
                type="text"
                value={nueva.etiqueta}
                onChange={(e) => setNueva((n) => ({ ...n, etiqueta: e.target.value }))}
                placeholder="Ej: Nuevo"
                className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre max-md:min-h-12 max-md:rounded-xl max-md:border max-md:bg-white max-md:px-3.5"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.07em] text-gris-calido-500 max-md:text-[13px] max-md:tracking-[0.06em]">Descripción</span>
            <textarea
              rows={2}
              value={nueva.descripcion}
              onChange={(e) => setNueva((n) => ({ ...n, descripcion: e.target.value }))}
              placeholder="Cuéntale a las barberías qué cambió, en un par de líneas."
              className="border-b border-gris-calido-200 bg-transparent py-2 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre max-md:rounded-xl max-md:border max-md:bg-white max-md:px-3.5 max-md:py-3 max-md:text-base"
            />
          </label>
          <Button as="button" type="submit" disabled={crear.isPending} className="w-fit max-md:min-h-12 max-md:w-full max-md:rounded-xl max-md:text-base">
            {crear.isPending ? 'Creando…' : 'Crear novedad'}
          </Button>
        </form>
        {errorEnvio && (
          <p role="alert" className="mt-3 text-sm text-red-700 max-md:text-[15px]">
            {errorEnvio}
          </p>
        )}
      </div>

      <ModalConfirmacion
        abierto={Boolean(novedadAEliminar)}
        titulo="Eliminar novedad"
        mensaje={novedadAEliminar && `"${novedadAEliminar.titulo}" deja de mostrarse en la página de inicio. No se puede deshacer.`}
        textoConfirmar="Eliminar"
        textoCancelar="Volver"
        confirmando={eliminar.isPending}
        onConfirmar={confirmarEliminar}
        onCerrar={() => setNovedadAEliminar(null)}
      />
    </div>
  )
}
