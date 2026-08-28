import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SectionRule } from '../../../components/common/SectionRule'
import { ScrollReveal } from '../../../components/animations/ScrollReveal'
import { Interruptor } from '../../../components/panel/Interruptor'
import { EASE_ENTRADA, DURACION_BASE } from '../../../components/animations/easing'

const NAV_DUENO = ['Reservas', 'Barberos', 'Servicios', 'Horarios', 'Personalización']
const NAV_BARBERO = ['Reservas', 'Horarios', 'Servicios']

const DIAS_SEMANA = [
  { corto: 'LUN', num: 24 },
  { corto: 'MAR', num: 25 },
  { corto: 'MIÉ', num: 26 },
  { corto: 'JUE', num: 27 },
  { corto: 'VIE', num: 28 },
  { corto: 'SÁB', num: 29 },
  { corto: 'DOM', num: 30 },
]
const HORAS_DEMO = ['09:00', '10:00', '11:00', '12:00']

// Barra superior oscura + fila de pestañas blancas — el mismo cascarón real
// de todo el panel (ver `PanelShell.jsx`), no una barra lateral inventada.
// Antes esta sección mostraba un sidebar oscuro que no existe en ningún
// lugar de la app real — la imagen que se vendía no era la que el dueño
// termina usando.
function EncabezadoPanelMock({ titulo, secciones, activaIndice }) {
  return (
    <>
      <div className="flex items-center justify-between bg-negro-barbero px-4 py-2.5 text-hueso">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="font-display shrink-0 text-xs italic tracking-tight">
            booking<span className="text-cobre">.</span>barber.cl
          </span>
          <span className="versalitas hidden truncate text-[9px] text-gris-calido-400 sm:inline">{titulo}</span>
        </div>
        <span className="versalitas shrink-0 rounded border border-gris-calido-700 px-2 py-1 text-[9px]">
          Cerrar sesión
        </span>
      </div>
      <div className="flex gap-4 overflow-x-auto border-b border-gris-calido-200 bg-white px-4">
        {secciones.map((seccion, indice) => (
          <span
            key={seccion}
            className={`versalitas whitespace-nowrap border-b-2 py-2.5 text-[10px] ${
              indice === activaIndice ? 'border-cobre text-negro-barbero' : 'border-transparent text-gris-calido-500'
            }`}
          >
            {seccion}
          </span>
        ))}
      </div>
    </>
  )
}

