const trazo = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconoPapelera({ className }) {
  return (
    <svg {...trazo} className={className} aria-hidden="true">
      <polyline points="4 7 6 7 20 7" />
      <path d="M18 7l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7" />
      <path d="M9 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2H9V5z" />
      <line x1="10" y1="11" x2="10" y2="16" />
      <line x1="14" y1="11" x2="14" y2="16" />
    </svg>
  )
}
