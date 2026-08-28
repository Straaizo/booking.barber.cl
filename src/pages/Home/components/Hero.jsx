import { motion } from 'framer-motion'
import { Button } from '../../../components/common/Button'
import { HoverLink } from '../../../components/common/HoverLink'
import { HeroScene3D } from '../../../components/animations/HeroScene3D'
import { HeroFondoMovil } from './HeroFondoMovil'
import { TextReveal } from '../../../components/animations/TextReveal'
import { EASE_ENTRADA } from '../../../components/animations/easing'
import { useIsMobile } from '../../../hooks/useIsMobile'

// Flecha de trazo a mano, misma familia que los íconos del oficio en
// Marquee.jsx (`stroke: currentColor`, sin relleno) — nunca una flecha
// genérica de librería de íconos.
function FlechaScroll() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 4v15M5 13l7 7 7-7" />
    </svg>
  )
}

export function Hero() {
  // En mobile no se muestra ni el modelo 3D ni el respaldo estático (ver
  // HeroScene3D.jsx para el porqué del 3D) — el poste ilustrado tampoco
  // terminaba de sentirse parte de la identidad de la barbería ahí. En su
  // lugar, el fondo sólido se reemplaza por un carrusel de fotos reales
  // difuminadas (HeroFondoMovil), y el texto queda igual encima.
  const isMobile = useIsMobile()

  return (
    <section className="relative flex flex-1 flex-col justify-center overflow-hidden bg-negro-barbero px-6 py-20 text-hueso md:px-10">
      {isMobile && <HeroFondoMovil />}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-1/2 z-0 h-96 w-96 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #A85C32 0%, transparent 70%)' }}
      />

      <div className="relative z-10 mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2 md:gap-12">
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: EASE_ENTRADA, delay: 0.15 }}
            className="order-2 flex justify-center md:order-1"
          >
            <HeroScene3D />
          </motion.div>
        )}

        <div className="order-1 text-center md:order-2 md:text-left">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_ENTRADA }}
            className="versalitas mb-4 text-sm text-cobre-claro"
          >
            Simple para ti, fácil para tus clientes
          </motion.p>

          <TextReveal
            texto="Tu barbería, *con agenda y web única* en internet."
            as="h1"
            className="text-[2.6rem] font-light leading-[1.05] tracking-tight md:text-6xl"
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: EASE_ENTRADA }}
            className="mx-auto mt-6 max-w-lg text-gris-calido-200 md:mx-0 md:text-lg"
          >
            Tu propia página, tus servicios, tus horarios, tus barberos. 
            Todo desde un mismo panel. Sin apps que
            instalar. 
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

      <motion.a
        href="#como-funciona"
        aria-label="Bajar para ver cómo funciona"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{
          opacity: { duration: 0.6, delay: 1.1, ease: EASE_ENTRADA },
          y: { duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 1.1 },
        }}
        className="absolute inset-x-0 bottom-8 z-10 mx-auto flex w-fit flex-col items-center gap-2 text-gris-calido-300 transition-colors hover:text-hueso"
      >
        <span className="versalitas text-[10px]">Scroll</span>
        <FlechaScroll />
      </motion.a>
    </section>
  )
}
