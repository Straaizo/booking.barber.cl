import { motion } from 'framer-motion'
import { SectionRule } from '../../../components/common/SectionRule'
import { ScrollReveal } from '../../../components/animations/ScrollReveal'
import { EASE_ENTRADA, DURACION_BASE } from '../../../components/animations/easing'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'

const FILAS = [
  {
    antes: 'Anotas los cortes a mano en un cuaderno',
    despues: 'Tu agenda queda registrada automáticamente',
  },
  {
    antes: 'Los mensajes de WhatsApp se pierden entre conversaciones',
    despues: 'Cada reserva llega directo, sin perderse en el chat',
  },
  {
    antes: 'Agendas a dos clientes a la misma hora por error',
    despues: 'El sistema no deja agendar dos veces la misma hora',
  },
  {
    antes: 'Respondes mensajes mientras le estás cortando el pelo a otro cliente',
    despues: 'Tus clientes reservan solos, sin que tengas que responder nada',
  },
]

function Fila({ antes, despues, indice }) {
  const prefiereReducido = usePrefersReducedMotion()
  const inicial = prefiereReducido ? {} : { opacity: 0 }

  return (
    <div className="grid grid-cols-1 gap-4 border-t border-hueso/10 py-7 md:grid-cols-2 md:gap-12">
      <motion.p
        initial={{ ...inicial, x: prefiereReducido ? 0 : -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: DURACION_BASE, ease: EASE_ENTRADA, delay: indice * 0.06 }}
        className="text-sm text-gris-calido-400 md:text-base"
      >
        {antes}
      </motion.p>
      <motion.p
        initial={{ ...inicial, x: prefiereReducido ? 0 : 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: DURACION_BASE, ease: EASE_ENTRADA, delay: indice * 0.06 + 0.08 }}
        className="text-sm font-medium text-hueso md:text-base"
      >
        {despues}
      </motion.p>
    </div>
  )
}

export function NotebookVsApp() {
  return (
    <section className="bg-negro-barbero px-6 py-20 text-hueso md:px-10 md:py-28">
      <SectionRule indice="— 05" texto="La competencia real" tono="claro" />

      <ScrollReveal className="mt-14">
        <h2 className="max-w-2xl font-display text-3xl font-light leading-tight tracking-tight md:text-5xl">
          Tu competencia no es otro software.{' '}
          <em className="not-italic text-cobre-claro">Es el cuaderno.</em>
        </h2>
      </ScrollReveal>

      <div className="mt-12">
        <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2 md:gap-12">
          <span className="versalitas text-xs text-gris-calido-400">
            El cuaderno + WhatsApp
          </span>
          <span className="versalitas text-xs text-cobre-claro">booking.barber.cl</span>
        </div>

        {FILAS.map((fila, indice) => (
          <Fila key={fila.antes} {...fila} indice={indice} />
        ))}
      </div>
    </section>
  )
}
