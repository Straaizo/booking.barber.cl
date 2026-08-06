import { motion } from 'framer-motion'
import { Button } from '../../../components/common/Button'
import { HoverLink } from '../../../components/common/HoverLink'
import { HeroScene3D } from '../../../components/animations/HeroScene3D'
import { TextReveal } from '../../../components/animations/TextReveal'
import { EASE_ENTRADA } from '../../../components/animations/easing'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-negro-barbero px-6 py-14 text-hueso md:px-10 md:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #A85C32 0%, transparent 70%)' }}
      />

      <div className="relative mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2 md:gap-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: EASE_ENTRADA, delay: 0.15 }}
          className="order-2 flex justify-center md:order-1"
        >
          <HeroScene3D />
        </motion.div>

        <div className="order-1 text-center md:order-2 md:text-left">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_ENTRADA }}
            className="versalitas mb-4 text-sm text-cobre"
          >
            Reservas online para barberías chilenas
          </motion.p>

          <TextReveal
            texto="Tu barbería, *con hora propia* en internet."
            as="h1"
            className="text-[2.6rem] font-light leading-[1.05] tracking-tight md:text-6xl"
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: EASE_ENTRADA }}
            className="mx-auto mt-6 max-w-lg text-gris-calido-200 md:mx-0 md:text-lg"
          >
            Cada barbería tiene su propia página, sus servicios, sus horarios y sus
            barberos — sin apps que tus clientes tengan que descargar, sin agenda de
            WhatsApp que se pierde.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65, ease: EASE_ENTRADA }}
            className="mt-9 flex flex-col items-center justify-center gap-5 sm:flex-row md:justify-start"
          >
            <Button href="#planes">Quiero mi barbería en booking.barber.cl</Button>
            <HoverLink href="#como-funciona" className="text-sm font-medium text-gris-calido-200">
              Ver cómo funciona ↓
            </HoverLink>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
