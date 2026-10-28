import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader } from '../../components/common/Loader'
import { ModalFormulario } from '../../components/panel/ModalFormulario'
import { formatoCLP } from '../../utils/formatos'
import { hoyEnSantiago } from '../../utils/horaLocal'
import { HAY_BACKEND_REAL } from '../../mocks/datosProvisoriosSuperadmin'
import { descargarReservasDelMes, useGuardarMetas, useMetasMes, useResumenMes } from './hooks/useResumen'

const FORMATO_MES = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' })
const FORMATO_MES_CORTO = new Intl.DateTimeFormat('es-CL', { month: 'long' })

function nombreMes(fecha, formato = FORMATO_MES) {
  const texto = formato.format(fecha)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function sumarMeses(mes, delta) {
  return new Date(mes.getFullYear(), mes.getMonth() + delta, 1)
}

function totales(filas) {
  const t = { reservas: 0, atendidas: 0, canceladas: 0, sinConfirmar: 0, agendados: 0, atendidos: 0 }
  for (const f of filas ?? []) {
    t.reservas += f.reservas - f.canceladas
    t.atendidas += f.atendidas
    t.canceladas += f.canceladas
    t.sinConfirmar += f.sin_confirmar
    t.agendados += f.ingresos_agendados
    t.atendidos += f.ingresos_atendidos
  }
  // Asistencia: de las reservas que ya pasaron (atendidas + sin confirmar),
  // cuántas se marcaron como atendidas.
  const pasadas = t.atendidas + t.sinConfirmar
  t.asistencia = pasadas ? Math.round((t.atendidas / pasadas) * 100) : null
  return t
}

// Variación porcentual contra el mes anterior. `null` cuando no hay con qué
// comparar (mes anterior sin datos).
function variacion(actual, anterior) {
  if (actual == null || anterior == null || anterior === 0) return null
  return Math.round(((actual - anterior) / anterior) * 100)
}

function Variacion({ valor, inversa = false }) {
  if (valor == null) return <span className="text-[13px] text-gris-calido-400 md:text-xs">sin datos previos</span>
  if (valor === 0) return <span className="text-[13px] text-gris-calido-500 md:text-xs">= igual</span>
  const sube = valor > 0
  const bueno = inversa ? !sube : sube
  return (
    <span className={`text-[13px] font-semibold md:text-xs ${bueno ? 'text-verde-barberia' : 'text-red-700'}`}>
      {sube ? '▲' : '▼'} {Math.abs(valor)}%
    </span>
  )
}

function Indicador({ etiqueta, valor, delta, inversa }) {
  return (
    <div className="rounded-2xl border border-gris-calido-200 bg-white p-4">
      <p className="text-[13px] font-medium text-gris-calido-500">{etiqueta}</p>
      <p className="numeros-tabulares mt-1 text-[22px] font-semibold leading-tight text-negro-barbero">{valor}</p>
      <div className="mt-1">
        <Variacion valor={delta} inversa={inversa} />
      </div>
    </div>
  )
}

function BarraProgreso({ porcentaje, clara = false }) {
  return (
    <div className={`h-2.5 overflow-hidden rounded-full ${clara ? 'bg-white/15' : 'bg-gris-calido-100'}`}>
      <motion.div
        className={`h-full rounded-full ${porcentaje >= 100 ? 'bg-verde-barberia' : 'bg-cobre'}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, porcentaje)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  )
}

function FormularioMetas({ mes, barberos, metas, onListo }) {
  const guardar = useGuardarMetas(mes)
  const metaDe = (id) => metas.find((m) => m.barbero_id === id)?.meta_ingresos_clp ?? ''
  const [valores, setValores] = useState(() => ({
    general: metaDe(null),
    ...Object.fromEntries(barberos.map((b) => [b.barbero_id, metaDe(b.barbero_id)])),
  }))
  const [error, setError] = useState(null)

  async function enviar(evento) {
    evento.preventDefault()
    setError(null)
    try {
      await guardar.mutateAsync([
        { barbero_id: null, meta: Number(valores.general) || null },
        ...barberos.map((b) => ({ barbero_id: b.barbero_id, meta: Number(valores[b.barbero_id]) || null })),
      ])
      onListo()
    } catch (err) {
      setError(err?.message ?? 'No se pudieron guardar las metas.')
    }
  }

  const campo = (clave, etiqueta, destacado = false) => (
    <label key={clave} className="flex flex-col gap-1.5">
      <span className={`text-[15px] md:text-sm ${destacado ? 'font-semibold text-negro-barbero' : 'text-gris-calido-700'}`}>
        {etiqueta}
      </span>
      <div className="flex min-h-12 items-center rounded-xl border border-gris-calido-200 bg-white px-3.5 focus-within:border-cobre">
        <span className="text-gris-calido-500">$</span>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          step="1000"
          placeholder="Sin meta"
          value={valores[clave]}
          onChange={(e) => setValores((v) => ({ ...v, [clave]: e.target.value }))}
          className="numeros-tabulares w-full appearance-none bg-transparent px-2 py-2 text-base text-negro-barbero outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
        />
      </div>
    </label>
  )

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <p className="text-[15px] text-gris-calido-500 md:text-sm">
        Ingresos que quieres alcanzar en {nombreMes(mes, FORMATO_MES_CORTO).toLowerCase()}. Deja vacío para no
        definir meta.
      </p>
      {campo('general', 'Meta de la barbería', true)}
      {barberos.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-gris-calido-200 pt-4">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-gris-calido-500">Por barbero (opcional)</p>
          {barberos.map((b) => campo(b.barbero_id, b.barbero_nombre))}
        </div>
      )}
      {error && (
        <p role="alert" className="text-[15px] text-red-700 md:text-sm">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={guardar.isPending}
        className="min-h-12 w-full rounded-xl bg-cobre-oscuro text-base font-semibold text-hueso active:brightness-110 disabled:opacity-60"
      >
        {guardar.isPending ? 'Guardando…' : 'Guardar metas'}
      </button>
    </form>
  )
}

export function PanelResumen() {
  const hoy = hoyEnSantiago()
  const mesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const [mes, setMes] = useState(mesActual)
  const mesAnterior = sumarMeses(mes, -1)
  const esMesActual = mes.getTime() === mesActual.getTime()

  const resumen = useResumenMes(mes)
  const resumenAnterior = useResumenMes(mesAnterior)
  const metas = useMetasMes(mes)
  const [editandoMetas, setEditandoMetas] = useState(false)
  const [descargando, setDescargando] = useState(false)
  const [avisoDescarga, setAvisoDescarga] = useState(null)

  const actual = useMemo(() => totales(resumen.data), [resumen.data])
  const anterior = useMemo(() => totales(resumenAnterior.data), [resumenAnterior.data])
  const hayAnterior = (resumenAnterior.data ?? []).some((f) => f.reservas > 0)

  const metaGeneral = metas.data?.find((m) => m.barbero_id == null)?.meta_ingresos_clp
  const progresoMeta = metaGeneral ? Math.round((actual.agendados / metaGeneral) * 100) : null
  const diasDelMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const diasRestantes = esMesActual ? diasDelMes - hoy.getDate() : 0

  const anteriorPorBarbero = new Map((resumenAnterior.data ?? []).map((f) => [f.barbero_id, f]))
  const maxIngresos = Math.max(1, ...(resumen.data ?? []).map((f) => f.ingresos_agendados))

  async function descargar() {
    setDescargando(true)
    setAvisoDescarga(null)
    try {
      const cantidad = await descargarReservasDelMes(mes, `reservas-${nombreMes(mes).toLowerCase().replace(/\s+/g, '-')}.csv`)
      setAvisoDescarga(cantidad ? null : 'Ese mes no tiene reservas para descargar.')
    } catch {
      setAvisoDescarga('No se pudo descargar. Intenta de nuevo.')
    } finally {
      setDescargando(false)
    }
  }

  const delta = (a, b) => (hayAnterior ? variacion(a, b) : null)

  return (
    <div>
      <h1 className="font-display text-[28px]/[1.15] font-light tracking-tight text-negro-barbero md:text-3xl">
        Resumen
      </h1>
      <p className="mt-1 text-[15px] text-gris-calido-500 md:mt-2 md:text-sm">
        Cómo va tu barbería, comparado con el mes anterior.
      </p>

      <div className="mt-5 flex items-center justify-between rounded-2xl border border-gris-calido-200 bg-white p-2 md:max-w-md">
        <button
          type="button"
          onClick={() => setMes((m) => sumarMeses(m, -1))}
          aria-label="Mes anterior"
          className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-negro-barbero active:bg-gris-calido-100"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-[17px] font-semibold text-negro-barbero md:text-base">{nombreMes(mes)}</p>
          <p className="text-[13px] text-gris-calido-500 md:text-xs">
            vs. {nombreMes(mesAnterior, FORMATO_MES_CORTO).toLowerCase()}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMes((m) => sumarMeses(m, 1))}
          disabled={esMesActual}
          aria-label="Mes siguiente"
          className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-negro-barbero active:bg-gris-calido-100 disabled:opacity-25"
        >
          ›
        </button>
      </div>

      {resumen.isLoading && (
        <div className="py-12">
          <Loader label="Calculando resumen" />
        </div>
      )}

      {resumen.isError && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[15px] text-red-700 md:text-sm">
          No pudimos cargar el resumen. Desliza hacia abajo para reintentar.
        </p>
      )}

      {resumen.data && (
        <>
          {/* Meta del mes */}
          <section className="mt-5 rounded-2xl bg-negro-barbero p-5 text-hueso shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-gris-calido-400">
                Meta de {nombreMes(mes, FORMATO_MES_CORTO).toLowerCase()}
              </p>
              <button
                type="button"
                onClick={() => setEditandoMetas(true)}
                className="-mr-2 -mt-2 min-h-11 rounded-full px-3 text-[14px] font-semibold text-cobre-claro active:bg-white/10"
              >
                {metaGeneral ? 'Editar' : 'Definir'}
              </button>
            </div>
            <p className="numeros-tabulares mt-1 text-[30px] font-semibold leading-tight">{formatoCLP(actual.agendados)}</p>
            {metaGeneral ? (
              <>
                <p className="mt-0.5 text-[15px] text-gris-calido-200">
                  de {formatoCLP(metaGeneral)} · <strong className="text-hueso">{progresoMeta}%</strong>
                </p>
                <div className="mt-4">
                  <BarraProgreso porcentaje={progresoMeta} clara />
                </div>
                <p className="mt-3 text-[14px] text-gris-calido-200">
                  {progresoMeta >= 100
                    ? '🎉 ¡Meta cumplida!'
                    : esMesActual
                      ? `Faltan ${formatoCLP(metaGeneral - actual.agendados)} · quedan ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}`
                      : `Quedó a ${formatoCLP(metaGeneral - actual.agendados)} de la meta`}
                </p>
              </>
            ) : (
              <p className="mt-1 text-[15px] text-gris-calido-200">
                Define una meta de ingresos para ver cuánto te falta cada día.
              </p>
            )}
            <p className="mt-3 border-t border-white/10 pt-3 text-[13px] text-gris-calido-400">
              {formatoCLP(actual.atendidos)} confirmados como atendidos
            </p>
          </section>

          {/* Indicadores */}
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Indicador etiqueta="Ingresos" valor={formatoCLP(actual.agendados)} delta={delta(actual.agendados, anterior.agendados)} />
            <Indicador etiqueta="Reservas" valor={actual.reservas} delta={delta(actual.reservas, anterior.reservas)} />
            <Indicador
              etiqueta="Asistencia"
              valor={actual.asistencia == null ? '—' : `${actual.asistencia}%`}
              delta={delta(actual.asistencia, anterior.asistencia)}
            />
            <Indicador
              etiqueta="Canceladas"
              valor={actual.canceladas}
              delta={delta(actual.canceladas, anterior.canceladas)}
              inversa
            />
          </div>
          {actual.sinConfirmar > 0 && (
            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-[14px] text-amber-800 md:text-sm">
              {actual.sinConfirmar} {actual.sinConfirmar === 1 ? 'reserva pasada no tiene' : 'reservas pasadas no tienen'}{' '}
              la asistencia confirmada por el barbero.
            </p>
          )}

          {/* Ranking de barberos */}
          <h2 className="mb-2 mt-7 px-1 font-sans! text-[13px] font-semibold uppercase tracking-[0.06em] text-gris-calido-500">
            Barberos
          </h2>
          {resumen.data.length === 0 ? (
            <p className="rounded-2xl border border-gris-calido-200 bg-white p-4 text-[15px] text-gris-calido-500">
              Sin barberos activos.
            </p>
          ) : (
            <ol className="overflow-hidden rounded-2xl border border-gris-calido-200 bg-white">
              {resumen.data.map((fila, i) => {
                const previo = anteriorPorBarbero.get(fila.barbero_id)
                const meta = metas.data?.find((m) => m.barbero_id === fila.barbero_id)?.meta_ingresos_clp
                const progreso = meta ? Math.round((fila.ingresos_agendados / meta) * 100) : null
                return (
                  <li key={fila.barbero_id} className="border-b border-gris-calido-200 p-4 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold ${
                          i === 0 && fila.ingresos_agendados > 0 ? 'bg-cobre text-hueso' : 'bg-gris-calido-100 text-gris-calido-700'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[16px] font-semibold text-negro-barbero">{fila.barbero_nombre}</span>
                          <span className="numeros-tabulares shrink-0 text-[15px] font-semibold text-negro-barbero">
                            {formatoCLP(fila.ingresos_agendados)}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-baseline justify-between gap-2">
                          <span className="text-[14px] text-gris-calido-500">
                            {fila.reservas - fila.canceladas} reservas
                            {fila.canceladas > 0 && ` · ${fila.canceladas} canceladas`}
                          </span>
                          <Variacion
                            valor={hayAnterior && previo ? variacion(fila.ingresos_agendados, previo.ingresos_agendados) : null}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pl-11">
                      {meta ? (
                        <>
                          <BarraProgreso porcentaje={progreso} />
                          <p className="mt-1.5 text-[13px] text-gris-calido-500">
                            {progreso}% de su meta de {formatoCLP(meta)}
                          </p>
                        </>
                      ) : (
                        <div className="h-1.5 overflow-hidden rounded-full bg-gris-calido-100">
                          <motion.div
                            className="h-full rounded-full bg-gris-calido-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${(fila.ingresos_agendados / maxIngresos) * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}

          {HAY_BACKEND_REAL && (
            <div className="mt-6">
              <button
                type="button"
                onClick={descargar}
                disabled={descargando}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-gris-calido-200 bg-white text-base font-medium text-negro-barbero active:bg-gris-calido-100 disabled:opacity-60 md:w-auto md:px-5"
              >
                {descargando ? 'Preparando…' : `Descargar reservas de ${nombreMes(mes, FORMATO_MES_CORTO).toLowerCase()} (Excel)`}
              </button>
              {avisoDescarga && <p className="mt-2 text-[14px] text-gris-calido-500">{avisoDescarga}</p>}
            </div>
          )}
        </>
      )}

      <ModalFormulario abierto={editandoMetas} titulo="Metas del mes" onCerrar={() => setEditandoMetas(false)}>
        {editandoMetas && (
          <FormularioMetas
            mes={mes}
            barberos={resumen.data ?? []}
            metas={metas.data ?? []}
            onListo={() => setEditandoMetas(false)}
          />
        )}
      </ModalFormulario>
    </div>
  )
}
