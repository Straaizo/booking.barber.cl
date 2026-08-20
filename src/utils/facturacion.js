// El cobro es mensual y el "día de pago" de una barbería es el día del mes
// en que se activó (o se reactivó, si estuvo suspendida) — cada mes vence
// ese mismo día. Si el mes no tiene ese día (activó un 31 y el mes que
// corresponde tiene 30 o menos), se corre al último día de ese mes, como
// hace cualquier cobro recurrente real.
function ultimoDiaDelMes(anio, mesIndice) {
  return new Date(anio, mesIndice + 1, 0).getDate()
}

function fechaEnMes(anio, mesIndice, dia) {
  return new Date(anio, mesIndice, Math.min(dia, ultimoDiaDelMes(anio, mesIndice)))
}

// Próxima fecha (>= hoy) en que corresponde el cobro, o `null` si la
// barbería nunca se activó.
export function proximoPago(fechaActivacionISO, ahora = new Date()) {
  if (!fechaActivacionISO) return null
  const dia = new Date(fechaActivacionISO).getDate()
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())

  let candidato = fechaEnMes(hoy.getFullYear(), hoy.getMonth(), dia)
  if (candidato < hoy) candidato = fechaEnMes(hoy.getFullYear(), hoy.getMonth() + 1, dia)
  return candidato
}

// Días hasta el próximo cobro (0 = hoy, negativo nunca debería darse). Sirve
// para ordenar y para decidir a quién avisarle primero.
export function diasHastaProximoPago(fechaActivacionISO, ahora = new Date()) {
  const proximo = proximoPago(fechaActivacionISO, ahora)
  if (!proximo) return null
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  return Math.round((proximo - hoy) / (1000 * 60 * 60 * 24))
}
