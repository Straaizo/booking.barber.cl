// Lista curada de tipografías de título que una barbería puede elegir — no
// cualquier Google Font: solo unas pocas ya evaluadas que calzan con la
// identidad editorial del sitio. "Fraunces" es la que ya usa todo el sitio
// por defecto (se carga siempre, ver index.css); las demás se cargan recién
// si alguien las elige, para no pagar ese peso en todas las páginas.
export const FUENTES_DISPONIBLES = [
  { clave: 'fraunces', etiqueta: 'Fraunces (la de siempre)', pila: '"Fraunces", ui-serif, Georgia, serif', google: null },
  {
    clave: 'playfair',
    etiqueta: 'Playfair Display',
    pila: '"Playfair Display", ui-serif, Georgia, serif',
    google: 'Playfair+Display:ital,wght@0,400..900;1,400..900',
  },
  {
    clave: 'baskerville',
    etiqueta: 'Libre Baskerville',
    pila: '"Libre Baskerville", ui-serif, Georgia, serif',
    google: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400',
  },
  {
    clave: 'bricolage',
    etiqueta: 'Bricolage Grotesque',
    pila: '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif',
    google: 'Bricolage+Grotesque:opsz,wght@12..96,200..800',
  },
]

const yaCargadas = new Set(['fraunces'])

// Inyecta el <link> de Google Fonts la primera vez que se elige una
// tipografía no-default — idempotente, no vuelve a agregarlo si ya está.
export function asegurarFuenteCargada(clave) {
  if (yaCargadas.has(clave)) return
  const fuente = FUENTES_DISPONIBLES.find((f) => f.clave === clave)
  if (!fuente?.google) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${fuente.google}&display=swap`
  document.head.appendChild(link)
  yaCargadas.add(clave)
}

export function pilaFuente(clave) {
  return FUENTES_DISPONIBLES.find((f) => f.clave === clave)?.pila ?? FUENTES_DISPONIBLES[0].pila
}
