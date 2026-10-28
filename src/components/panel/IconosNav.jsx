// Íconos de la barra inferior del panel en el celular — mismo trazo que
// IconoCuenta (línea 1.6, puntas redondeadas) para que se vean de una familia.
const trazo = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ className, children }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {children}
    </svg>
  )
}

export function IconoCalendario({ className }) {
  return (
    <Svg className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" {...trazo} />
      <path d="M3.5 10h17M8 3v4M16 3v4" {...trazo} />
      <circle cx="8.5" cy="14.5" r="1" fill="currentColor" />
    </Svg>
  )
}

export function IconoInicio({ className }) {
  return (
    <Svg className={className}>
      <path d="M3.5 11 12 4l8.5 7" {...trazo} />
      <path d="M5.5 9.5V20h4.5v-5.5h4V20h4.5V9.5" {...trazo} />
    </Svg>
  )
}

export function IconoGrafico({ className }) {
  return (
    <Svg className={className}>
      <path d="M4 20h16" {...trazo} />
      <rect x="5.5" y="11" width="3" height="6.5" rx="1" {...trazo} />
      <rect x="10.5" y="6.5" width="3" height="11" rx="1" {...trazo} />
      <rect x="15.5" y="13.5" width="3" height="4" rx="1" {...trazo} />
    </Svg>
  )
}

export function IconoEquipo({ className }) {
  return (
    <Svg className={className}>
      <circle cx="9" cy="8.5" r="3.5" {...trazo} />
      <path d="M2.5 20v-1a6.5 6.5 0 0 1 13 0v1" {...trazo} />
      <path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18.5 14.5a6.5 6.5 0 0 1 3 5.5v0" {...trazo} />
    </Svg>
  )
}

export function IconoServicios({ className }) {
  return (
    <Svg className={className}>
      <circle cx="6" cy="6.5" r="2.8" {...trazo} />
      <circle cx="6" cy="17.5" r="2.8" {...trazo} />
      <path d="M8.2 8.3 20 18M8.2 15.7 20 6" {...trazo} />
    </Svg>
  )
}

export function IconoReloj({ className }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8.5" {...trazo} />
      <path d="M12 7.5V12l3 2" {...trazo} />
    </Svg>
  )
}

export function IconoPincel({ className }) {
  return (
    <Svg className={className}>
      <path d="M14.5 4.5 19.5 9.5 11 18l-5-5z" {...trazo} />
      <path d="M6 13c-2 0-3 1.5-3 3.5S2.5 20 2.5 20s3 .5 5-1 2.5-3 1.5-4" {...trazo} />
    </Svg>
  )
}

export function IconoTienda({ className }) {
  return (
    <Svg className={className}>
      <path d="M4 9.5V20h16V9.5M3 9.5 5 4h14l2 5.5a2.6 2.6 0 0 1-4.5 1.6 2.6 2.6 0 0 1-4.5 0 2.6 2.6 0 0 1-4.5 0A2.6 2.6 0 0 1 3 9.5z" {...trazo} />
      <path d="M10 20v-5h4v5" {...trazo} />
    </Svg>
  )
}

export function IconoEtiqueta({ className }) {
  return (
    <Svg className={className}>
      <path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8a1.5 1.5 0 0 1 0 2.1l-6.9 6.9a1.5 1.5 0 0 1-2.1 0z" {...trazo} />
      <circle cx="8" cy="8" r="1.4" {...trazo} />
    </Svg>
  )
}

export function IconoMegafono({ className }) {
  return (
    <Svg className={className}>
      <path d="M4 10v4a1 1 0 0 0 1 1h2l8 4.5V4.5L7 9H5a1 1 0 0 0-1 1z" {...trazo} />
      <path d="M7 15l1.5 5M18.5 9a4 4 0 0 1 0 6" {...trazo} />
    </Svg>
  )
}

export function IconoCampana({ className }) {
  return (
    <Svg className={className}>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" {...trazo} />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" {...trazo} />
    </Svg>
  )
}

export function IconoCompartirIOS({ className }) {
  return (
    <Svg className={className}>
      <path d="M12 3.5v11M8 7l4-3.5L16 7" {...trazo} />
      <path d="M8.5 10.5H6.5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2" {...trazo} />
    </Svg>
  )
}

export function IconoSalir({ className }) {
  return (
    <Svg className={className}>
      <path d="M14 4.5H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h8M10 12h10M16.5 8.5 20 12l-3.5 3.5" {...trazo} />
    </Svg>
  )
}
