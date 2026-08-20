import { useState } from 'react'
import { motion } from 'framer-motion'
import { SectionRule } from '../../../components/common/SectionRule'
import { ScrollReveal } from '../../../components/animations/ScrollReveal'
import { EASE_ENTRADA } from '../../../components/animations/easing'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'

const PREGUNTAS = [
  {
    pregunta: '¿Necesito instalar algo?',
    respuesta:
      'No. Todo funciona desde el navegador, tanto para ti como para tus clientes — nadie tiene que instalar una app.',
  },
  {
    pregunta: '¿Mis clientes tienen que crear una cuenta?',
    respuesta:
      'No. Solo ingresan su nombre y celular al momento de reservar, nada más.',
  },
  {
    pregunta: '¿Puedo cambiar mis precios yo mismo?',
    respuesta:
      'Sí. Tú y tus barberos pueden actualizar precios y ofertas cuando quieran, y se reflejan al instante en tu página pública.',
  },
  {
    pregunta: '¿Qué pasa si dejo de pagar?',
    respuesta:
      'Tu página se desactiva y tus clientes ven que no está disponible por ahora. Nada se borra — si vuelves, todo sigue donde lo dejaste.',
  },
  {
    pregunta: '¿Sirve si tengo un solo barbero?',
    respuesta: 'Sí, el plan Solo está pensado exactamente para eso.',
  },
  {
    pregunta: '¿Puedo probarlo antes de pagar?',
    respuesta:
      'Escríbenos y te mostramos tu página funcionando antes de que decidas — sin compromiso.',
  },
]

function IconoMasMenos({ abierto }) {
  return (
    <span className="relative h-4 w-4 shrink-0" aria-hidden="true">
      <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-negro-barbero" />
      <motion.span
        className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-negro-barbero"
        animate={{ rotate: abierto ? 0 : 90 }}
        transition={{ duration: 0.3, ease: EASE_ENTRADA }}
      />
    </span>
  )
}

function ItemFAQ({ pregunta, respuesta, indice, abierto, onToggle }) {
  const prefiereReducido = usePrefersReducedMotion()
  const idPanel = `faq-panel-${indice}`
  const idBoton = `faq-boton-${indice}`

  return (
    <div className="border-t border-gris-calido-200 first:border-t-0">
      <button
        type="button"
        id={idBoton}
        aria-expanded={abierto}
        aria-controls={idPanel}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-6 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-laton"
      >
        <span className="flex items-baseline gap-4">
          <span className="numeros-tabulares text-sm text-cobre-texto">
            {String(indice + 1).padStart(2, '0')}
          </span>
          <span className="font-display text-lg font-light tracking-tight text-negro-barbero md:text-xl">
            {pregunta}
          </span>
        </span>
        <IconoMasMenos abierto={abierto} />
      </button>
      <motion.div
        id={idPanel}
        role="region"
        aria-labelledby={idBoton}
        initial={false}
        animate={{ height: abierto ? 'auto' : 0 }}
        transition={{ duration: prefiereReducido ? 0 : 0.35, ease: EASE_ENTRADA }}
        style={{ overflow: 'hidden' }}
      >
        <p className="max-w-xl pb-6 pl-9 text-sm leading-relaxed text-gris-calido-700 md:text-base">
          {respuesta}
        </p>
      </motion.div>
    </div>
  )
}

export function FAQ() {
  const [abierto, setAbierto] = useState(0)

  return (
    <section className="px-6 py-20 md:px-10 md:py-28">
      <SectionRule indice="— 06" texto="Preguntas frecuentes" tono="oscuro" />

      <div className="mt-14 grid grid-cols-12 gap-x-6">
        <div className="col-span-12 mb-8 md:col-span-3 md:mb-0">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-light leading-tight tracking-tight md:text-4xl">
              Antes de que preguntes
            </h2>
          </ScrollReveal>
        </div>

        <div className="col-span-12 md:col-span-8 md:col-start-5">
          {PREGUNTAS.map((item, indice) => (
            <ItemFAQ
              key={item.pregunta}
              {...item}
              indice={indice}
              abierto={abierto === indice}
              onToggle={() => setAbierto(abierto === indice ? null : indice)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
