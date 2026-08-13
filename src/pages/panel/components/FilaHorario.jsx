import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Interruptor } from '../../../components/panel/Interruptor'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const ESTADOS = {
  guardando: 'Guardando…',
  guardado: 'Guardado',
  error: 'No se pudo guardar',
}

// Antes solo se podía activar/desactivar un bloque ya creado — para
// cambiarle el día o el horario había que borrarlo (no existía eso tampoco)
// y crear uno nuevo. Ahora los tres campos son editables, con el mismo
// guardado automático al perder el foco que ya usa "Servicios" — y la misma
// tarjeta, para que se sienta la misma interfaz en todo el panel.
export function FilaHorario({ horario, onGuardar }) {
  const [campos, setCampos] = useState({
    hora_inicio: horario.hora_inicio.slice(0, 5),
    hora_fin: horario.hora_fin.slice(0, 5),
  })
  const [estado, setEstado] = useState(null)

  useEffect(() => {
    setCampos({
      hora_inicio: horario.hora_inicio.slice(0, 5),
      hora_fin: horario.hora_fin.slice(0, 5),
    })
  }, [horario])

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

  function commitDia(valorCrudo) {
    const valor = Number(valorCrudo)
    if (valor === horario.dia_semana) return
    guardar({ dia_semana: valor })
  }

  function commitHora(campo, valorCrudo) {
    if (!valorCrudo || valorCrudo === horario[campo].slice(0, 5)) return
    guardar({ [campo]: valorCrudo })
  }

  return (
    <div className="rounded-lg border border-gris-calido-200 bg-white p-5 transition-colors hover:border-gris-calido-300">
      <div className="flex items-start justify-between gap-4">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="versalitas text-xs text-gris-calido-500">Día</span>
          <select
            value={horario.dia_semana}
            onChange={(e) => commitDia(e.target.value)}
            className="min-h-11 max-w-xs border-b border-gris-calido-200 bg-transparent py-1 text-base font-medium text-negro-barbero outline-none transition-colors focus:border-cobre"
          >
            {DIAS.map((dia, indice) => (
              <option key={dia} value={indice}>
                {dia}
              </option>
            ))}
          </select>
        </label>

        {/* Mismo truco que en las tarjetas de servicio: un espaciador
            invisible de la misma altura que la etiqueta "Día" deja el
            interruptor a la altura real del select, sin adivinar un padding. */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span aria-hidden="true" className="versalitas invisible text-xs">
            Día
          </span>
          <div className="flex min-h-11 items-center gap-2">
            <Interruptor
              activo={horario.activo}
              etiqueta={`Bloque de ${DIAS[horario.dia_semana]} ${horario.hora_inicio.slice(0, 5)}–${horario.hora_fin.slice(0, 5)}`}
              onCambiar={(valor) => guardar({ activo: valor })}
            />
            <span className="versalitas text-xs text-gris-calido-500">
              {horario.activo ? 'Activo' : 'Inactivo'}
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

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-gris-calido-100 pt-4 md:grid-cols-[10rem_10rem]">
        <label className="flex flex-col gap-1">
          <span className="versalitas flex min-h-7 items-center text-xs text-gris-calido-500">Desde</span>
          <input
            type="time"
            value={campos.hora_inicio}
            onChange={(e) => setCampos((c) => ({ ...c, hora_inicio: e.target.value }))}
            onBlur={() => commitHora('hora_inicio', campos.hora_inicio)}
            className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="versalitas flex min-h-7 items-center text-xs text-gris-calido-500">Hasta</span>
          <input
            type="time"
            value={campos.hora_fin}
            onChange={(e) => setCampos((c) => ({ ...c, hora_fin: e.target.value }))}
            onBlur={() => commitHora('hora_fin', campos.hora_fin)}
            className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>
      </div>
    </div>
  )
}
