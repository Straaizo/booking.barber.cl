const trazo = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconoLlave({ className }) {
  return (
    <svg {...trazo} className={className} aria-hidden="true">
      <circle cx="8" cy="15" r="4.5" />
      <line x1="11.2" y1="11.8" x2="20" y2="3" />
      <line x1="15.5" y1="7.5" x2="18.5" y2="10.5" />
      <line x1="12.5" y1="10.5" x2="15.5" y2="13.5" />
    </svg>
  )
}
