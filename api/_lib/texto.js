// Un nombre de barbería lo edita el dueño desde su panel — nunca confiar en
// que viene limpio. Escapa antes de insertarlo en HTML generado a mano (acá
// no hay React de por medio para escapar solo).
export function escaparHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// WhatsApp trunca el título antes que Facebook — 60 caracteres visibles es
// el límite más chico de todos los clientes reales, así que es el que manda.
export function truncar(texto, maximo) {
  const limpio = String(texto ?? '').trim()
  if (limpio.length <= maximo) return limpio
  return limpio.slice(0, maximo - 1).trimEnd() + '…'
}

// Sin emojis en metadatos de texto (se renderizan distinto entre WhatsApp,
// Facebook y Twitter) y sin emojis en la imagen generada (la fuente Fraunces
// no tiene esos glifos — saldrían como cuadrados). Un solo lugar para las
// dos cosas.
export function quitarEmojis(texto) {
  return String(texto ?? '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}
