// Geometría de la flecha clásica de cursor (Windows 10 Aero) — puntos tomados
// de "Windows 10 Aero arrow 32x32-32.svg" de Wikimedia Commons (dominio
// público, geometría demasiado simple para tener derechos de autor:
// commons.wikimedia.org/wiki/File:Windows_10_Aero_arrow_32x32-32.svg),
// recoloreada a la paleta del sitio en vez de blanco/negro, con sombra propia.
const PUNTOS_FLECHA = '18.64 55.17 11.5 38.49 .75 49.08 .75 1.81 34.88 35.94 18.57 36.14 25.83 51.91 18.64 55.17'

export function CursorFlecha({ color, className }) {
  return (
    <svg viewBox="0 0 36.67 56.16" className={className} aria-hidden="true">
      <polygon points={PUNTOS_FLECHA} transform="translate(1.3,1.8)" fill="#000000" opacity="0.22" />
      <polygon points={PUNTOS_FLECHA} fill={color} stroke="#1c1b19" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}
