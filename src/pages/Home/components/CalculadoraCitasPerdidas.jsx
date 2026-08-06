import { useState } from 'react'
import { SectionRule } from '../../../components/common/SectionRule'
import { ScrollReveal } from '../../../components/animations/ScrollReveal'
import { LiveNumber } from '../../../components/animations/LiveNumber'
import { formatoCLP } from '../../../utils/formatos'

const SEMANAS_POR_MES = 4.33
const PRECIO_PLAN_SOLO = 5000

function Slider({ etiqueta, valor, onChange, min, max, step, sufijo = '' }) {
  const porcentaje = ((valor - min) / (max - min)) * 100

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-sm text-gris-calido-700 md:text-base">{etiqueta}</span>
        <span className="numeros-tabulares text-lg font-semibold text-negro-barbero">
          {valor.toLocaleString('es-CL')}
          {sufijo}
        </span>
      </div>
      <input
        type="range"
        className="slider-editorial"
        min={min}
        max={max}
        step={step}
        value={valor}
        onChange={(evento) => onChange(Number(evento.target.value))}
        style={{ '--relleno': `${porcentaje}%` }}
      />
    </div>
  )
}

export function CalculadoraCitasPerdidas() {
  const [cortesSemana, setCortesSemana] = useState(25)
  const [precioPromedio, setPrecioPromedio] = useState(10000)
  const [citasPerdidas, setCitasPerdidas] = useState(4)

  const perdidaMensual = Math.round(precioPromedio * citasPerdidas * SEMANAS_POR_MES)
  const perdidaAnual = perdidaMensual * 12
  const vecesElPlan = precioPromedio > 0 ? Math.round(perdidaMensual / PRECIO_PLAN_SOLO) : 0

  return (
    <section className="bg-negro-barbero px-6 py-20 text-hueso md:px-10 md:py-28">
      <SectionRule indice="— 03" texto="Lo que ya estás perdiendo" tono="claro" />

      <div className="mt-14 grid grid-cols-12 gap-x-6 gap-y-12">
        <div className="col-span-12 md:col-span-5">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-light leading-tight tracking-tight md:text-5xl">
              ¿Cuánto te cuestan las citas que se pierden?
            </h2>
            <p className="mt-4 max-w-sm text-sm text-gris-calido-200 md:text-base">
              Mueve los controles con tus números reales — no hace falta que sean
              exactos.
            </p>
          </ScrollReveal>

          <div className="mt-10 flex flex-col gap-8">
            <Slider
              etiqueta="Cortes por semana, en total"
              valor={cortesSemana}
              onChange={setCortesSemana}
              min={5}
              max={60}
              step={1}
            />
            <Slider
              etiqueta="Precio promedio del corte"
              valor={precioPromedio}
              onChange={setPrecioPromedio}
              min={5000}
              max={15000}
              step={500}
              sufijo=""
            />
            <Slider
              etiqueta="Citas que se pierden por semana"
              valor={citasPerdidas}
              onChange={setCitasPerdidas}
              min={0}
              max={15}
              step={1}
            />
          </div>
        </div>

        <div className="col-span-12 flex flex-col justify-center md:col-span-6 md:col-start-7">
          <div className="border-t border-hueso/15 pt-8">
            <span className="versalitas text-xs text-cobre-claro">Pérdida estimada al mes</span>
            <div className="mt-2 font-display text-5xl font-light tracking-tight md:text-7xl">
              <LiveNumber valor={perdidaMensual} formatear={formatoCLP} />
            </div>
          </div>

          <div className="mt-8 border-t border-hueso/15 pt-8">
            <span className="versalitas text-xs text-gris-calido-400">Al año</span>
            <div className="mt-2 font-display text-3xl font-light tracking-tight text-gris-calido-200 md:text-4xl">
              <LiveNumber valor={perdidaAnual} formatear={formatoCLP} />
            </div>
          </div>

          {vecesElPlan > 0 && (
            <p className="mt-8 max-w-sm text-sm text-gris-calido-200 md:text-base">
              Eso es{' '}
              <span className="numeros-tabulares font-semibold text-hueso">
                {vecesElPlan}
              </span>{' '}
              veces lo que cuesta el plan Solo ({formatoCLP(PRECIO_PLAN_SOLO)}/mes).
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
