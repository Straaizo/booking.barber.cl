import { HoverLink } from '../common/HoverLink'
import { IconoInstagram } from '../common/IconoInstagram'
import { IconoWhatsApp } from '../common/IconoWhatsApp'
import { linkWhatsApp } from '../../utils/formatos'

// Mismo número que ya usa el footer ("O escríbenos por WhatsApp") — una sola
// fuente de verdad en el `.env`, no un número duplicado a mano acá.
const NUMERO_WHATSAPP_CONTACTO = import.meta.env.VITE_WHATSAPP_CONTACTO

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-6 md:px-10 md:py-8">
      <HoverLink
        href="/"
        className="font-display text-xl font-semibold italic tracking-tight text-negro-barbero"
      >
        booking<span className="text-cobre-texto">.</span>barber.cl
      </HoverLink>
      <div className="flex items-center gap-6">
        <a
          href="https://www.instagram.com/booking.barber.cl"
          target="_blank"
          rel="noreferrer"
          aria-label="Síguenos en Instagram"
          className="text-gris-calido-700 transition-colors hover:text-cobre-texto"
        >
          <IconoInstagram className="h-7 w-7" />
        </a>
        {NUMERO_WHATSAPP_CONTACTO && (
          <a
            href={linkWhatsApp(NUMERO_WHATSAPP_CONTACTO, 'Hola, quiero saber más de booking.barber.cl')}
            target="_blank"
            rel="noreferrer"
            aria-label="Escríbenos por WhatsApp"
            className="text-gris-calido-700 transition-colors hover:text-cobre-texto"
          >
            <IconoWhatsApp className="h-7 w-7" />
          </a>
        )}
      </div>
    </header>
  )
}
