const formateadorCLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

export function formatoCLP(valor) {
  return formateadorCLP.format(valor)
}

// Una oferta es vigente si está activa y, cuando tiene fecha de vencimiento, aún no pasó.
export function ofertaVigente(servicio) {
  if (!servicio.oferta_activa || !servicio.precio_oferta) return false
  if (!servicio.oferta_vence) return true
  return new Date(servicio.oferta_vence) > new Date()
}

// Arma un enlace wa.me a partir de un teléfono chileno guardado en cualquier
// formato (con/sin +56, con espacios) — normaliza a solo dígitos con 56 al inicio.
export function linkWhatsApp(telefono, mensaje = '') {
  const soloDigitos = telefono.replace(/\D/g, '')
  const conCodigoPais = soloDigitos.startsWith('56') ? soloDigitos : `56${soloDigitos.replace(/^0/, '')}`
  const query = mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''
  return `https://wa.me/${conCodigoPais}${query}`
}

// Búsqueda de Google Maps por texto — no hace falta que la barbería pegue
// ningún link a mano: Google resuelve la dirección igual que si la
// buscaras vos mismo en el buscador de Maps.
export function linkGoogleMaps(direccion) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`
}

export function formatoFechaCorta(fecha) {
  return fecha.toLocaleDateString('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
