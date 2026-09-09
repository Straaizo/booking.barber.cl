const trazo = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconoAjustar({ className }) {
  return (
    <svg {...trazo} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21" />
    </svg>
  )
}
