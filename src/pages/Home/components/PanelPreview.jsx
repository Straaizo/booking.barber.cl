import { motion } from 'framer-motion'
import { SectionRule } from '../../../components/common/SectionRule'
import { ScrollReveal } from '../../../components/animations/ScrollReveal'
import { EASE_ENTRADA, DURACION_BASE } from '../../../components/animations/easing'

const NAV = ['Reservas', 'Barberos', 'Servicios', 'Horarios']

const RESERVAS_DEMO = [
  { id: 1, cliente: 'Matías Rojas', servicio: 'Corte + Barba', hora: '10:30' },
  { id: 2, cliente: 'Ignacio Paredes', servicio: 'Corte clásico', hora: '11:15' },
  { id: 3, cliente: 'Diego Fuentes', servicio: 'Afeitado', hora: '12:00' },
]

const ANOTACIONES = [
  {
    texto: 'Ves cada reserva nueva al instante, sin revisar WhatsApp',
    top: '14%',
    lado: 'derecha',
  },
  {
    texto: 'Cambia precios y ofertas tú mismo, se reflejan al momento',
    top: '46%',
    lado: 'derecha',
  },
  {
    texto: 'Todo tu negocio — barberos, servicios, horarios — en un lugar',
    top: '78%',
    lado: 'derecha',
  },
]

function Mockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gris-calido-200 bg-white shadow-sm">
      <div className="flex">
        <div className="hidden w-36 shrink-0 flex-col gap-1 bg-negro-barbero p-4 sm:flex">
          <span className="versalitas mb-3 text-[10px] text-gris-calido-400">
            Tu barbería
          </span>
          {NAV.map((item, indice) => (
            <span
              key={item}
              className={`rounded px-2.5 py-2 text-xs ${
                indice === 0 ? 'bg-cobre-oscuro text-hueso' : 'text-gris-calido-200'
              }`}
            >
              {item}
            </span>
          ))}
        </div>

        <div className="flex-1 p-5 md:p-7">
          <div className="flex items-baseline justify-between">
            <h4 className="font-display text-lg font-light tracking-tight text-negro-barbero md:text-xl">
              Reservas de hoy
            </h4>
            <span className="numeros-tabulares text-xs text-gris-calido-500">
              {RESERVAS_DEMO.length} nuevas
            </span>
          </div>

          <div className="mt-4 flex flex-col">
            {RESERVAS_DEMO.map((reserva) => (
              <div
                key={reserva.id}
                className="flex items-center justify-between gap-3 border-b border-gris-calido-100 py-3 text-sm first:border-t first:border-t-gris-calido-100"
              >
                <span className="font-medium text-negro-barbero">{reserva.cliente}</span>
                <span className="hidden text-gris-calido-500 sm:inline">
                  {reserva.servicio}
                </span>
                <span className="numeros-tabulares text-negro-barbero">{reserva.hora}</span>
              </div>
            ))}
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

export function PanelPreview() {
  return (
    <section className="px-6 py-20 md:px-10 md:py-28">
      <SectionRule indice="— 04b" texto="Tu panel" tono="oscuro" />

      <ScrollReveal className="mt-14 max-w-2xl">
        <h2 className="font-display text-3xl font-light leading-tight tracking-tight md:text-5xl">
          Los barberos también quieren saber{' '}
          <em className="not-italic text-cobre-texto">qué van a usar ellos.</em>
        </h2>
      </ScrollReveal>

      {/* Desktop: mockup con anotaciones flotando a la derecha */}
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

      {/* Mobile / tablet: mockup simplificado + anotaciones como lista debajo */}
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
