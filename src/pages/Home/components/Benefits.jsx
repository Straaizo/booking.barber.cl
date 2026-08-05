import { ScrollReveal } from '../../../components/animations/ScrollReveal'
import { StaggerReveal } from '../../../components/animations/StaggerReveal'

const BENEFICIOS = [
  {
    numero: '01',
    titulo: 'Sin apps para tus clientes',
    texto: 'Reservan desde el navegador, en menos de un minuto, sin crear cuenta.',
  },
  {
    numero: '02',
    titulo: 'Notificación automática',
    texto: 'Cada reserva nueva te llega directo por WhatsApp o correo.',
  },
  {
    numero: '03',
    titulo: 'Varios barberos, un panel',
    texto: 'Cada barbero con su horario propio, todo administrado desde un solo lugar.',
  },
  {
    numero: '04',
    titulo: 'Precios y ofertas al día',
    texto: 'Actualiza precios y ofertas cuando quieras, se reflejan al instante.',
  },
]

export function Benefits() {
  return (
    <section className="bg-negro-barbero px-6 py-24 text-hueso md:px-10 md:py-36">
      <ScrollReveal>
        <p className="max-w-2xl font-display text-3xl font-light leading-snug tracking-tight md:text-5xl">
          Todo lo que tu barbería necesita, <em className="not-italic text-cobre">nada</em> de lo
          que no.
        </p>
      </ScrollReveal>

      <StaggerReveal className="mt-16 flex flex-col gap-12 md:mt-24 md:gap-16">
        {BENEFICIOS.map((beneficio, indice) => (
          <div
            key={beneficio.numero}
            className={`flex flex-col gap-2 md:flex-row md:items-start md:gap-10 ${
              indice % 2 === 1 ? 'md:ml-32' : ''
            }`}
          >
            <span className="numeros-tabulares text-sm text-cobre">{beneficio.numero}</span>
            <div className="max-w-sm">
              <h3 className="font-display text-2xl font-light tracking-tight md:text-3xl">
                {beneficio.titulo}
              </h3>
              <p className="mt-2 text-sm text-gris-calido-200">{beneficio.texto}</p>
            </div>
          </div>
        ))}
      </StaggerReveal>
    </section>
  )
}
