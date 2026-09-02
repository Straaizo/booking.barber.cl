import { Button } from '../common/Button'
import { HoverLink } from '../common/HoverLink'
import { SectionRule } from '../common/SectionRule'
import { TextReveal } from '../animations/TextReveal'
import { ScrollReveal } from '../animations/ScrollReveal'
import { linkWhatsApp } from '../../utils/formatos'

const NUMERO_WHATSAPP_CONTACTO = import.meta.env.VITE_WHATSAPP_CONTACTO

export function Footer({ showModelCredit = false, variante = 'marketing' }) {
  const esMinimal = variante === 'minimal'

  return (
    <footer className={`bg-negro-barbero text-hueso ${esMinimal ? 'pb-8 pt-14' : 'pb-8 pt-20 md:pt-28'}`}>
      {!esMinimal && (
        <div className="px-6 md:px-10">
          <ScrollReveal>
            <HoverLink
              href="/"
              className="font-display text-2xl font-semibold italic tracking-tight text-hueso"
            >
              booking<span className="text-cobre-claro">.</span>barber.cl
            </HoverLink>
          </ScrollReveal>
          <TextReveal
            texto="¿Qué esperas para llevar tu barbería al siguiente nivel?"
            as="h2"
            className="mt-6 max-w-3xl font-display text-4xl font-light leading-[1.05] tracking-tight md:text-6xl"
          />
          {NUMERO_WHATSAPP_CONTACTO && (
            <ScrollReveal delay={0.15} className="mt-8">
              <Button
                href={linkWhatsApp(
                  NUMERO_WHATSAPP_CONTACTO,
                  'Hola, quiero información sobre booking.barber.cl para mi barbería'
                )}
                target="_blank"
                rel="noreferrer"
              >
                Contáctanos
              </Button>
            </ScrollReveal>
          )}
        </div>
      )}

      <div className={esMinimal ? '' : 'mt-20 md:mt-28'}>
        <SectionRule indice="—" texto="Emia Studios" tono="claro" />
      </div>

      <div className="mt-8 flex flex-col gap-4 px-6 text-xs text-gris-calido-400 md:flex-row md:items-center md:justify-between md:px-10">
        {esMinimal ? (
          <HoverLink href="/" className="versalitas">
            booking.barber.cl
          </HoverLink>
        ) : (
          <div className="flex gap-6">
            <HoverLink href="#como-funciona" className="versalitas">
              Cómo funciona
            </HoverLink>
            <HoverLink href="#planes" className="versalitas">
              Planes
            </HoverLink>
          </div>
        )}

        <p className="versalitas">
          Un proyecto de <span className="text-gris-calido-200">Emia Studios</span>
          {showModelCredit && (
            <>
              {' '}
              · Modelo 3D "Barbers Pole" por{' '}
              <a
                href="https://sketchfab.com/HPrendering"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-gris-calido-400 hover:text-gris-calido-200"
              >
                Vinny Passmore
              </a>{' '}
              (
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-gris-calido-400 hover:text-gris-calido-200"
              >
                CC BY 4.0
              </a>
              )
            </>
          )}
        </p>
      </div>
    </footer>
  )
}
