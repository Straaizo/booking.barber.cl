const trazo = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconoTijeras({ className }) {
  return (
    <svg {...trazo} className={className} aria-hidden="true">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <line x1="8.1" y1="7.6" x2="20" y2="18" />
      <line x1="8.1" y1="16.4" x2="20" y2="6" />
    </svg>
  )
}
