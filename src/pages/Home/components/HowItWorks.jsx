import { StaggerReveal } from '../../../components/animations/StaggerReveal'
import { ScrollReveal } from '../../../components/animations/ScrollReveal'

const PASOS = [
  {
    numero: '01',
    titulo: 'Creas *tu página*',
    texto: 'Tu propio enlace — booking.barber.cl/tu-barbería — con servicios, precios y horarios.',
  },
  {
    numero: '02',
    titulo: 'Tus clientes *reservan solos*',
    texto: 'Eligen servicio, barbero y hora disponible. Sin apps ni cuentas — solo nombre y celular.',
  },
  {
    numero: '03',
    titulo: 'Te avisamos *al instante*',
    texto: 'Cada reserva te llega por WhatsApp o correo, y queda registrada en tu panel.',
  },
]

function titulo(texto) {
  const partes = texto.split('*')
  return partes.map((parte, indice) =>
    indice % 2 === 1 ? (
      <em key={indice} className="font-display not-italic text-cobre">
        {parte}
      </em>
    ) : (
      <span key={indice}>{parte}</span>
    )
  )
}

export function HowItWorks() {
  return (
    <section id="como-funciona" className="px-6 py-20 md:px-10 md:py-28">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12 mb-10 md:col-span-2 md:mb-0">
          <ScrollReveal>
            <span className="versalitas text-xs text-gris-calido-500">— 01 / Cómo funciona</span>
          </ScrollReveal>
        </div>

        <StaggerReveal className="col-span-12 md:col-span-9 md:col-start-4">
          {PASOS.map((paso) => (
            <div
              key={paso.numero}
              className="flex flex-col gap-2 border-t border-cobre/25 py-8 first:border-t-0 first:pt-0 md:grid md:grid-cols-12 md:items-baseline md:gap-4 md:py-10"
            >
              <span className="numeros-tabulares text-sm text-cobre md:col-span-1">
                {paso.numero}
              </span>
              <h3 className="font-display text-2xl font-light leading-tight tracking-tight md:col-span-6 md:text-4xl">
                {titulo(paso.titulo)}
              </h3>
              <p className="max-w-xs text-sm text-gris-calido-700 md:col-span-4 md:col-start-9">
                {paso.texto}
              </p>
            </div>
          ))}
        </StaggerReveal>
      </div>
    </section>
  )
}
