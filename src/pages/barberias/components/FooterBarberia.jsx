import { HoverLink } from '../../../components/common/HoverLink'
import { linkWhatsApp } from '../../../utils/formatos'
import { esColorClaro } from '../../../utils/color'

// Cierre propio de la barbería, no el de marketing de la plataforma — antes
// esto terminaba SIEMPRE en "Un proyecto de Emia Studios" con link a
// booking.barber.cl, sin importar cuánto se personalizara el resto de la
// página (ver Footer.jsx, variante="minimal", usado solo acá). El fondo
// repite el mismo color del header (o su mismo reemplazo por defecto) para
// que header y footer lean como un solo bloque de marca — la mención a la
// plataforma sigue ahí, pero chica y al final, como un "hecho con", no como
// protagonista.
export function FooterBarberia({ barberia, colorHeader }) {
  const claro = colorHeader ? esColorClaro(colorHeader) : false
  const claseTexto = claro ? 'text-negro-barbero' : 'text-hueso'
  const claseSutil = claro ? 'text-gris-calido-600' : 'text-gris-calido-400'

  return (
    <footer
      // El mismo borde color de marca que separa el header del resto de la
      // página (ver VistaBarberia.jsx) — sin él, en modo oscuro el fondo de
      // la página y este footer pueden quedar casi del mismo negro, sin
      // ninguna línea que marque dónde termina el contenido.
      className={`border-t-2 border-cobre/50 px-6 py-10 md:px-10 ${claseTexto} ${colorHeader ? '' : 'bg-negro-barbero'}`}
      style={colorHeader ? { backgroundColor: colorHeader } : undefined}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg font-medium">{barberia.nombre}</p>
          {barberia.direccion && <p className={`mt-1 text-sm ${claseSutil}`}>{barberia.direccion}</p>}
        </div>
        {barberia.telefono_whatsapp && (
          <HoverLink
            href={linkWhatsApp(barberia.telefono_whatsapp, `Hola, quiero reservar en ${barberia.nombre}`)}
            target="_blank"
            rel="noreferrer"
            tono="cobre"
            className={`versalitas text-xs ${claseTexto}`}
          >
            Escribir por WhatsApp
          </HoverLink>
        )}
      </div>
      <p className={`versalitas mt-8 text-[10px] ${claseSutil}`}>
        Hecho con{' '}
        <HoverLink href="/" tono="cobre" className={claseTexto}>
          booking.barber.cl
        </HoverLink>
      </p>
    </footer>
  )
}
