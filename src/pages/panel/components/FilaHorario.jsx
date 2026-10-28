import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Interruptor } from '../../../components/panel/Interruptor'
import { ModalFormulario } from '../../../components/panel/ModalFormulario'
import { useIsMobile } from '../../../hooks/useIsMobile'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const ESTADOS = {
  guardando: 'Guardando…',
  guardado: 'Guardado',
  error: 'No se pudo guardar',
}

const ETIQUETA_MOVIL = 'text-[13px] font-semibold uppercase tracking-[0.06em] text-gris-calido-500'
const CAMPO_MOVIL =
  'numeros-tabulares min-h-12 w-full appearance-none rounded-xl border border-gris-calido-200 bg-white px-3.5 text-left text-base text-negro-barbero outline-none transition-colors focus:border-cobre'

function FlechaSelect() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gris-calido-400"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function SelectDiaMovil({ value, onChange }) {
  return (
    <div className="relative">
      <select name="dia_semana" value={value} onChange={onChange} className={`${CAMPO_MOVIL} pr-10`}>
        {DIAS.map((dia, indice) => (
          <option key={dia} value={indice}>
            {dia}
          </option>
        ))}
      </select>
      <FlechaSelect />
    </div>
  )
}

function TextoEstado({ estado }) {
  return (
    <AnimatePresence mode="wait">
      {estado && (
        <motion.span
          key={estado}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role={estado === 'error' ? 'alert' : undefined}
          className={`text-[13px] font-medium ${estado === 'error' ? 'text-red-700' : 'text-verde-barberia'}`}
        >
          {ESTADOS[estado]}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

// Formulario de "Nuevo bloque" para el celular: en vez de quedar siempre
// desplegado al final de la página, vive en una hoja inferior que se abre
// desde un botón. Lo usan el panel del dueño y el del barbero.
export function HojaNuevoBloque({ abierto, onCerrar, nuevo, setNuevo, onSubmit, creando, error }) {
  return (
    <ModalFormulario abierto={abierto} titulo="Nuevo bloque" onCerrar={onCerrar}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className={ETIQUETA_MOVIL}>Día</span>
          <SelectDiaMovil
            value={nuevo.dia_semana}
            onChange={(e) => setNuevo((n) => ({ ...n, dia_semana: e.target.value }))}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className={ETIQUETA_MOVIL}>Desde</span>
            <input
              type="time"
              name="hora_inicio"
              value={nuevo.hora_inicio}
              onChange={(e) => setNuevo((n) => ({ ...n, hora_inicio: e.target.value }))}
              className={CAMPO_MOVIL}
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className={ETIQUETA_MOVIL}>Hasta</span>
            <input
              type="time"
              name="hora_fin"
              value={nuevo.hora_fin}
              onChange={(e) => setNuevo((n) => ({ ...n, hora_fin: e.target.value }))}
              className={CAMPO_MOVIL}
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="text-[15px] text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={creando}
          className="mt-2 min-h-12 w-full rounded-xl bg-cobre-oscuro text-base font-semibold text-hueso transition-[filter] active:brightness-110 disabled:opacity-60"
        >
          {creando ? 'Creando…' : 'Agregar bloque'}
        </button>
      </form>
    </ModalFormulario>
  )
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
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const esMovil = useIsMobile()

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

  const etiquetaBloque = `Bloque de ${DIAS[horario.dia_semana]} ${horario.hora_inicio.slice(0, 5)}–${horario.hora_fin.slice(0, 5)}`

  // En el celular cada bloque es una fila compacta de lista (día, rango y
  // switch); tocarla abre una hoja inferior con los mismos campos y el mismo
  // guardado automático de la tarjeta de escritorio.
  if (esMovil) {
    return (
      <div data-fila-horario className="flex items-center gap-3 px-4">
        <button
          type="button"
          onClick={() => setHojaAbierta(true)}
          className="flex min-h-16 min-w-0 flex-1 flex-col justify-center py-2.5 text-left transition-opacity active:opacity-60"
        >
          <span
            className={`text-[17px] font-medium leading-snug ${horario.activo ? 'text-negro-barbero' : 'text-gris-calido-400'}`}
          >
            {DIAS[horario.dia_semana]}
          </span>
          <span className="flex items-center gap-2 text-[15px] leading-snug text-gris-calido-500">
            <span className="numeros-tabulares">
              {horario.hora_inicio.slice(0, 5)} – {horario.hora_fin.slice(0, 5)}
            </span>
            {!horario.activo && !estado && <span className="text-gris-calido-400">· Inactivo</span>}
            <TextoEstado estado={estado} />
          </span>
        </button>
        <Interruptor activo={horario.activo} etiqueta={etiquetaBloque} onCambiar={(valor) => guardar({ activo: valor })} />

        <ModalFormulario abierto={hojaAbierta} titulo="Editar bloque" onCerrar={() => setHojaAbierta(false)}>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={ETIQUETA_MOVIL}>Día</span>
              <SelectDiaMovil value={horario.dia_semana} onChange={(e) => commitDia(e.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className={ETIQUETA_MOVIL}>Desde</span>
                <input
                  type="time"
                  name="hora_inicio"
                  value={campos.hora_inicio}
                  onChange={(e) => setCampos((c) => ({ ...c, hora_inicio: e.target.value }))}
                  onBlur={() => commitHora('hora_inicio', campos.hora_inicio)}
                  className={CAMPO_MOVIL}
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className={ETIQUETA_MOVIL}>Hasta</span>
                <input
                  type="time"
                  name="hora_fin"
                  value={campos.hora_fin}
                  onChange={(e) => setCampos((c) => ({ ...c, hora_fin: e.target.value }))}
                  onBlur={() => commitHora('hora_fin', campos.hora_fin)}
                  className={CAMPO_MOVIL}
                />
              </label>
            </div>
            <div className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-gris-calido-200 px-4">
              <span className="text-base text-negro-barbero">{horario.activo ? 'Bloque activo' : 'Bloque inactivo'}</span>
              <Interruptor activo={horario.activo} etiqueta={etiquetaBloque} onCambiar={(valor) => guardar({ activo: valor })} />
            </div>
            <div className="flex h-5 items-center justify-center">
              <TextoEstado estado={estado} />
            </div>
            <button
              type="button"
              onClick={() => setHojaAbierta(false)}
              className="min-h-12 w-full rounded-xl bg-negro-barbero text-base font-semibold text-hueso active:opacity-80"
            >
              Listo
            </button>
          </div>
        </ModalFormulario>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gris-calido-200 bg-white p-5 transition-colors hover:border-gris-calido-300">
      <div className="flex items-start justify-between gap-4">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="versalitas text-xs text-gris-calido-500">Día</span>
          <select
            name="dia_semana"
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
              etiqueta={etiquetaBloque}
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
            name="hora_inicio"
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
            name="hora_fin"
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
