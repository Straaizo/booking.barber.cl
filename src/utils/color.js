// Oscurece un color hex un porcentaje fijo — usado para derivar el tono
// "hover/oscuro" de la marca de una barbería a partir de su color_primario,
// igual que --color-cobre-oscuro es una versión oscurecida de --color-cobre.
export function oscurecerHex(hex, porcentaje = 0.22) {
  const limpio = hex.replace('#', '')
  if (limpio.length !== 6) return hex

  const canal = (inicio) => {
    const valor = parseInt(limpio.slice(inicio, inicio + 2), 16)
    return Math.max(0, Math.round(valor * (1 - porcentaje)))
      .toString(16)
      .padStart(2, '0')
  }

  return `#${canal(0)}${canal(2)}${canal(4)}`
}

// Luminancia relativa (fórmula WCAG) — para decidir si el texto sobre un
// color de fondo elegido libremente (ej. el color del header) debe ser claro
// u oscuro, en vez de asumir siempre un fondo oscuro como el resto del sitio.
export function luminanciaRelativa(hex) {
  const limpio = hex.replace('#', '')
  if (limpio.length !== 6) return 0
  const canal = (inicio) => {
    const c = parseInt(limpio.slice(inicio, inicio + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * canal(0) + 0.7152 * canal(2) + 0.0722 * canal(4)
}

export function esColorClaro(hex) {
  return luminanciaRelativa(hex) > 0.4
}
