import { SectionRule } from '../../../components/common/SectionRule'
import { ScrollReveal } from '../../../components/animations/ScrollReveal'
import { StaggerReveal } from '../../../components/animations/StaggerReveal'
import { Button } from '../../../components/common/Button'
import { CUPOS_TOTALES, CUPOS_OCUPADOS } from '../../../config/fundadores'

const BENEFICIOS = [
  'Precio congelado de por vida, aunque suban los planes más adelante',
  'Onboarding acompañado: te ayudamos a cargar tus servicios y horarios',
  'Prioridad en las funciones nuevas que vayan saliendo',
]

export function FounderSpots() {
  const disponibles = CUPOS_TOTALES - CUPOS_OCUPADOS

  return (
    <section className="bg-negro-barbero px-6 py-20 text-hueso md:px-10 md:py-28">
      <SectionRule indice="— 06" texto="Cupos fundadores" tono="claro" />

      <div className="mt-14 grid grid-cols-12 gap-x-6">
        <div className="col-span-12 md:col-span-6">
          <ScrollReveal>
            <p className="font-display text-3xl font-light leading-tight tracking-tight md:text-5xl">
              Recién estamos partiendo.{' '}
              <em className="not-italic text-cobre-claro">Con toda honestidad.</em>
            </p>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-gris-calido-200 md:text-base">
              Buscamos las primeras {CUPOS_TOTALES} barberías de Chile. No hay clientes
              falsos ni casos de éxito inventados que mostrarte — lo que sí podemos
              ofrecerte es el precio más bajo que vamos a tener nunca, y toda nuestra
              atención mientras el producto crece.
            </p>
          </ScrollReveal>
        </div>

        <div className="col-span-12 mt-12 md:col-span-6 md:col-start-7 md:mt-0">
          <ScrollReveal delay={0.1}>
            <span className="numeros-tabulares font-display text-6xl font-light tracking-tight text-hueso md:text-7xl">
              {disponibles}
            </span>
            <span className="ml-2 text-sm text-gris-calido-400">
              / {CUPOS_TOTALES} cupos fundadores disponibles
            </span>
            <div className="mt-4 h-px w-full max-w-xs bg-hueso/15">
              <div
                className="h-px bg-cobre"
                style={{ width: `${(CUPOS_OCUPADOS / CUPOS_TOTALES) * 100}%` }}
              />
            </div>
          </ScrollReveal>

          <StaggerReveal className="mt-10 flex flex-col gap-8">
            {BENEFICIOS.map((beneficio, indice) => (
              <div key={beneficio} className="flex gap-5 border-t border-hueso/10 pt-6 first:border-t-0 first:pt-0">
                <span className="numeros-tabulares text-cobre-claro">
                  {String(indice + 1).padStart(2, '0')}
                </span>
                <p className="text-base text-hueso md:text-lg">{beneficio}</p>
              </div>
            ))}
          </StaggerReveal>

          <ScrollReveal delay={0.2} className="mt-10">
            <Button
              href="https://www.instagram.com/p/Dcg1LIKKql5/"
              target="_blank"
              rel="noreferrer"
            >
              Quiero ser barbería fundadora
            </Button>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
