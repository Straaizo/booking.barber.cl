import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Interruptor } from '../../../components/panel/Interruptor'

const ESTADOS = {
  inactivo: null,
  guardando: 'Guardando…',
  guardado: 'Guardado',
  error: 'No se pudo guardar',
}

export function FilaServicioPrecio({ servicio, onGuardar }) {
  const [precioClp, setPrecioClp] = useState(String(servicio.precio_clp ?? ''))
  const [precioOferta, setPrecioOferta] = useState(String(servicio.precio_oferta ?? ''))
  const [estado, setEstado] = useState('inactivo')

  useEffect(() => {
    setPrecioClp(String(servicio.precio_clp ?? ''))
    setPrecioOferta(String(servicio.precio_oferta ?? ''))
  }, [servicio.precio_clp, servicio.precio_oferta])

  useEffect(() => {
    if (estado !== 'guardado') return
    const temporizador = setTimeout(() => setEstado('inactivo'), 1800)
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

  function commitPrecioClp() {
    const valor = Number(precioClp)
    if (!Number.isFinite(valor) || valor === servicio.precio_clp) return
    guardar({ precio_clp: valor })
  }

  function commitPrecioOferta() {
    const valor = precioOferta === '' ? null : Number(precioOferta)
    if (valor === servicio.precio_oferta) return
    if (valor !== null && !Number.isFinite(valor)) return
    guardar({ precio_oferta: valor })
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-gris-calido-200 py-5 md:grid-cols-[1fr_repeat(3,10rem)] md:items-center md:gap-6">
      <div className="col-span-2 md:col-span-1">
        <span className="block font-medium text-negro-barbero">{servicio.nombre}</span>
        <span className="versalitas mt-0.5 block text-xs text-gris-calido-400">
          {servicio.duracion_minutos} min · solo lectura
        </span>
      </div>

      <label className="flex flex-col gap-1">
        <span className="versalitas text-xs text-gris-calido-500">Precio normal</span>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={precioClp}
          onChange={(evento) => setPrecioClp(evento.target.value)}
          onBlur={commitPrecioClp}
          className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="versalitas text-xs text-gris-calido-500">Precio oferta</span>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="—"
          value={precioOferta}
          onChange={(evento) => setPrecioOferta(evento.target.value)}
          onBlur={commitPrecioOferta}
          className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
        />
      </label>

      <div className="flex items-center justify-between gap-3 md:justify-start">
        <div className="flex items-center gap-3">
          <Interruptor
            activo={servicio.oferta_activa}
            onCambiar={(valor) => guardar({ oferta_activa: valor })}
            etiqueta={`Oferta de ${servicio.nombre}`}
          />
          <span className="versalitas text-xs text-gris-calido-500">
            {servicio.oferta_activa ? 'Oferta activa' : 'Oferta inactiva'}
          </span>
        </div>

        <div className="min-w-26 text-right md:text-left">
          <AnimatePresence mode="wait">
            {ESTADOS[estado] && (
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
