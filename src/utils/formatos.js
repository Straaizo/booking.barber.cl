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

export function formatoFechaCorta(fecha) {
  return fecha.toLocaleDateString('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
