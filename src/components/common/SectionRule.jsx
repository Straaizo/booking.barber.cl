import { ScrollReveal } from '../animations/ScrollReveal'

// Firma gráfica recurrente: regla delgada a sangrado completo con una etiqueta
// superpuesta (índice + texto en versalitas). Marca cada quiebre de sección y
// se repite igual en la tabla de precios y en el footer.
export function SectionRule({ indice, texto, tono = 'claro' }) {
  const colorTexto = tono === 'claro' ? 'text-hueso bg-negro-barbero' : 'text-negro-barbero bg-hueso'

  return (
    <ScrollReveal className="relative h-px w-full bg-cobre/40">
      <span
        className={`versalitas absolute -top-2.5 left-6 px-3 text-xs tracking-wide ${colorTexto} md:left-10`}
      >
        {indice && <span className="mr-2 text-cobre">{indice}</span>}
        {texto}
      </span>
    </ScrollReveal>
  )
}
