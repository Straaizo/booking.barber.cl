import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Interruptor } from '../../../components/panel/Interruptor'
import { IconoPapelera } from '../../../components/panel/IconoPapelera'

const ESTADOS = { guardando: 'Guardando…', guardado: 'Guardado', error: 'No se pudo guardar' }

export function FilaNovedad({ novedad, onGuardar, onEliminar }) {
  const [campos, setCampos] = useState({
    titulo: novedad.titulo,
    descripcion: novedad.descripcion,
    etiqueta: novedad.etiqueta ?? '',
    fecha: novedad.fecha,
    orden: String(novedad.orden),
  })
  const [estado, setEstado] = useState(null)
  const [abierta, setAbierta] = useState(false)

  useEffect(() => {
    setCampos({
      titulo: novedad.titulo,
      descripcion: novedad.descripcion,
      etiqueta: novedad.etiqueta ?? '',
      fecha: novedad.fecha,
      orden: String(novedad.orden),
    })
  }, [novedad])

  useEffect(() => {
    if (estado !== 'guardado') return
    const t = setTimeout(() => setEstado(null), 1800)
    return () => clearTimeout(t)
  }, [estado])

  async function guardar(cambios) {
    setEstado('guardando')
    try {
      await onGuardar(cambios)
      setEstado('guardado')
    } catch {
      setEstado('error')
    }
  }

  function commitTexto(campo) {
    const valor = campos[campo].trim()
    const original = campo === 'etiqueta' ? (novedad.etiqueta ?? '') : novedad[campo]
    if (valor === original) return
    guardar({ [campo]: campo === 'etiqueta' ? valor || null : valor })
  }

  function commitNumero(campo, crudo, original) {
    const valor = Number(crudo)
    if (!Number.isFinite(valor) || valor === original) return
    guardar({ [campo]: valor })
  }

  function commitFecha() {
    if (campos.fecha === novedad.fecha) return
    guardar({ fecha: campos.fecha })
  }

  return (
    <div className="flex flex-col gap-3 border-b border-gris-calido-200 py-5 max-md:gap-4 max-md:rounded-2xl max-md:border max-md:bg-white max-md:p-4">
      {/* En el celular cada novedad se muestra resumida y se despliega al
          tocarla — con todos los campos abiertos la lista se hacía eterna. */}
      <button
        type="button"
        onClick={() => setAbierta((a) => !a)}
        aria-expanded={abierta}
        className="-my-1 flex min-h-11 w-full items-center gap-3 text-left md:hidden"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-semibold text-negro-barbero">
            {campos.titulo || 'Sin título'}
          </span>
          <span className="numeros-tabulares mt-0.5 flex items-center gap-2 text-[14px] text-gris-calido-500">
            {campos.etiqueta && (
              <span className="rounded-full bg-cobre/10 px-2 py-0.5 text-[12px] font-medium text-cobre-texto">
                {campos.etiqueta}
              </span>
            )}
            {campos.fecha &&
              new Date(`${campos.fecha}T00:00`).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 text-gris-calido-400 transition-transform ${abierta ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className={abierta ? 'contents' : 'contents max-md:hidden'}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-[1fr_10rem_8rem_6rem]">
        <label className="col-span-2 flex flex-col gap-1 md:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-[0.07em] text-gris-calido-500 max-md:text-[13px] max-md:tracking-[0.06em]">Título</span>
          <input
            type="text"
            value={campos.titulo}
            onChange={(e) => setCampos((c) => ({ ...c, titulo: e.target.value }))}
            onBlur={() => commitTexto('titulo')}
            className="min-h-11 border-b border-gris-calido-200 bg-transparent py-1 font-medium text-negro-barbero outline-none transition-colors focus:border-cobre max-md:min-h-12 max-md:rounded-xl max-md:border max-md:bg-white max-md:px-3.5"
          />
        </label>

        <label className="flex flex-col gap-1 max-md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.07em] text-gris-calido-500 max-md:text-[13px] max-md:tracking-[0.06em]">Etiqueta (opcional)</span>
          <input
            type="text"
            value={campos.etiqueta}
            placeholder="Ej: Nuevo"
            onChange={(e) => setCampos((c) => ({ ...c, etiqueta: e.target.value }))}
            onBlur={() => commitTexto('etiqueta')}
            className="min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre max-md:min-h-12 max-md:rounded-xl max-md:border max-md:bg-white max-md:px-3.5"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.07em] text-gris-calido-500 max-md:text-[13px] max-md:tracking-[0.06em]">Fecha</span>
          <input
            type="date"
            value={campos.fecha}
            onChange={(e) => setCampos((c) => ({ ...c, fecha: e.target.value }))}
            onBlur={commitFecha}
            className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre max-md:min-h-12 max-md:rounded-xl max-md:border max-md:bg-white max-md:px-3.5"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.07em] text-gris-calido-500 max-md:text-[13px] max-md:tracking-[0.06em]">Orden</span>
          <input
            type="number"
            min="0"
            value={campos.orden}
            onChange={(e) => setCampos((c) => ({ ...c, orden: e.target.value }))}
            onBlur={() => commitNumero('orden', campos.orden, novedad.orden)}
            className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre max-md:min-h-12 max-md:rounded-xl max-md:border max-md:bg-white max-md:px-3.5"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.07em] text-gris-calido-500 max-md:text-[13px] max-md:tracking-[0.06em]">Descripción</span>
        <textarea
          rows={2}
          value={campos.descripcion}
          onChange={(e) => setCampos((c) => ({ ...c, descripcion: e.target.value }))}
          onBlur={() => commitTexto('descripcion')}
          className="border-b border-gris-calido-200 bg-transparent py-1 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre max-md:rounded-xl max-md:border max-md:bg-white max-md:px-3.5 max-md:py-3 max-md:text-base"
        />
      </label>
      </div>

      <div className="flex items-center justify-between gap-4 max-md:-mx-4 max-md:-mb-4 max-md:border-t max-md:border-gris-calido-100 max-md:px-4 max-md:py-2">
        <div className="flex items-center gap-3 max-md:min-w-0">
          <Interruptor
            activo={Boolean(novedad.activo)}
            etiqueta="Visible en el landing"
            onCambiar={(valor) => guardar({ activo: valor ? 1 : 0 })}
          />
          <span className="text-xs font-semibold uppercase tracking-[0.07em] text-gris-calido-500 max-md:text-[14px] max-md:font-normal max-md:normal-case max-md:tracking-normal max-md:text-gris-calido-700">
            {novedad.activo ? 'Visible en el landing' : 'Oculta'}
          </span>
        </div>

        <div className="flex items-center gap-4 max-md:shrink-0 max-md:gap-2">
          <AnimatePresence mode="wait">
            {estado && (
              <motion.span
                key={estado}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                role={estado === 'error' ? 'alert' : undefined}
                className={`versalitas text-xs ${estado === 'error' ? 'text-red-700' : 'text-verde-barberia'}`}
              >
                {ESTADOS[estado]}
              </motion.span>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={onEliminar}
            className="versalitas flex items-center gap-1.5 text-xs text-gris-calido-500 hover:text-red-700 max-md:-mr-2 max-md:min-h-11 max-md:px-2 max-md:text-[13px]"
          >
            <IconoPapelera className="h-3.5 w-3.5" />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
