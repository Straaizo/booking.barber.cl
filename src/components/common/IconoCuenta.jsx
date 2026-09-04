const trazo = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const RUTA_ENGRANAJE =
  'M19.4 13.5a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V19.4a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2.6a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.2 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H8.6a1.65 1.65 0 0 0 1-1.51V2.6a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V8.6a1.65 1.65 0 0 0 1.51 1H21.4a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'

// Avatar (cabeza + hombros) con un engranaje superpuesto abajo a la derecha
// — el ícono típico de "cuenta/configuración", no un engranaje solo.
export function IconoCuenta({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="13" cy="11" r="6" {...trazo} />
      <path d="M4 27v-2a9 9 0 0 1 9-9h1.5" {...trazo} />
      <g transform="translate(15,15) scale(0.62)">
        <circle cx="12" cy="12" r="3" {...trazo} />
        <path d={RUTA_ENGRANAJE} {...trazo} />
      </g>
    </svg>
  )
}
