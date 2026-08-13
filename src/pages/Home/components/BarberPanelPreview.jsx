import { motion } from 'framer-motion'
import { SectionRule } from '../../../components/common/SectionRule'
import { ScrollReveal } from '../../../components/animations/ScrollReveal'
import { EASE_ENTRADA, DURACION_BASE } from '../../../components/animations/easing'
import { Interruptor } from '../../../components/panel/Interruptor'

const NAV = ['Reservas', 'Horarios', 'Servicios']

const ANOTACIONES = [
  {
    texto: 'Entra con su propio usuario y contraseña — no comparte el panel del dueño',
    top: '10%',
  },
  {
    texto: 'Si un día llega más tarde, deja esa excepción puntual sin tocar su horario de siempre',
    top: '44%',
  },
  {
    texto: 'El intervalo entre horas ofrecidas lo elige él — no tiene por qué ser igual a la duración del servicio',
    top: '78%',
  },
]

function Mockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gris-calido-200 bg-white shadow-sm">
      <div className="flex">
        <div className="hidden w-36 shrink-0 flex-col gap-1 bg-negro-barbero p-4 sm:flex">
          <span className="versalitas mb-3 whitespace-nowrap text-[10px] text-gris-calido-400">
            Panel de barbero
          </span>
          {NAV.map((item, indice) => (
            <span
              key={item}
              className={`rounded px-2.5 py-2 text-xs ${
                indice === 1 ? 'bg-cobre-oscuro text-hueso' : 'text-gris-calido-200'
              }`}
            >
              {item}
            </span>
          ))}
        </div>

        <div className="flex-1 p-5 md:p-7">
          <h4 className="font-display text-lg font-light tracking-tight text-negro-barbero md:text-xl">
            Mis horarios
          </h4>

          {/* Misma tarjeta que FilaHorario.jsx de verdad: encabezado con el
              día + el interruptor de "activo" (el componente real, no una
              imitación), y debajo desde/hasta separados por un divisor. */}
          <div className="mt-4 rounded-lg border border-gris-calido-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="versalitas text-[10px] text-gris-calido-500">Día</span>
                <p className="text-sm font-medium text-negro-barbero">Lunes</p>
              </div>
              <Interruptor activo onCambiar={() => {}} etiqueta="Bloque activo" />
            </div>
            <div className="mt-3 flex gap-6 border-t border-gris-calido-100 pt-3">
              <div>
                <span className="versalitas block text-[10px] text-gris-calido-500">Desde</span>
                <span className="numeros-tabulares text-sm text-negro-barbero">10:00</span>
              </div>
              <div>
                <span className="versalitas block text-[10px] text-gris-calido-500">Hasta</span>
                <span className="numeros-tabulares text-sm text-negro-barbero">19:00</span>
              </div>
            </div>
          </div>

          {/* Misma tarjeta que ExcepcionesHorario.jsx: borde punteado color
              cobre y la fecha exacta reemplazando el bloque de siempre. */}
          <div className="mt-3 rounded-lg border border-dashed border-cobre/40 bg-cobre/5 px-4 py-3">
            <span className="versalitas text-[10px] text-cobre-texto">Excepción — mañana</span>
            <p className="mt-1 text-sm text-negro-barbero">desde las 12:30 hasta las 19:00</p>
          </div>

          {/* Misma tarjeta que SelectorIntervaloReserva.jsx */}
          <div className="mt-3 rounded-lg border border-gris-calido-200 px-4 py-3">
            <span className="versalitas text-[10px] text-gris-calido-500">Intervalo entre reservas</span>
            <p className="mt-1 text-sm font-medium text-negro-barbero">Cada 45 min</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Anotacion({ texto, indice }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: DURACION_BASE, ease: EASE_ENTRADA, delay: indice * 0.18 }}
      className="flex items-center gap-3"
    >
      <span className="h-px w-8 shrink-0 bg-cobre" />
      <p className="max-w-[15rem] text-sm text-gris-calido-700">{texto}</p>
    </motion.div>
  )
}

// Continuación directa de PanelPreview.jsx (el panel del dueño): acá se ve
// que el barbero no solo "aparece" en el panel del dueño, tiene el suyo
// propio — con su login, su horario (incluidas excepciones puntuales) y su
// intervalo entre reservas. Mismo patrón visual (mockup + anotaciones
// flotando) para que se sienta continuación de la sección anterior, no una
// pantalla desconectada.
export function BarberPanelPreview() {
  return (
    <section className="px-6 py-20 md:px-10 md:py-28">
      <SectionRule indice="— 04c" texto="El panel de cada barbero" tono="oscuro" />

      <ScrollReveal className="mt-14 max-w-2xl">
        <h2 className="font-display text-3xl font-light leading-tight tracking-tight md:text-5xl">
          Y cada barbero entra <em className="not-italic text-cobre-texto">al suyo, no al del dueño.</em>
        </h2>
        <p className="mt-4 max-w-lg text-gris-calido-700">
          El dueño decide si un barbero puede tener sus propios servicios y precios — pero su
          horario, sus excepciones y su login siempre son suyos.
        </p>
      </ScrollReveal>

      <div className="mt-14 hidden gap-10 lg:grid lg:grid-cols-12">
        <div className="col-span-7">
          <Mockup />
        </div>
        <div className="col-span-5 flex flex-col justify-between py-4">
          {ANOTACIONES.map((anotacion, indice) => (
            <Anotacion key={anotacion.texto} texto={anotacion.texto} indice={indice} />
          ))}
        </div>
      </div>

      <div className="mt-14 lg:hidden">
        <Mockup />
        <div className="mt-8 flex flex-col gap-6">
          {ANOTACIONES.map((anotacion, indice) => (
            <Anotacion key={anotacion.texto} texto={anotacion.texto} indice={indice} />
          ))}
        </div>
      </div>
    </section>
  )
}
