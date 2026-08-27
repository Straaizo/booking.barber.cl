import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Interruptor } from '../../../components/panel/Interruptor'

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
    <div className="flex flex-col gap-3 border-b border-gris-calido-200 py-5">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-[1fr_10rem_8rem_6rem]">
        <label className="col-span-2 flex flex-col gap-1 md:col-span-1">
          <span className="versalitas text-xs text-gris-calido-500">Título</span>
          <input
            type="text"
            value={campos.titulo}
            onChange={(e) => setCampos((c) => ({ ...c, titulo: e.target.value }))}
            onBlur={() => commitTexto('titulo')}
            className="min-h-11 border-b border-gris-calido-200 bg-transparent py-1 font-medium text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="versalitas text-xs text-gris-calido-500">Etiqueta (opcional)</span>
          <input
            type="text"
            value={campos.etiqueta}
            placeholder="Ej: Nuevo"
            onChange={(e) => setCampos((c) => ({ ...c, etiqueta: e.target.value }))}
            onBlur={() => commitTexto('etiqueta')}
            className="min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="versalitas text-xs text-gris-calido-500">Fecha</span>
          <input
            type="date"
            value={campos.fecha}
            onChange={(e) => setCampos((c) => ({ ...c, fecha: e.target.value }))}
            onBlur={commitFecha}
            className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="versalitas text-xs text-gris-calido-500">Orden</span>
          <input
            type="number"
            min="0"
            value={campos.orden}
            onChange={(e) => setCampos((c) => ({ ...c, orden: e.target.value }))}
            onBlur={() => commitNumero('orden', campos.orden, novedad.orden)}
            className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="versalitas text-xs text-gris-calido-500">Descripción</span>
        <textarea
          rows={2}
          value={campos.descripcion}
          onChange={(e) => setCampos((c) => ({ ...c, descripcion: e.target.value }))}
          onBlur={() => commitTexto('descripcion')}
          className="border-b border-gris-calido-200 bg-transparent py-1 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
        />
      </label>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Interruptor
            activo={Boolean(novedad.activo)}
            etiqueta="Visible en el landing"
            onCambiar={(valor) => guardar({ activo: valor ? 1 : 0 })}
          />
          <span className="versalitas text-xs text-gris-calido-500">
            {novedad.activo ? 'Visible en el landing' : 'Oculta'}
          </span>
        </div>

        <div className="flex items-center gap-4">
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
            className="versalitas text-xs text-gris-calido-500 hover:text-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
