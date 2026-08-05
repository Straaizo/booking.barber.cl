// Colores clásicos rojo/blanco/azul a propósito: es el mismo objeto que el modelo 3D
// de escritorio (barbers_pole.glb), para que la marca se vea consistente entre breakpoints.
export function StaticBarberPoleIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 120 230" className={className} fill="none" aria-hidden="true">
      <ellipse cx="60" cy="216" rx="34" ry="8" fill="#000" opacity="0.2" />

      <defs>
        <clipPath id="tuboPoste">
          <rect x="34" y="44" width="52" height="150" rx="26" />
        </clipPath>
        <pattern
          id="rayasPoste"
          patternUnits="userSpaceOnUse"
          width="26"
          height="26"
          patternTransform="rotate(35)"
        >
          <rect width="26" height="26" fill="#e9e4d9" />
          <rect width="9" height="26" fill="#b03a2e" />
          <rect x="17" width="9" height="26" fill="#2a4d7a" />
        </pattern>
        <radialGradient id="brilloBombilla" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f3eee3" />
        </radialGradient>
      </defs>

      <rect x="34" y="44" width="52" height="150" rx="26" fill="#e9e4d9" />
      <rect
        x="34"
        y="44"
        width="52"
        height="150"
        rx="26"
        fill="url(#rayasPoste)"
        clipPath="url(#tuboPoste)"
      />
      <rect
        x="34"
        y="44"
        width="52"
        height="150"
        rx="26"
        fill="none"
        stroke="#1c1b19"
        strokeOpacity="0.2"
      />

      <rect x="28" y="30" width="64" height="20" rx="9" fill="#1c1b19" />
      <rect x="28" y="192" width="64" height="20" rx="9" fill="#1c1b19" />

      <circle cx="60" cy="18" r="16" fill="url(#brilloBombilla)" opacity="0.9" />
      <circle cx="60" cy="18" r="16" fill="none" stroke="#1c1b19" strokeOpacity="0.15" />
    </svg>
  )
}