// Línea de tiempo semanal — el mismo patrón real de `CalendarioReservas.jsx`
// (columnas por día, filas por hora, bloques de color por barbero), reducido
// a 4 horas para que quepa en una tarjeta chica en vez de las ~13 reales.
function MiniCalendario() {
  return (
    <div className="hidden rounded-lg border border-gris-calido-200 bg-white p-3 sm:block">
      <div className="flex items-center justify-between text-gris-calido-400">
        <span>‹</span>
        <span className="numeros-tabulares text-xs font-medium text-negro-barbero">24 – 30 Ago</span>
        <span>›</span>
      </div>
      <div className="mt-3 grid grid-cols-[2.5rem_repeat(7,1fr)] overflow-hidden rounded border border-gris-calido-100">
        <span className="border-b border-gris-calido-100 bg-white" />
        {DIAS_SEMANA.map((dia) => (
          <span
            key={dia.corto}
            className={`versalitas border-b border-l border-gris-calido-100 py-1.5 text-center text-[8px] ${
              dia.corto === 'VIE' ? 'bg-cobre text-hueso' : 'text-gris-calido-600'
            }`}
          >
            {dia.corto}
          </span>
        ))}
        {HORAS_DEMO.map((hora, filaIndice) => (
          <div key={hora} className="contents">
            <span className="border-t border-gris-calido-100 px-1 py-2 text-right text-[8px] text-gris-calido-400">
              {hora}
            </span>
            {DIAS_SEMANA.map((dia, colIndice) => (
              <span key={dia.corto} className="relative border-t border-l border-gris-calido-100 py-2">
                {colIndice === 4 && filaIndice === 2 && (
                  <span className="absolute inset-x-0.5 inset-y-0.5 rounded-sm border-l-2 border-cobre bg-cobre/15" />
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function MockupDueno() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gris-calido-200 bg-white shadow-sm">
      <EncabezadoPanelMock titulo="Panel de barbería" secciones={NAV_DUENO} activaIndice={0} />

      <div className="bg-hueso p-4 md:p-5">
        <h4 className="font-display text-lg font-light tracking-tight text-negro-barbero">Reservas</h4>

        <div className="mt-3 flex gap-2">
          <span className="versalitas rounded-full bg-cobre px-3 py-1.5 text-[9px] text-hueso">
            Reservas del día
          </span>
          <span className="versalitas rounded-full bg-gris-calido-100 px-3 py-1.5 text-[9px] text-gris-calido-600">
            Canceladas
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="rounded-lg border border-gris-calido-200 bg-white p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-negro-barbero">Lunes, 24 de agosto</span>
              <span className="versalitas shrink-0 text-[9px] text-gris-calido-500">1 reserva</span>
            </div>

            <div className="mt-3 flex items-baseline justify-between border-b border-gris-calido-100 pb-3">
              <div>
                <span className="versalitas block text-[8px] text-gris-calido-500">Ingreso del día</span>
                <span className="numeros-tabulares text-sm font-medium text-negro-barbero">$10.000</span>
              </div>
              <div className="text-right">
                <span className="versalitas block text-[8px] text-gris-calido-500">Reservas esta semana</span>
                <span className="numeros-tabulares text-sm font-medium text-negro-barbero">1</span>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-1">
              <div className="flex items-baseline justify-between">
                <span className="numeros-tabulares text-xs font-medium text-negro-barbero">17:00</span>
                <span className="numeros-tabulares text-[10px] text-gris-calido-500">$10.000</span>
              </div>
              <span className="text-xs font-medium text-negro-barbero">Matías Rojas</span>
              <span className="versalitas text-[9px] text-gris-calido-500">Corte + Degradado · Miguel Diaz</span>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="versalitas text-[9px] text-cobre-texto underline decoration-cobre-texto/40">
                  Editar
                </span>
                <span className="versalitas text-[9px] text-red-700 underline decoration-red-700/40">
                  Cancelar
                </span>
              </div>
            </div>
          </div>

          <MiniCalendario />
        </div>
      </div>
    </div>
  )
}

function MockupBarbero() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gris-calido-200 bg-white shadow-sm">
      <EncabezadoPanelMock titulo="Panel de barbero" secciones={NAV_BARBERO} activaIndice={1} />

      <div className="bg-hueso p-4 md:p-5">
        <h4 className="font-display text-lg font-light tracking-tight text-negro-barbero">Mis horarios</h4>

        <div className="mt-4 rounded-lg border border-gris-calido-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="versalitas text-[9px] text-gris-calido-500">Día</span>
              <p className="text-sm font-medium text-negro-barbero">Lunes</p>
            </div>
            <div className="flex items-center gap-2">
              <Interruptor activo onCambiar={() => {}} etiqueta="Bloque activo" />
              <span className="versalitas text-[9px] text-gris-calido-500">Activo</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 border-t border-gris-calido-100 pt-3">
            <div>
              <span className="versalitas block text-[9px] text-gris-calido-500">Desde</span>
              <span className="numeros-tabulares text-sm text-negro-barbero">10:00</span>
            </div>
            <div>
              <span className="versalitas block text-[9px] text-gris-calido-500">Hasta</span>
              <span className="numeros-tabulares text-sm text-negro-barbero">19:00</span>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-gris-calido-200 bg-white p-4">
          <span className="versalitas text-[9px] text-gris-calido-500">Excepción para un día puntual</span>
          <div className="mt-2 flex items-center justify-between rounded-md border border-gris-calido-100 px-3 py-2">
            <span className="text-xs text-negro-barbero">Mañana — desde las 12:30 hasta las 19:00</span>
            <span className="versalitas text-[9px] text-gris-calido-500">Quitar</span>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-gris-calido-200 bg-white p-4">
          <span className="versalitas text-[9px] text-gris-calido-500">Intervalo entre reservas</span>
          <p className="mt-1 text-sm font-medium text-negro-barbero">Cada 45 min</p>
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
      <SectionRule indice="— 03" texto="Tu equipo, su panel" tono="oscuro" />

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
