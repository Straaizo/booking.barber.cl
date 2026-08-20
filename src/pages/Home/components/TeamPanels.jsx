import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SectionRule } from '../../../components/common/SectionRule'
import { ScrollReveal } from '../../../components/animations/ScrollReveal'
import { Interruptor } from '../../../components/panel/Interruptor'
import { EASE_ENTRADA, DURACION_BASE } from '../../../components/animations/easing'

const NAV_DUENO = ['Reservas', 'Barberos', 'Servicios', 'Horarios', 'Personalización']
const NAV_BARBERO = ['Reservas', 'Horarios', 'Servicios']

const RESERVAS_DEMO = [
  { id: 1, cliente: 'Matías Rojas', servicio: 'Corte + Barba', barbero: 'Javier Muñoz', precio: '$13.000', hora: '10:30' },
  { id: 2, cliente: 'Ignacio Paredes', servicio: 'Corte clásico', barbero: 'Cristóbal Díaz', precio: '$8.000', hora: '11:15' },
  { id: 3, cliente: 'Diego Fuentes', servicio: 'Afeitado', barbero: 'Javier Muñoz', precio: '$7.500', hora: '12:00' },
]

function MockupDueno() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gris-calido-200 bg-white shadow-sm">
      <div className="flex">
        <div className="hidden w-36 shrink-0 flex-col gap-1 bg-negro-barbero p-4 sm:flex">
          <span className="versalitas mb-3 text-[10px] text-gris-calido-400">Tu barbería</span>
          {NAV_DUENO.map((item, indice) => (
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
          <h4 className="font-display text-lg font-light tracking-tight text-negro-barbero md:text-xl">
            Reservas
          </h4>
          <p className="mt-1 text-xs text-gris-calido-500">
            Todas las reservas de tu barbería, ordenadas por fecha.
          </p>

          <div className="mt-4 flex flex-col">
            {RESERVAS_DEMO.map((reserva) => (
              <div
                key={reserva.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-gris-calido-100 py-3 text-sm first:border-t first:border-t-gris-calido-100"
              >
                <span className="numeros-tabulares text-gris-calido-500">{reserva.hora}</span>
                <div className="min-w-0">
                  <span className="block truncate font-medium text-negro-barbero">{reserva.cliente}</span>
                  <span className="versalitas hidden text-[10px] text-gris-calido-500 sm:block">
                    {reserva.servicio} · {reserva.barbero} · {reserva.precio}
                  </span>
                </div>
                <button
                  type="button"
                  tabIndex={-1}
                  className="versalitas hidden shrink-0 text-[10px] text-red-700/70 underline decoration-red-700/30 md:inline"
                >
                  Cancelar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MockupBarbero() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gris-calido-200 bg-white shadow-sm">
      <div className="flex">
        <div className="hidden w-36 shrink-0 flex-col gap-1 bg-negro-barbero p-4 sm:flex">
          <span className="versalitas mb-3 whitespace-nowrap text-[10px] text-gris-calido-400">
            Panel de barbero
          </span>
          {NAV_BARBERO.map((item, indice) => (
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

          <div className="mt-3 rounded-lg border border-dashed border-cobre/40 bg-cobre/5 px-4 py-3">
            <span className="versalitas text-[10px] text-cobre-texto">Excepción — mañana</span>
            <p className="mt-1 text-sm text-negro-barbero">desde las 12:30 hasta las 19:00</p>
          </div>

          <div className="mt-3 rounded-lg border border-gris-calido-200 px-4 py-3">
            <span className="versalitas text-[10px] text-gris-calido-500">Intervalo entre reservas</span>
            <p className="mt-1 text-sm font-medium text-negro-barbero">Cada 45 min</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const VISTAS = [
  {
    clave: 'dueno',
    etiqueta: 'Tu vista',
    Mockup: MockupDueno,
    anotaciones: [
      'Ves cada reserva nueva al instante, sin revisar WhatsApp',
      'Cambias precios y ofertas tú mismo, se reflejan al momento',
      'Todo tu negocio — barberos, servicios, horarios — en un lugar',
    ],
  },
  {
    clave: 'barbero',
    etiqueta: 'La de cada barbero',
    Mockup: MockupBarbero,
    anotaciones: [
      'Entra con su propio usuario — no comparte el tuyo',
      'Si llega tarde un día, ajusta solo ese día, sin tocar su horario de siempre',
      'Elige cada cuánto ofrecer horas — no depende de la duración del corte',
    ],
  },
]

function Anotacion({ texto, indice }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: DURACION_BASE, ease: EASE_ENTRADA, delay: indice * 0.12 }}
      className="flex items-center gap-3"
    >
      <span className="h-px w-8 shrink-0 bg-cobre" />
      <p className="max-w-[15rem] text-sm text-gris-calido-700">{texto}</p>
    </motion.div>
  )
}

// Antes eran dos secciones (una por rol). Se fusionaron en un solo bloque
// con un selector — la misma información, en un scroll-stop menos: nadie
// necesita ver dos pantallas completas para entender "el dueño ve esto, el
// barbero ve aquello", con un botón alcanza.
export function TeamPanels() {
  const [activa, setActiva] = useState(0)
  const vista = VISTAS[activa]

  return (
    <section className="px-6 py-20 md:px-10 md:py-28">
      <SectionRule indice="— 02" texto="Tu equipo, su panel" tono="oscuro" />

      <ScrollReveal className="mt-14 max-w-2xl">
        <h2 className="font-display text-3xl font-light leading-tight tracking-tight md:text-5xl">
          Tú ves todo. <em className="not-italic text-cobre-texto">Cada barbero, solo lo suyo.</em>
        </h2>
        <p className="mt-4 max-w-lg text-gris-calido-700">
          Ninguno entra al panel del otro — ni por accidente.
        </p>
      </ScrollReveal>

      <div className="mt-10 flex gap-2">
        {VISTAS.map((v, indice) => (
          <button
            key={v.clave}
            type="button"
            onClick={() => setActiva(indice)}
            className={`versalitas rounded-full border px-4 py-2 text-xs transition-colors ${
              activa === indice
                ? 'border-cobre bg-cobre text-hueso'
                : 'border-gris-calido-200 text-gris-calido-700 hover:border-cobre/50'
            }`}
          >
            {v.etiqueta}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={vista.clave}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE_ENTRADA }}
        >
          <div className="mt-10 hidden gap-10 lg:grid lg:grid-cols-12">
            <div className="col-span-7">
              <vista.Mockup />
            </div>
            <div className="col-span-5 flex flex-col justify-between py-4">
              {vista.anotaciones.map((texto, indice) => (
                <Anotacion key={texto} texto={texto} indice={indice} />
              ))}
            </div>
          </div>

          <div className="mt-10 lg:hidden">
            <vista.Mockup />
            <div className="mt-8 flex flex-col gap-6">
              {vista.anotaciones.map((texto, indice) => (
                <Anotacion key={texto} texto={texto} indice={indice} />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
