import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { ScrollReveal } from '../../../components/animations/ScrollReveal'
import { StaggerReveal } from '../../../components/animations/StaggerReveal'
import { EASE_ENTRADA } from '../../../components/animations/easing'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { FUENTES_DISPONIBLES, asegurarFuenteCargada } from '../../../utils/fuentes'
import { oscurecerHex } from '../../../utils/color'

const BENEFICIOS = [
  {
    numero: '01',
    titulo: 'Sin apps para tus clientes',
    texto: 'Reservan desde el navegador, en menos de un minuto, sin crear cuenta.',
  },
  {
    numero: '02',
    titulo: 'Todas tus reservas, en un solo lugar',
    texto: 'Entra a tu panel y ve cada reserva nueva, sin perseguir mensajes sueltos.',
  },
  {
    numero: '03',
    titulo: 'Varios barberos, sin choques de horario',
    texto: 'Cada uno con su agenda propia — nunca dos personas a la misma hora por error.',
  },
  {
    numero: '04',
    titulo: 'Cambias precios tú, al momento',
    texto: 'Subes una oferta a las 9 de la mañana y ya está publicada a las 9:01.',
  },
]

const INTERVALO_MS = 2800

// Un color y una tipografía por paso — la variedad completa se ve en pocos
// pasos en vez de un control por separado para cada cosa.
const LOOKS = [
  { colorNombre: 'Cobre', color: '#a85c32', fuente: FUENTES_DISPONIBLES[0] },
  { colorNombre: 'Azul petróleo', color: '#2d4356', fuente: FUENTES_DISPONIBLES[1] },
  { colorNombre: 'Verde botella', color: '#2f4538', fuente: FUENTES_DISPONIBLES[2] },
  { colorNombre: 'Vino', color: '#6b2737', fuente: FUENTES_DISPONIBLES[3] },
]

// Réplica del encabezado real de una página de barbería (VistaBarberia.jsx):
// mismas clases (`cobre`/`font-display` de Tailwind leyendo `--color-cobre`/
// `--font-display` del contenedor), así este mockup cambia exactamente como
// cambiaría la página real al elegir un color o una tipografía — no una
// aproximación aparte.
function MockupPagina({ look }) {
  const estiloMarca = {
    '--color-cobre': look.color,
    '--color-cobre-oscuro': oscurecerHex(look.color),
    '--font-display': look.fuente.pila,
  }

  return (
    <div
      style={estiloMarca}
      className="overflow-hidden rounded-2xl border border-gris-calido-700 bg-negro-barbero px-6 py-10 md:px-10 md:py-14"
    >
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-cobre/40 font-display text-xl text-cobre-claro">
          B
        </span>
        <div>
          <h3 className="font-display text-2xl font-light tracking-tight text-hueso md:text-3xl">
            Barbería Don Manuel
          </h3>
          <p className="versalitas mt-1 text-xs text-cobre-claro">Corte de barrio, oficio de siempre</p>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gris-calido-300">
        <span>Av. Irarrázaval 2140, Ñuñoa</span>
        <span className="text-cobre-claro underline underline-offset-2">Escribir por WhatsApp</span>
      </div>

      {/* El eslogan y el link de WhatsApp usan `cobre-claro` — un tono fijo,
          no atado al color elegido, porque un color arbitrario podría no
          tener buen contraste como texto chico sobre este fondo oscuro (esto
          es real, no una limitación inventada acá). El botón sí puede
          mostrar el color en vivo sin ese riesgo. */}
      <button
        type="button"
        tabIndex={-1}
        className="mt-6 rounded-lg bg-cobre-oscuro px-5 py-2.5 text-sm font-semibold text-hueso"
      >
        Reservar hora →
      </button>
    </div>
  )
}

// Se ve solo, sin que nadie haga clic — mismo mecanismo que la demo del
// celular (LiveDemo.jsx): un intervalo que avanza mientras la sección está a
// la vista, en pausa fuera de vista o con movimiento reducido.
function DemoPersonalizacion() {
  const [paso, setPaso] = useState(0)
  const contenedorRef = useRef(null)
  const enVista = useInView(contenedorRef, { amount: 0.4 })
  const prefiereReducido = usePrefersReducedMotion()
  const look = LOOKS[paso]

  useEffect(() => {
    asegurarFuenteCargada(look.fuente.clave)
  }, [look])

  useEffect(() => {
    if (!enVista || prefiereReducido) return
    const id = setInterval(() => setPaso((actual) => (actual + 1) % LOOKS.length), INTERVALO_MS)
    return () => clearInterval(id)
  }, [enVista, prefiereReducido])

  return (
    <div ref={contenedorRef} className="mt-8">
      <MockupPagina look={look} />
      <AnimatePresence mode="wait">
        <motion.p
          key={paso}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE_ENTRADA }}
          className="versalitas mt-4 text-xs text-gris-calido-400"
        >
          {look.colorNombre} · {look.fuente.etiqueta}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

export function Benefits() {
  return (
    <section className="bg-negro-barbero px-6 py-24 text-hueso md:px-10 md:py-36">
      <ScrollReveal>
        <p className="max-w-2xl font-display text-3xl font-light leading-snug tracking-tight md:text-5xl">
          Todo lo que tu barbería necesita, <em className="not-italic text-cobre">nada</em> de lo
          que no.
        </p>
      </ScrollReveal>

      <div className="mt-16 grid gap-16 md:mt-24 lg:grid-cols-12 lg:gap-10">
        <StaggerReveal className="flex flex-col gap-12 lg:col-span-7 lg:gap-14">
          {BENEFICIOS.map((beneficio, indice) => (
            <div
              key={beneficio.numero}
              className={`flex flex-col gap-2 md:flex-row md:items-start md:gap-10 ${
                indice % 2 === 1 ? 'md:ml-16' : ''
              }`}
            >
              <span className="numeros-tabulares text-sm text-cobre-claro">{beneficio.numero}</span>
              <div className="max-w-sm">
                <h3 className="font-display text-2xl font-light tracking-tight md:text-3xl">
                  {beneficio.titulo}
                </h3>
                <p className="mt-2 text-sm text-gris-calido-200">{beneficio.texto}</p>
              </div>
            </div>
          ))}
        </StaggerReveal>

        <div className="lg:col-span-5">
          <ScrollReveal>
            <span className="numeros-tabulares text-sm text-cobre-claro">05</span>
            <h3 className="mt-2 font-display text-2xl font-light tracking-tight md:text-3xl">
              Tu página se ve como tú quieras
            </h3>
            <p className="mt-2 text-sm text-gris-calido-200">
              Color de marca y tipografía, distintos en cada barbería — nunca la misma plantilla.
            </p>
            <DemoPersonalizacion />
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
