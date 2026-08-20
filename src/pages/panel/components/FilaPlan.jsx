import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const ESTADOS = { guardando: 'Guardando…', guardado: 'Guardado', error: 'No se pudo guardar' }

export function FilaPlan({ plan, onGuardar }) {
  const [campos, setCampos] = useState({
    nombre: plan.nombre,
    precio_clp: String(plan.precio_clp),
    max_barberos: String(plan.max_barberos),
    orden: String(plan.orden),
  })
  const [estado, setEstado] = useState(null)

  useEffect(() => {
    setCampos({
      nombre: plan.nombre,
      precio_clp: String(plan.precio_clp),
      max_barberos: String(plan.max_barberos),
      orden: String(plan.orden),
    })
  }, [plan])

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

  function commitTexto() {
    if (campos.nombre.trim() && campos.nombre !== plan.nombre) guardar({ nombre: campos.nombre.trim() })
  }

  function commitNumero(campo, crudo, original) {
    const valor = Number(crudo)
    if (!Number.isFinite(valor) || valor === original) return
    guardar({ [campo]: valor })
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-gris-calido-200 py-5 md:grid-cols-[1fr_8rem_8rem_6rem_6rem] md:items-center">
      <label className="col-span-2 flex flex-col gap-1 md:col-span-1">
        <span className="versalitas text-xs text-gris-calido-500">Nombre</span>
        <input
          type="text"
          name="nombre"
          value={campos.nombre}
          onChange={(e) => setCampos((c) => ({ ...c, nombre: e.target.value }))}
          onBlur={commitTexto}
          className="min-h-11 border-b border-gris-calido-200 bg-transparent py-1 font-medium text-negro-barbero outline-none transition-colors focus:border-cobre"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="versalitas text-xs text-gris-calido-500">Precio/mes</span>
        <input
          type="number"
          min="0"
          name="precio_clp"
          value={campos.precio_clp}
          onChange={(e) => setCampos((c) => ({ ...c, precio_clp: e.target.value }))}
          onBlur={() => commitNumero('precio_clp', campos.precio_clp, plan.precio_clp)}
          className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="versalitas text-xs text-gris-calido-500">Máx. barberos</span>
        <input
          type="number"
          min="1"
          name="max_barberos"
          value={campos.max_barberos}
          onChange={(e) => setCampos((c) => ({ ...c, max_barberos: e.target.value }))}
          onBlur={() => commitNumero('max_barberos', campos.max_barberos, plan.max_barberos)}
          className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="versalitas text-xs text-gris-calido-500">Orden</span>
        <input
          type="number"
          min="0"
          name="orden"
          value={campos.orden}
          onChange={(e) => setCampos((c) => ({ ...c, orden: e.target.value }))}
          onBlur={() => commitNumero('orden', campos.orden, plan.orden)}
          className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
        />
      </label>

      <div className="min-w-26">
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
      </div>
    </div>
  )
}
