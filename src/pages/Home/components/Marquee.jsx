import { SectionRule } from '../../../components/common/SectionRule'
import { ScrollReveal } from '../../../components/animations/ScrollReveal'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { ITEMS_OFICIO } from '../../../config/oficio'

const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' }

const ILUSTRACIONES = {
  navaja: (
    <svg viewBox="0 0 48 48" {...trazo}>
      <path d="M10 30c8-2 12-6 12-6l14-12c2-1 4 0 3 2L28 28s-4 4-6 12" />
      <circle cx="22" cy="24" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  peine: (
    <svg viewBox="0 0 48 48" {...trazo}>
      <rect x="10" y="10" width="28" height="8" rx="2" />
      {[14, 19, 24, 29, 34].map((x) => (
        <line key={x} x1={x} y1="18" x2={x} y2="38" />
      ))}
    </svg>
  ),
  sillon: (
    <svg viewBox="0 0 48 48" {...trazo}>
      <path d="M14 20V12a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v8" />
      <rect x="12" y="20" width="24" height="12" rx="2" />
      <path d="M12 32v6M36 32v6M16 32v10M32 32v10" />
    </svg>
  ),
  tijera: (
    <svg viewBox="0 0 48 48" {...trazo}>
      <circle cx="14" cy="34" r="4" />
      <circle cx="14" cy="14" r="4" />
      <path d="M17 17l20 20M17 31l20-20" />
    </svg>
  ),
  brocha: (
    <svg viewBox="0 0 48 48" {...trazo}>
      <path d="M22 6c4 0 8 4 8 9s-3 7-3 7h-10s-3-2-3-7 4-9 8-9Z" />
      <rect x="20" y="22" width="8" height="10" />
      <path d="M18 32h12l2 10H16l2-10Z" />
    </svg>
  ),
  espejo: (
    <svg viewBox="0 0 48 48" {...trazo}>
      <ellipse cx="24" cy="20" rx="12" ry="15" />
      <line x1="24" y1="35" x2="24" y2="42" />
      <line x1="17" y1="42" x2="31" y2="42" />
    </svg>
  ),
}

function Tarjeta({ item }) {
  return (
    <div
      className="group flex w-40 shrink-0 flex-col items-center gap-3 rounded-2xl border border-gris-calido-200 bg-gris-calido-100 px-6 py-8 grayscale transition-all duration-300 hover:scale-105 hover:grayscale-0 md:w-48"
      title={item.etiqueta}
    >
      {item.imagenUrl ? (
        <img src={item.imagenUrl} alt={item.etiqueta} className="h-16 w-16 rounded-full object-cover" />
      ) : (
        <span className="h-14 w-14 text-cobre-texto">{ILUSTRACIONES[item.id]}</span>
      )}
      <span className="versalitas text-center text-xs text-gris-calido-500 group-hover:text-negro-barbero">
        {item.etiqueta}
      </span>
    </div>
  )
}

function Fila({ items, inversa = false }) {
  const doble = [...items, ...items]
  return (
    <div className="marquee-pista overflow-hidden">
      <div className={`marquee-fila flex w-max gap-5 ${inversa ? 'marquee-fila-inversa' : ''}`}>
        {doble.map((item, indice) => (
          <Tarjeta key={`${item.id}-${indice}`} item={item} />
        ))}
      </div>
    </div>
  )
}

export function Marquee() {
  const prefiereReducido = usePrefersReducedMotion()

  return (
    <section className="overflow-hidden py-20 md:py-28">
      <div className="px-6 md:px-10">
        <SectionRule indice="— 04" texto="El oficio" tono="oscuro" />
        <ScrollReveal className="mt-10">
          <p className="max-w-xl text-sm text-gris-calido-500 md:text-base">
            Todavía no tenemos fotos de barberías clientes para mostrar — cuando las
            tengamos, van aquí. Por ahora, el detalle del oficio.
          </p>
        </ScrollReveal>
      </div>

      <div className="mt-10">
        {prefiereReducido ? (
          <div className="grid grid-cols-2 gap-4 px-6 sm:grid-cols-3 md:grid-cols-6 md:px-10">
            {ITEMS_OFICIO.map((item) => (
              <Tarjeta key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <Fila items={ITEMS_OFICIO} />
            <Fila items={[...ITEMS_OFICIO].reverse()} inversa />
          </div>
        )}
      </div>
    </section>
  )
}
