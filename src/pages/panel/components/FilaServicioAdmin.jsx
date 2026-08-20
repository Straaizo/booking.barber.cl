import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Interruptor } from '../../../components/panel/Interruptor'
import { errorDeOferta } from '../../../utils/ofertas'

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
  const [errorOferta, setErrorOferta] = useState(null)

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

  function commitNumero(campo, valorCrudo, valorOriginal) {
    const valor = Number(valorCrudo)
    if (!Number.isFinite(valor) || valor === valorOriginal) return
    guardar({ [campo]: valor })
  }

  function alternarOferta(valor) {
    const error = errorDeOferta(valor, servicio.precio_oferta, servicio.precio_clp)
    if (error) {
      setErrorOferta(error)
      return
    }
    setErrorOferta(null)
    guardar({ oferta_activa: valor })
  }

  function commitPrecioOferta() {
    const valorCrudo = campos.precio_oferta
    if (valorCrudo === '') {
      if (servicio.precio_oferta !== null) guardar({ precio_oferta: null })
      return
    }
    const valor = Number(valorCrudo)
    if (!Number.isFinite(valor) || valor === servicio.precio_oferta) return
    const error = errorDeOferta(servicio.oferta_activa, valor, servicio.precio_clp)
    if (error) {
      setErrorOferta(error)
      return
    }
    setErrorOferta(null)
    guardar({ precio_oferta: valor })
  }

  return (
    <div className="rounded-lg border border-gris-calido-200 bg-white p-5 transition-colors hover:border-gris-calido-300">
      {/* Encabezado de la tarjeta: nombre (lo principal) + estado de
          publicación — el mismo tipo de fila que ya usan otras tarjetas del
          panel (barbero, sección), para que "publicado/oculto" se lea como
          el estado general del servicio, no como un control más perdido
          entre los demás. */}
      <div className="flex items-start justify-between gap-4">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="versalitas text-xs text-gris-calido-500">Nombre</span>
          <input
            type="text"
            name="nombre"
            value={campos.nombre}
            onChange={(e) => setCampos((c) => ({ ...c, nombre: e.target.value }))}
            onBlur={commitTexto}
            className="min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-base font-medium text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>

        {/* Un espaciador invisible de la misma altura que la etiqueta
            "Nombre" (texto + separación) hace que el interruptor quede
            exactamente a la altura del input de al lado, en vez de calcular
            un padding a ojo — si el tamaño de la etiqueta cambia alguna vez,
            esto se sigue ajustando solo. */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span aria-hidden="true" className="versalitas invisible text-xs">
            Nombre
          </span>
          <div className="flex min-h-11 items-center gap-2">
            <Interruptor
              activo={servicio.activo}
              etiqueta={`Publicado: ${servicio.nombre}`}
              onCambiar={(valor) => guardar({ activo: valor })}
            />
            <span className="versalitas text-xs text-gris-calido-500">
              {servicio.activo ? 'Publicado' : 'Oculto'}
            </span>
          </div>
          <div className="h-4">
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

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-gris-calido-100 pt-4 md:grid-cols-[8rem_10rem_12rem]">
        <label className="flex flex-col gap-1">
          <span className="versalitas flex min-h-7 items-center text-xs text-gris-calido-500">
            Duración (min)
          </span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            name="duracion_minutos"
            value={campos.duracion_minutos}
            onChange={(e) => setCampos((c) => ({ ...c, duracion_minutos: e.target.value }))}
            onBlur={() =>
              commitNumero('duracion_minutos', campos.duracion_minutos, servicio.duracion_minutos)
            }
            className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="versalitas flex min-h-7 items-center text-xs text-gris-calido-500">
            Precio
          </span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            name="precio_clp"
            value={campos.precio_clp}
            onChange={(e) => setCampos((c) => ({ ...c, precio_clp: e.target.value }))}
            onBlur={() => commitNumero('precio_clp', campos.precio_clp, servicio.precio_clp)}
            className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>

        {/* El interruptor de "oferta activa" vive pegado al campo que
            enciende — antes estaba en una fila aparte, lejos del precio de
            oferta, sin ninguna relación visual con él. `min-h-7` en las tres
            etiquetas (esta y las dos de arriba) es lo que las deja a la
            misma altura — sin eso, esta fila queda más alta que las otras
            dos (por el interruptor) y el input de acá abajo termina más
            abajo que "Duración"/"Precio", desalineando toda la fila. */}
        <div className="col-span-2 flex flex-col gap-1 md:col-span-1">
          <div className="flex min-h-7 items-center justify-between">
            <span className="versalitas text-xs text-gris-calido-500">Precio oferta</span>
            <Interruptor
              activo={servicio.oferta_activa}
              etiqueta={`Oferta activa de ${servicio.nombre}`}
              onCambiar={alternarOferta}
            />
          </div>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="—"
            name="precio_oferta"
            value={campos.precio_oferta}
            onChange={(e) => setCampos((c) => ({ ...c, precio_oferta: e.target.value }))}
            onBlur={commitPrecioOferta}
            className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre disabled:text-gris-calido-400"
          />
          {errorOferta && (
            <p role="alert" className="text-xs text-red-700">
              {errorOferta}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
