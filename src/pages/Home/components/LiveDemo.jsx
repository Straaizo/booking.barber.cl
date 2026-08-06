import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { PhoneMockup } from '../../../components/common/PhoneMockup'
import { HoverLink } from '../../../components/common/HoverLink'
import { SectionRule } from '../../../components/common/SectionRule'
import { EASE_ENTRADA } from '../../../components/animations/easing'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'

const INTERVALO_MS = 2400

const PASOS = [
  { titulo: 'Elige un servicio', texto: 'Ve los servicios, precios y ofertas de un vistazo.' },
  { titulo: 'Elige un barbero', texto: 'Si hay más de uno, el cliente elige con quién quiere ir.' },
  { titulo: 'Elige un horario', texto: 'Solo se muestran las horas realmente disponibles.' },
  { titulo: 'Ingresa sus datos', texto: 'Nombre y celular. Nada más — sin crear cuenta.' },
  { titulo: '¡Listo!', texto: 'La reserva queda confirmada y tú te enteras al instante.' },
]

function PantallaServicio() {
  return (
    <div className="p-5">
      <h4 className="font-display text-base font-light text-negro-barbero">Elige un servicio</h4>
      <div className="mt-4 flex flex-col gap-3">
        {[
          { nombre: 'Corte clásico', precio: '$9.000' },
          { nombre: 'Corte + Barba', precio: '$12.000' },
        ].map((servicio, indice) => (
          <motion.div
            key={servicio.nombre}
            initial={{ scale: 1 }}
            animate={indice === 1 ? { scale: [1, 0.97, 1] } : {}}
            transition={{ delay: 0.9, duration: 0.4 }}
            className={`flex items-center justify-between rounded-lg border px-3 py-3 text-sm ${
              indice === 1 ? 'border-cobre bg-cobre/5' : 'border-gris-calido-200'
            }`}
          >
            <span className="text-negro-barbero">{servicio.nombre}</span>
            <span className="numeros-tabulares font-semibold text-negro-barbero">
              {servicio.precio}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function PantallaBarbero() {
  return (
    <div className="p-5">
      <h4 className="font-display text-base font-light text-negro-barbero">Elige un barbero</h4>
      <div className="mt-4 flex flex-col gap-3">
        {['Javier Muñoz', 'Cristóbal Díaz'].map((nombre, indice) => (
          <div
            key={nombre}
            className={`rounded-lg border px-3 py-3 text-sm text-negro-barbero ${
              indice === 0 ? 'border-cobre bg-cobre/5' : 'border-gris-calido-200'
            }`}
          >
            {nombre}
          </div>
        ))}
      </div>
    </div>
  )
}

function PantallaHorario() {
  const horas = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30']
  return (
    <div className="p-5">
      <h4 className="font-display text-base font-light text-negro-barbero">Elige día y hora</h4>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {horas.map((hora, indice) => (
          <div
            key={hora}
            className={`numeros-tabulares rounded-lg border py-2 text-center text-xs ${
              indice === 2
                ? 'border-cobre bg-cobre text-hueso'
                : 'border-gris-calido-200 text-negro-barbero'
            }`}
          >
            {hora}
          </div>
        ))}
      </div>
    </div>
  )
}

function PantallaDatos() {
  return (
    <div className="p-5">
      <h4 className="font-display text-base font-light text-negro-barbero">Tus datos</h4>
      <div className="mt-4 flex flex-col gap-3">
        <div>
          <span className="versalitas text-[10px] text-gris-calido-500">Nombre</span>
          <div className="mt-1 rounded-lg border border-gris-calido-200 px-3 py-2 text-sm text-negro-barbero">
            Matías Rojas
          </div>
        </div>
        <div>
          <span className="versalitas text-[10px] text-gris-calido-500">Celular</span>
          <div className="mt-1 rounded-lg border border-gris-calido-200 px-3 py-2 text-sm text-negro-barbero">
            +56 9 8765 4321
          </div>
        </div>
        <div className="mt-2 rounded-lg bg-cobre-oscuro py-2.5 text-center text-sm font-semibold text-hueso">
          Confirmar reserva
        </div>
      </div>
    </div>
  )
}

function PantallaConfirmado() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-verde-barberia text-xl text-hueso"
      >
        ✓
      </motion.div>
      <p className="font-display text-base font-light text-negro-barbero">
        ¡Reserva confirmada!
      </p>
      <p className="text-xs text-gris-calido-500">Corte + Barba · Javier Muñoz · 11:00</p>
    </div>
  )
}

const PANTALLAS = [PantallaServicio, PantallaBarbero, PantallaHorario, PantallaDatos, PantallaConfirmado]

export function LiveDemo() {
  const [paso, setPaso] = useState(0)
  const contenedorRef = useRef(null)
  const enVista = useInView(contenedorRef, { amount: 0.4 })
  const prefiereReducido = usePrefersReducedMotion()

  useEffect(() => {
    if (!enVista || prefiereReducido) return
    const id = setInterval(() => setPaso((actual) => (actual + 1) % PASOS.length), INTERVALO_MS)
    return () => clearInterval(id)
  }, [enVista, prefiereReducido])

  return (
    <section ref={contenedorRef} className="bg-gris-calido-100 px-6 py-20 md:px-10 md:py-28">
      <SectionRule indice="— 02" texto="Así se ve, de verdad" tono="oscuro" />

      <div className="mt-14 grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
        <div className="order-2 md:order-1">
          <PhoneMockup>
            {/* Las 5 pantallas viven todas montadas, apiladas en la misma celda
                de grid ([grid-area:1/1]) — así el contenedor mide, desde el
                primer render, el alto de la más alta de las 5. Nada de adivinar
                un alto fijo en rem que se descalza con contenido más largo.
                `h-full content-center` centra ese bloque (ya del alto de la
                pantalla más alta) dentro del piso de altura del teléfono, que
                puede ser mayor; `flex items-center` en cada ítem centra además
                el contenido propio de las pantallas más cortas dentro de la
                fila compartida. */}
            <div className="grid flex-1 content-center">
              {PANTALLAS.map((Pantalla, indice) => (
                <motion.div
                  key={indice}
                  className="flex flex-col justify-center [grid-area:1/1]"
                  style={{ pointerEvents: indice === paso ? 'auto' : 'none' }}
                  aria-hidden={indice !== paso}
                  initial={false}
                  animate={{
                    opacity: indice === paso ? 1 : 0,
                    x: indice === paso ? 0 : indice < paso ? -24 : 24,
                  }}
                  transition={{ duration: 0.35, ease: EASE_ENTRADA }}
                >
                  <Pantalla />
                </motion.div>
              ))}
            </div>
          </PhoneMockup>
        </div>

        <div className="order-1 md:order-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={paso}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: EASE_ENTRADA }}
            >
              <span className="numeros-tabulares text-sm text-cobre-texto">
                {String(paso + 1).padStart(2, '0')} / {String(PASOS.length).padStart(2, '0')}
              </span>
              <h3 className="mt-2 font-display text-3xl font-light leading-tight tracking-tight md:text-4xl">
                {PASOS[paso].titulo}
              </h3>
              <p className="mt-3 max-w-sm text-sm text-gris-calido-700 md:text-base">
                {PASOS[paso].texto}
              </p>
            </motion.div>
          </AnimatePresence>

          <p className="mt-10 text-sm text-gris-calido-500">
            Esto es una simulación.{' '}
            <HoverLink href="/demo" className="font-medium text-cobre-texto">
              Prueba la reserva de verdad ↗
            </HoverLink>
          </p>
        </div>
      </div>
    </section>
  )
}
