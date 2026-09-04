// El logo de Google es multicolor de por sí (no sigue `currentColor` como el
// resto de los íconos del sitio) — son 4 colores fijos por especificación de marca.
export function IconoGoogle({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.41 3.62v3.01h3.9c2.28-2.1 3.6-5.2 3.6-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.9-3.01c-1.08.73-2.46 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.92H1.28v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.31 14.31A7.2 7.2 0 0 1 4.93 12c0-.8.14-1.58.38-2.31V6.6H1.28A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l4.03-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.6 4.6 1.79l3.45-3.45C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.28 6.6l4.03 3.09C6.25 6.87 8.89 4.77 12 4.77z"
      />
    </svg>
  )
}
