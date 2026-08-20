const trazo = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconoLapiz({ className }) {
  return (
    <svg {...trazo} className={className} aria-hidden="true">
      <path d="M15.7 4.2 19.8 8.3 8.4 19.7 3.5 20.5 4.3 15.6 15.7 4.2Z" />
      <line x1="13.8" y1="6.1" x2="17.9" y2="10.2" />
    </svg>
  )
}
