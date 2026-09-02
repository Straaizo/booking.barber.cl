import { Button } from '../../../components/common/Button'
import { ScrollReveal } from '../../../components/animations/ScrollReveal'
import { StaggerReveal } from '../../../components/animations/StaggerReveal'
import { AnimatedNumber } from '../../../components/animations/AnimatedNumber'
import { formatoCLP, linkWhatsApp } from '../../../utils/formatos'

const NUMERO_WHATSAPP_CONTACTO = import.meta.env.VITE_WHATSAPP_CONTACTO

// No hay alta automatizada todavía: "Elegir" siempre lleva a hablar
// directo por WhatsApp con Enzo, para coordinar ahí mismo.
function linkElegirPlan(nombrePlan) {
  return linkWhatsApp(
    NUMERO_WHATSAPP_CONTACTO,
    `Hola, quiero conversar sobre el plan ${nombrePlan} de booking.barber.cl para mi barbería`
  )
}

const PLANES = [
  { clave: 'equipo', nombre: 'Equipo', precio: 6000, destacado: true },
  { clave: 'estudio', nombre: 'Estudio', precio: 7000, destacado: false },
]

// Sin la fila de "Notificación por correo y WhatsApp" a propósito: todavía
// no existe ningún aviso automático — ni por correo ni por WhatsApp — así
// que prometerlo acá sería falso. Vuelve cuando esté construido de verdad.
const FILAS = [
  { etiqueta: 'Barberos', equipo: 'Hasta 3', estudio: 'Hasta 10' },
  { etiqueta: 'Página propia', equipo: true, estudio: true },
  { etiqueta: 'Reservas ilimitadas', equipo: true, estudio: true },
  { etiqueta: 'Ofertas ilimitadas', equipo: true, estudio: true },
  { etiqueta: 'Galería de fotos', equipo: 'Hasta 6', estudio: 'Ilimitada' },
  { etiqueta: 'Imagen y texto, testimonios', equipo: false, estudio: true },
  { etiqueta: 'Soporte prioritario', equipo: false, estudio: true },
]

function Marca({ valor }) {
  if (typeof valor === 'string') {
    return <span className="text-sm text-negro-barbero">{valor}</span>
  }
  return valor ? (
    <span className="text-cobre-texto">✓</span>
  ) : (
    <span className="text-gris-calido-400">—</span>
  )
}

export function Pricing() {
  // Mismo fondo que "— 02 Así se ve, de verdad" (`bg-gris-calido-100`) — sin
  // esto, con Novedades todavía sin usar (no se renderiza sin contenido real
  // cargado), Planes queda pegado directo a "Tu equipo, su panel" con el
  // mismo fondo, sin ningún quiebre visual entre medio.
  return (
    <section id="planes" className="bg-gris-calido-100 px-6 py-20 md:px-10 md:py-28">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12 mb-10 md:col-span-2 md:mb-0">
          <ScrollReveal>
            <span className="versalitas text-xs text-gris-calido-500">— 05 / Planes</span>
          </ScrollReveal>
        </div>

        <div className="col-span-12 md:col-span-9 md:col-start-4">
          <ScrollReveal>
            <h2 className="font-display text-3xl font-light leading-tight tracking-tight md:text-5xl">
              Un pago mensual fijo. <em className="not-italic text-cobre">Sin letra chica.</em>
            </h2>
          </ScrollReveal>

          {/* Desktop / tablet: tabla comparativa de una sola pieza */}
          <StaggerReveal className="mt-14 hidden lg:block">
            {/* table-fixed es la corrección real: sin esto, table-layout:auto
                expande cada columna según su contenido más ancho (el botón
                "Elegir Estudio") y el navegador ensancha la tabla entera más
                allá de su contenedor — no es un problema de grid ni de
                overflow, es table-layout. */}
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr>
                  <th className="w-1/4 border-b border-cobre/25 pb-6" />
                  {PLANES.map((plan) => (
                    <th
                      key={plan.clave}
                      className={`border-b border-cobre/25 px-4 pb-6 align-bottom ${
                        plan.destacado ? 'bg-cobre/5' : ''
                      }`}
                    >
                      <span className="font-display block text-2xl font-light tracking-tight text-negro-barbero">
                        {plan.nombre}
                      </span>
                      <span className="numeros-tabulares mt-2 block text-3xl font-semibold text-negro-barbero">
                        <AnimatedNumber valor={plan.precio} formatear={formatoCLP} />
                        <span className="ml-1 text-sm font-normal text-gris-calido-500">/mes</span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FILAS.map((fila) => (
                  <tr key={fila.etiqueta}>
                    <td className="border-b border-gris-calido-200 py-4 pr-4 text-sm text-gris-calido-700">
                      {fila.etiqueta}
                    </td>
                    {PLANES.map((plan) => (
                      <td
                        key={plan.clave}
                        className={`border-b border-gris-calido-200 px-4 py-4 ${
                          plan.destacado ? 'bg-cobre/5' : ''
                        }`}
                      >
                        <Marca valor={fila[plan.clave]} />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="py-6" />
                  {PLANES.map((plan) => (
                    <td key={plan.clave} className={`px-4 py-6 ${plan.destacado ? 'bg-cobre/5' : ''}`}>
                      <Button
                        href={linkElegirPlan(plan.nombre)}
                        target="_blank"
                        rel="noreferrer"
                        className={`w-full ${
                          plan.destacado ? '' : 'bg-negro-barbero hover:bg-black'
                        }`}
                      >
                        Elegir {plan.nombre}
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </StaggerReveal>

          {/* Mobile y tablet (hasta 1024px): una composición distinta, no la
              tabla encogida — un plan a la vez, deslizable, con las mismas
              filas como lista. A 768px la tabla de 4 columnas queda demasiado
              angosta para el margen editorial asimétrico; el carrusel resuelve
              mejor ese rango que forzar la tabla. */}
          <div className="mt-10 -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 lg:hidden">
            {PLANES.map((plan) => (
              <div
                key={plan.clave}
                className={`flex w-[85vw] shrink-0 snap-center flex-col rounded-2xl border bg-white/60 p-6 sm:w-72 ${
                  plan.destacado ? 'border-cobre' : 'border-gris-calido-200'
                }`}
              >
                {plan.destacado && (
                  <span className="versalitas mb-3 inline-block text-xs text-cobre-texto">
                    — Más elegido
                  </span>
                )}
                <span className="font-display block text-2xl font-light tracking-tight text-negro-barbero">
                  {plan.nombre}
                </span>
                <span className="numeros-tabulares mt-1 block text-3xl font-semibold text-negro-barbero">
                  {formatoCLP(plan.precio)}
                  <span className="ml-1 text-sm font-normal text-gris-calido-500">/mes</span>
                </span>

                <ul className="mb-6 mt-6 flex flex-col gap-3 border-t border-gris-calido-200 pt-6">
                  {FILAS.map((fila) => (
                    <li
                      key={fila.etiqueta}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-gris-calido-700">{fila.etiqueta}</span>
                      <Marca valor={fila[plan.clave]} />
                    </li>
                  ))}
                </ul>

                <Button
                  href={linkElegirPlan(plan.nombre)}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-auto block w-full ${
                    plan.destacado ? '' : 'bg-negro-barbero hover:bg-black'
                  }`}
                >
                  Elegir {plan.nombre}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
