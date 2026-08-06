import { useOutletContext } from 'react-router-dom'
import { Footer } from '../../components/layout/Footer'
import { HoverLink } from '../../components/common/HoverLink'
import { SectionRule } from '../../components/common/SectionRule'
import { TextReveal } from '../../components/animations/TextReveal'
import { ScrollReveal } from '../../components/animations/ScrollReveal'
import { AsistenteReserva } from './components/AsistenteReserva'
import { oscurecerHex } from '../../utils/color'
import { linkWhatsApp } from '../../utils/formatos'

export function PaginaBarberia() {
  const { barberia } = useOutletContext()
  const personalizacion = barberia.personalizacion ?? {}
  const inicial = barberia.nombre.trim().charAt(0).toUpperCase()

  // El color de marca de la barbería reemplaza --color-cobre en toda la
  // página vía cascada de variables CSS (así lo consumen Button, HoverLink,
  // SectionRule, etc. sin tocar su código) — si no definió uno, se mantiene
  // el cobre por defecto del sistema.
  const estiloMarca = personalizacion.color_primario
    ? {
        '--color-cobre': personalizacion.color_primario,
        '--color-cobre-oscuro': oscurecerHex(personalizacion.color_primario),
      }
    : undefined

  return (
    <div className="min-h-screen bg-hueso" style={estiloMarca}>
      <header className="relative overflow-hidden bg-negro-barbero px-6 pb-12 pt-10 text-hueso md:px-10 md:pb-16 md:pt-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-cobre) 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto flex max-w-lg flex-col items-center text-center md:max-w-none md:flex-row md:items-center md:gap-6 md:text-left">
          {barberia.logo_url ? (
            <img
              src={barberia.logo_url}
              alt={barberia.nombre}
              className="h-20 w-20 shrink-0 rounded-full border border-cobre/40 object-cover"
            />
          ) : (
            <span className="font-display flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-cobre/40 text-3xl italic text-cobre">
              {inicial}
            </span>
          )}

          <div className="mt-5 md:mt-0">
            <TextReveal
              texto={barberia.nombre}
              as="h1"
              className="font-display text-3xl font-light leading-tight tracking-tight md:text-5xl"
            />
            {personalizacion.eslogan && (
              <ScrollReveal delay={0.1}>
                <p className="versalitas mt-2 text-sm text-cobre-claro">{personalizacion.eslogan}</p>
              </ScrollReveal>
            )}
          </div>
        </div>

        {(barberia.direccion || barberia.telefono_whatsapp) && (
          <ScrollReveal delay={0.15}>
            <div className="relative mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gris-calido-200 md:mx-0 md:max-w-none md:justify-start">
              {barberia.direccion && <span>{barberia.direccion}</span>}
              {barberia.telefono_whatsapp && (
                <HoverLink
                  href={linkWhatsApp(
                    barberia.telefono_whatsapp,
                    `Hola, tengo una consulta para ${barberia.nombre}`
                  )}
                  tono="cobre"
                >
                  Escribir por WhatsApp
                </HoverLink>
              )}
            </div>
          </ScrollReveal>
        )}
      </header>

      <SectionRule indice="—" texto="Reserva tu hora" tono="oscuro" />

      <main className="mx-auto max-w-lg px-6 py-10 md:py-14">
        {personalizacion.descripcion && (
          <ScrollReveal>
            <p className="mb-8 text-center text-sm leading-relaxed text-gris-calido-700 md:text-base">
              {personalizacion.descripcion}
            </p>
          </ScrollReveal>
        )}

        <AsistenteReserva barberia={barberia} />
      </main>

      <Footer variante="minimal" />
    </div>
  )
}
