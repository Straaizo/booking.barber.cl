import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '../../../components/common/Button'
import { Interruptor } from '../../../components/panel/Interruptor'
import { IconoPapelera } from '../../../components/panel/IconoPapelera'
import { ModalFormulario } from '../../../components/panel/ModalFormulario'
import { useIsMobile } from '../../../hooks/useIsMobile'
import {
  useExcepcionesDeBarbero,
  useCrearExcepcion,
  useEliminarExcepcion,
} from '../hooks/useHorariosAdmin'

const ESTADOS = {
  guardando: 'Guardando…',
  guardado: 'Guardado',
  error: 'No se pudo guardar',
}

const ETIQUETA_MOVIL = 'text-[13px] font-semibold uppercase tracking-[0.06em] text-gris-calido-500'
const CAMPO_MOVIL =
  'numeros-tabulares min-h-12 w-full appearance-none rounded-xl border border-gris-calido-200 bg-white px-3.5 text-left text-base text-negro-barbero outline-none transition-colors focus:border-cobre'

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatoFechaLarga(fechaTexto) {
  const fecha = new Date(`${fechaTexto}T00:00:00`)
  return fecha.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' })
}

// Para una fecha exacta ("mañana llego más tarde", "el 20 no trabajo") sin
// tocar el horario semanal recurrente — se usa igual desde el panel del
// dueño (eligiendo el barbero por las pestañas de arriba) y desde el panel
// del propio barbero, cada uno le pasa su `barberoId`.
export function ExcepcionesHorario({ barberoId }) {
  const { data: excepciones, isLoading } = useExcepcionesDeBarbero(barberoId)
  const crearExcepcion = useCrearExcepcion(barberoId)
  const eliminarExcepcion = useEliminarExcepcion(barberoId)

  const [nueva, setNueva] = useState({
    fecha: '',
    cerrado: false,
    hora_inicio: '12:30',
    hora_fin: '19:00',
  })
  const [estado, setEstado] = useState(null)
  const [errorEnvio, setErrorEnvio] = useState(null)
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const esMovil = useIsMobile()

  useEffect(() => {
    if (estado !== 'guardado') return
    const temporizador = setTimeout(() => setEstado(null), 1800)
    return () => clearTimeout(temporizador)
  }, [estado])

  async function agregarExcepcion(evento) {
    evento.preventDefault()
    if (!nueva.fecha) return
    setErrorEnvio(null)
    setEstado('guardando')
    try {
      await crearExcepcion.mutateAsync({
        fecha: nueva.fecha,
        cerrado: nueva.cerrado,
        hora_inicio: nueva.cerrado ? null : nueva.hora_inicio,
        hora_fin: nueva.cerrado ? null : nueva.hora_fin,
      })
      setEstado('guardado')
      setNueva((n) => ({ ...n, fecha: '' }))
      setHojaAbierta(false)
    } catch {
      setEstado('error')
      setErrorEnvio('No pudimos guardar la excepción. Intenta de nuevo.')
    }
  }

  // En el celular: lista agrupada con las excepciones ya cargadas y una fila
  // "Agregar" que abre el formulario en una hoja inferior.
  if (esMovil) {
    return (
      <div>
        <div className="overflow-hidden rounded-2xl border border-gris-calido-200 bg-white">
          {!isLoading &&
            excepciones?.map((e) => (
              <div key={e.id} className="flex items-center gap-2 border-b border-gris-calido-100 pl-4">
                <div className="min-w-0 flex-1 py-3">
                  <span className="block text-base capitalize leading-snug text-negro-barbero">
                    {formatoFechaLarga(e.fecha)}
                  </span>
                  <span className="numeros-tabulares block text-[15px] leading-snug text-gris-calido-500">
                    {e.cerrado
                      ? 'Cerrado todo el día'
                      : `${e.hora_inicio?.slice(0, 5)} – ${e.hora_fin?.slice(0, 5)}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => eliminarExcepcion.mutate(e.id)}
                  aria-label={`Quitar excepción del ${formatoFechaLarga(e.fecha)}`}
                  className="flex h-14 w-14 shrink-0 items-center justify-center text-gris-calido-400 transition-colors active:text-red-700"
                >
                  <IconoPapelera className="h-5 w-5" />
                </button>
              </div>
            ))}
          <button
            type="button"
            onClick={() => setHojaAbierta(true)}
            className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-base font-medium text-cobre-texto active:bg-gris-calido-100"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              +
            </span>
            Excepción para un día
          </button>
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 px-1 text-[13px] leading-snug text-gris-calido-500">
          <span>Un día que empiezas más tarde o no trabajas, sin tocar tu semana.</span>
          <AnimatePresence mode="wait">
            {estado === 'guardado' && (
              <motion.span
                key={estado}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium text-verde-barberia"
              >
                {ESTADOS[estado]}
              </motion.span>
            )}
          </AnimatePresence>
        </p>

        <ModalFormulario abierto={hojaAbierta} titulo="Excepción para un día" onCerrar={() => setHojaAbierta(false)}>
          <form onSubmit={agregarExcepcion} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={ETIQUETA_MOVIL}>Fecha</span>
              <input
                type="date"
                name="excepcion_fecha"
                min={hoyISO()}
                value={nueva.fecha}
                onChange={(e) => setNueva((n) => ({ ...n, fecha: e.target.value }))}
                required
                className={CAMPO_MOVIL}
              />
            </label>
            <div className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-gris-calido-200 px-4">
              <span className="text-base text-negro-barbero">Cerrado todo el día</span>
              <Interruptor
                activo={nueva.cerrado}
                etiqueta="Cerrado todo el día"
                onCambiar={(valor) => setNueva((n) => ({ ...n, cerrado: valor }))}
              />
            </div>
            {!nueva.cerrado && (
              <div className="grid grid-cols-2 gap-3">
                <label className="flex min-w-0 flex-col gap-1.5">
                  <span className={ETIQUETA_MOVIL}>Desde</span>
                  <input
                    type="time"
                    name="excepcion_hora_inicio"
                    value={nueva.hora_inicio}
                    onChange={(e) => setNueva((n) => ({ ...n, hora_inicio: e.target.value }))}
                    className={CAMPO_MOVIL}
                  />
                </label>
                <label className="flex min-w-0 flex-col gap-1.5">
                  <span className={ETIQUETA_MOVIL}>Hasta</span>
                  <input
                    type="time"
                    name="excepcion_hora_fin"
                    value={nueva.hora_fin}
                    onChange={(e) => setNueva((n) => ({ ...n, hora_fin: e.target.value }))}
                    className={CAMPO_MOVIL}
                  />
                </label>
              </div>
            )}
            {errorEnvio && (
              <p role="alert" className="text-[15px] text-red-700">
                {errorEnvio}
              </p>
            )}
            <button
              type="submit"
              disabled={crearExcepcion.isPending}
              className="mt-2 min-h-12 w-full rounded-xl bg-cobre-oscuro text-base font-semibold text-hueso transition-[filter] active:brightness-110 disabled:opacity-60"
            >
              {crearExcepcion.isPending ? 'Guardando…' : 'Guardar excepción'}
            </button>
          </form>
        </ModalFormulario>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gris-calido-200 bg-white p-5">
      <span className="versalitas text-xs text-gris-calido-500">Excepción para un día puntual</span>
      <p className="mt-1 max-w-md text-xs text-gris-calido-500">
        Para cuando ese día en particular vas a empezar más tarde o más temprano, o no vas a
        trabajar — sin cambiar tu horario de siempre.
      </p>

      {!isLoading && excepciones?.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2 border-t border-gris-calido-100 pt-4">
          {excepciones.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gris-calido-100 px-3 py-2"
            >
              <span className="text-sm capitalize text-negro-barbero">
                {formatoFechaLarga(e.fecha)}
                {' — '}
                {e.cerrado
                  ? 'cerrado todo el día'
                  : `desde las ${e.hora_inicio?.slice(0, 5)} hasta las ${e.hora_fin?.slice(0, 5)}`}
              </span>
              <button
                type="button"
                onClick={() => eliminarExcepcion.mutate(e.id)}
                className="versalitas flex items-center gap-1.5 text-xs text-gris-calido-500 transition-colors hover:text-red-700"
              >
                <IconoPapelera className="h-3.5 w-3.5" />
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={agregarExcepcion}
        className="mt-4 flex flex-col gap-4 border-t border-gris-calido-100 pt-4"
      >
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <label className="flex flex-col gap-1">
            <span className="versalitas text-xs text-gris-calido-500">Fecha</span>
            <input
              type="date"
              name="excepcion_fecha"
              min={hoyISO()}
              value={nueva.fecha}
              onChange={(e) => setNueva((n) => ({ ...n, fecha: e.target.value }))}
              required
              className="numeros-tabulares min-h-11 w-40 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
            />
          </label>

          <div className="flex min-h-11 items-center gap-2">
            <Interruptor
              activo={nueva.cerrado}
              etiqueta="Cerrado todo el día"
              onCambiar={(valor) => setNueva((n) => ({ ...n, cerrado: valor }))}
            />
            <span className="versalitas whitespace-nowrap text-xs text-gris-calido-500">
              Cerrado todo el día
            </span>
          </div>

          {!nueva.cerrado && (
            <>
              <label className="flex flex-col gap-1">
                <span className="versalitas text-xs text-gris-calido-500">Desde</span>
                <input
                  type="time"
                  name="excepcion_hora_inicio"
                  value={nueva.hora_inicio}
                  onChange={(e) => setNueva((n) => ({ ...n, hora_inicio: e.target.value }))}
                  className="numeros-tabulares min-h-11 w-28 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="versalitas text-xs text-gris-calido-500">Hasta</span>
                <input
                  type="time"
                  name="excepcion_hora_fin"
                  value={nueva.hora_fin}
                  onChange={(e) => setNueva((n) => ({ ...n, hora_fin: e.target.value }))}
                  className="numeros-tabulares min-h-11 w-28 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
                />
              </label>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button as="button" type="submit" disabled={crearExcepcion.isPending} className="h-fit">
            {crearExcepcion.isPending ? 'Guardando…' : 'Agregar'}
          </Button>
          <div className="h-4">
            <AnimatePresence mode="wait">
              {estado && estado !== 'guardando' && (
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

        {errorEnvio && (
          <p role="alert" className="text-sm text-red-700">
            {errorEnvio}
          </p>
        )}
      </form>
    </div>
  )
}
