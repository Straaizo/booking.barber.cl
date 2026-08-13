import { useEffect, useState } from 'react'
import { SectionRule } from '../../../components/common/SectionRule'
import { ScrollReveal } from '../../../components/animations/ScrollReveal'
import { FUENTES_DISPONIBLES, asegurarFuenteCargada } from '../../../utils/fuentes'
import { oscurecerHex } from '../../../utils/color'

const COLORES_EJEMPLO = [
  { nombre: 'Cobre', valor: '#a85c32' },
  { nombre: 'Azul petróleo', valor: '#2d4356' },
  { nombre: 'Verde botella', valor: '#2f4538' },
  { nombre: 'Vino', valor: '#6b2737' },
]

// Réplica del encabezado real de una página de barbería (VistaBarberia.jsx:
// logo circular, nombre en la tipografía de título, eslogan, dirección +
// WhatsApp) — mismas clases, mismo mecanismo (`--color-cobre`/`--font-display`
// como variables CSS en el contenedor, consumidas por las clases `cobre`/
// `font-display` de Tailwind), así el mockup cambia exactamente como cambia
// la página real al elegir color o tipografía, no una aproximación aparte.
function MockupPagina({ color, fuente }) {
  const estiloMarca = {
    '--color-cobre': color,
    '--color-cobre-oscuro': oscurecerHex(color),
    '--font-display': fuente.pila,
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
          <p className="versalitas mt-1 text-xs text-cobre-claro">
            Corte de barrio, oficio de siempre
          </p>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gris-calido-300">
        <span>Av. Irarrázaval 2140, Ñuñoa</span>
        <span className="text-cobre-claro underline underline-offset-2">Escribir por WhatsApp</span>
      </div>

      {/* El eslogan y el link de WhatsApp usan `cobre-claro` — un tono FIJO,
          no atado al color elegido, porque un color arbitrario del dueño
          podría no tener buen contraste como texto chico sobre este fondo
          oscuro (esto es real: hoy la app tampoco lo ata, ver bitácora). El
          botón sí puede mostrar el color en vivo sin ese riesgo — el texto es
          hueso sobre un relleno, no el color de marca actuando como texto. */}
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

export function CustomizationDemo() {
  const [color, setColor] = useState(COLORES_EJEMPLO[0].valor)
  const [fuente, setFuente] = useState(FUENTES_DISPONIBLES[0])

  useEffect(() => {
    asegurarFuenteCargada(fuente.clave)
  }, [fuente])

  return (
    <section className="bg-negro-barbero px-6 py-20 text-hueso md:px-10 md:py-28">
      <SectionRule indice="— 04d" texto="Tu página, a tu manera" tono="claro" />

      <ScrollReveal className="mt-14 max-w-2xl">
        <h2 className="font-display text-3xl font-light leading-tight tracking-tight md:text-5xl">
          Cada barbería <em className="not-italic text-cobre-claro">se ve distinta</em>, no una
          plantilla repetida.
        </h2>
        <p className="mt-4 max-w-lg text-gris-calido-200">
          Elige tu color de marca y la tipografía de tus títulos — se aplica al instante a tu
          página real, no a una captura de pantalla.
        </p>
      </ScrollReveal>

      <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-7">
          <MockupPagina color={color} fuente={fuente} />
        </div>

        <div className="flex flex-col gap-8 lg:col-span-5">
          <div>
            <span className="versalitas text-xs text-gris-calido-400">Color de marca</span>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {COLORES_EJEMPLO.map((opcion) => (
                <button
                  key={opcion.valor}
                  type="button"
                  onClick={() => setColor(opcion.valor)}
                  aria-label={opcion.nombre}
                  aria-pressed={color === opcion.valor}
                  className={`h-9 w-9 rounded-full transition-transform ${
                    color === opcion.valor ? 'ring-2 ring-hueso ring-offset-2 ring-offset-negro-barbero' : ''
                  }`}
                  style={{ backgroundColor: opcion.valor }}
                />
              ))}
              <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-dashed border-gris-calido-400 text-[10px] text-gris-calido-400">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="sr-only"
                  aria-label="Elegir otro color"
                />
                +
              </label>
            </div>
          </div>

          <div>
            <span className="versalitas text-xs text-gris-calido-400">Tipografía de títulos</span>
            <div className="mt-3 flex flex-col gap-2">
              {FUENTES_DISPONIBLES.map((opcion) => (
                <button
                  key={opcion.clave}
                  type="button"
                  onClick={() => setFuente(opcion)}
                  aria-pressed={fuente.clave === opcion.clave}
                  style={{ fontFamily: opcion.pila }}
                  className={`rounded-md border px-4 py-2 text-left text-lg transition-colors ${
                    fuente.clave === opcion.clave
                      ? 'border-cobre-claro bg-cobre/10 text-hueso'
                      : 'border-gris-calido-700 text-gris-calido-300 hover:border-gris-calido-400'
                  }`}
                >
                  {opcion.etiqueta}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-gris-calido-400">
            También eliges tu logo, tus fotos, el color del header, y si tu WhatsApp aparece como
            enlace o como burbuja flotante — todo desde el mismo panel.
          </p>
        </div>
      </div>
    </section>
  )
}
