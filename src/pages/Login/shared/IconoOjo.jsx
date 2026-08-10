const trazo = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconoOjo({ abierto, className }) {
  if (abierto) {
    return (
      <svg {...trazo} className={className} aria-hidden="true">
        <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="2.8" />
      </svg>
    )
  }
  return (
    <svg {...trazo} className={className} aria-hidden="true">
      <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
      <line x1="3.5" y1="20.5" x2="20.5" y2="3.5" />
    </svg>
  )
}
