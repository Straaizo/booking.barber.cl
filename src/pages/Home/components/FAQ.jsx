import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { SectionRule } from '../../../components/common/SectionRule'
import { ScrollReveal } from '../../../components/animations/ScrollReveal'
import { EASE_ENTRADA } from '../../../components/animations/easing'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'

const INTERVALO_MS = 4000

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
    pregunta: '¿Qué pasa si dejo de pagar?',
    respuesta:
      'Tu página se desactiva y tus clientes ven que no está disponible por ahora. Nada se borra — si vuelves, todo sigue donde lo dejaste.',
  },
  {
    pregunta: '¿Puedo cambiar mis precios yo mismo?',
    respuesta:
      'Sí. Tú y tus barberos pueden actualizar precios y ofertas cuando quieran, y se reflejan al instante en tu página pública.',
  },
  {
    pregunta: '¿Puedo hacer ofertas o descuentos?',
    respuesta:
      'Sí, y sin límite. A cualquier servicio le pones un precio de oferta —con fecha de vencimiento si quieres— y en tu página se muestra el precio normal tachado al lado. Se activa y se desactiva cuando tú quieras.',
  },
  {
    pregunta: '¿Puedo manejar los horarios de cada barbero?',
    respuesta:
      'Sí. Cada barbero configura sus propios horarios y sus días libres — si alguien no trabaja un feriado o se toma vacaciones, ese día simplemente no aparece disponible para reservar con él.',
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

function ItemFAQ({ pregunta, respuesta, indice, abierto, onAbrir, onSalir }) {
  const prefiereReducido = usePrefersReducedMotion()
  const idPanel = `faq-panel-${indice}`
  const idBoton = `faq-boton-${indice}`

  return (
    <div
      className="border-t border-gris-calido-200 first:border-t-0"
      onMouseEnter={onAbrir}
      onMouseLeave={onSalir}
    >
      <button
        type="button"
        id={idBoton}
        aria-expanded={abierto}
        aria-controls={idPanel}
        onClick={onAbrir}
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
  // `indiceAuto` es la posición "de verdad" de la secuencia — nunca la toca
  // el hover, solo el intervalo y el click. `enPausa` para cuando el mouse
  // está encima de una pregunta: el intervalo se detiene ahí mismo (no se
  // reinicia el conteo de los 4s de la que sigue) y, al sacar el mouse,
  // arranca de nuevo desde `indiceAuto` tal cual quedó — nunca salta a la
  // que se estaba mirando ni vuelve a la primera.
  const [indiceAuto, setIndiceAuto] = useState(0)
  const [enPausa, setEnPausa] = useState(false)
  const contenedorRef = useRef(null)
  const enVista = useInView(contenedorRef, { amount: 0.4 })
  const prefiereReducido = usePrefersReducedMotion()

  useEffect(() => {
    if (!enVista || enPausa || prefiereReducido) return
    const id = setInterval(() => {
      setIndiceAuto((actual) => (actual + 1) % PREGUNTAS.length)
    }, INTERVALO_MS)
    return () => clearInterval(id)
  }, [enVista, enPausa, prefiereReducido])

  return (
    <section ref={contenedorRef} className="px-6 py-20 md:px-10 md:py-28">
      <SectionRule indice="— 01" texto="Preguntas frecuentes" tono="oscuro" />

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
              abierto={indiceAuto === indice}
              onAbrir={() => {
                // Si el mouse queda descansando justo sobre la pregunta que
                // el autoplay ya tiene abierta (lo más común: es la que la
                // persona está leyendo), no hay nada que pausar — pausar acá
                // significa que nunca avanza mientras alguien la esté
                // leyendo. Solo pausa al pasar a una pregunta DISTINTA, que
                // es la señal real de "quiero ver esta otra".
                if (indice === indiceAuto) return
                setIndiceAuto(indice)
                setEnPausa(true)
              }}
              onSalir={() => setEnPausa(false)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
