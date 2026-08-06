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
