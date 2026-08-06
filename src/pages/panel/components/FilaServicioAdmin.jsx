import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Interruptor } from '../../../components/panel/Interruptor'

const ESTADOS = {
  guardando: 'Guardando…',
  guardado: 'Guardado',
  error: 'No se pudo guardar',
}

export function FilaServicioAdmin({ servicio, onGuardar }) {
  const [campos, setCampos] = useState({
    nombre: servicio.nombre,
    duracion_minutos: String(servicio.duracion_minutos),
    precio_clp: String(servicio.precio_clp ?? ''),
    precio_oferta: String(servicio.precio_oferta ?? ''),
  })
  const [estado, setEstado] = useState(null)

  useEffect(() => {
    setCampos({
      nombre: servicio.nombre,
      duracion_minutos: String(servicio.duracion_minutos),
      precio_clp: String(servicio.precio_clp ?? ''),
      precio_oferta: String(servicio.precio_oferta ?? ''),
    })
  }, [servicio])

  useEffect(() => {
    if (estado !== 'guardado') return
    const temporizador = setTimeout(() => setEstado(null), 1800)
    return () => clearTimeout(temporizador)
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
    if (campos.nombre.trim() && campos.nombre !== servicio.nombre) {
      guardar({ nombre: campos.nombre.trim() })
    }
  }

  function commitNumero(campo, valorCrudo, valorOriginal, permiteVacio = false) {
    if (valorCrudo === '' && permiteVacio) {
      if (valorOriginal !== null) guardar({ [campo]: null })
      return
    }
    const valor = Number(valorCrudo)
    if (!Number.isFinite(valor) || valor === valorOriginal) return
    guardar({ [campo]: valor })
  }

  return (
    <div className="border-b border-gris-calido-200 py-5">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-[1.4fr_6rem_8rem_8rem]">
        <label className="col-span-2 flex flex-col gap-1 md:col-span-1">
          <span className="versalitas text-xs text-gris-calido-500">Nombre</span>
          <input
            type="text"
            value={campos.nombre}
            onChange={(e) => setCampos((c) => ({ ...c, nombre: e.target.value }))}
            onBlur={commitTexto}
            className="min-h-11 border-b border-gris-calido-200 bg-transparent py-1 font-medium text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="versalitas text-xs text-gris-calido-500">Duración (min)</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={campos.duracion_minutos}
            onChange={(e) => setCampos((c) => ({ ...c, duracion_minutos: e.target.value }))}
            onBlur={() =>
              commitNumero('duracion_minutos', campos.duracion_minutos, servicio.duracion_minutos)
            }
            className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="versalitas text-xs text-gris-calido-500">Precio</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={campos.precio_clp}
            onChange={(e) => setCampos((c) => ({ ...c, precio_clp: e.target.value }))}
            onBlur={() => commitNumero('precio_clp', campos.precio_clp, servicio.precio_clp)}
            className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="versalitas text-xs text-gris-calido-500">Precio oferta</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="—"
            value={campos.precio_oferta}
            onChange={(e) => setCampos((c) => ({ ...c, precio_oferta: e.target.value }))}
            onBlur={() =>
              commitNumero('precio_oferta', campos.precio_oferta, servicio.precio_oferta, true)
            }
            className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="flex items-center gap-3">
          <Interruptor
            activo={servicio.oferta_activa}
            etiqueta={`Oferta activa de ${servicio.nombre}`}
            onCambiar={(valor) => guardar({ oferta_activa: valor })}
          />
          <span className="versalitas text-xs text-gris-calido-500">Oferta activa</span>
        </div>

        <div className="flex items-center gap-3">
          <Interruptor
            activo={servicio.activo}
            etiqueta={`Publicado: ${servicio.nombre}`}
            onCambiar={(valor) => guardar({ activo: valor })}
          />
          <span className="versalitas text-xs text-gris-calido-500">
            {servicio.activo ? 'Publicado' : 'Oculto'}
          </span>
        </div>

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
    </div>
  )
}
