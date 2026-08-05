const MINUTOS_DIA = 24 * 60

function horaAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

function minutosAHora(minutos) {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// dia_semana sigue Date.getDay(): 0 = domingo ... 6 = sábado
export function proximosDiasConHorario(horarios, cantidadDias = 14) {
  const diasConHorario = new Set(horarios.map((h) => h.dia_semana))
  const dias = []
  const hoy = new Date()

  for (let i = 0; dias.length < cantidadDias && i < 60; i++) {
    const fecha = new Date(hoy)
    fecha.setDate(hoy.getDate() + i)
    if (diasConHorario.has(fecha.getDay())) {
      dias.push(fecha)
    }
  }
  return dias
}

export function calcularSlotsDisponibles({
  horarios,
  reservasOcupadas,
  duracionMinutos,
  fecha,
}) {
  const diaSemana = fecha.getDay()
  const horariosDelDia = horarios.filter((h) => h.dia_semana === diaSemana)
  if (horariosDelDia.length === 0) return []

  const ocupados = reservasOcupadas.map((r) => {
    const inicio = new Date(r.fecha_hora)
    const minutos = inicio.getHours() * 60 + inicio.getMinutes()
    return { inicio: minutos, fin: minutos + duracionMinutos }
  })

  const esHoy = fecha.toDateString() === new Date().toDateString()
  const minutoActual = esHoy ? new Date().getHours() * 60 + new Date().getMinutes() : 0

  const slots = []
  for (const horario of horariosDelDia) {
    const inicio = horaAMinutos(horario.hora_inicio)
    const fin = Math.min(horaAMinutos(horario.hora_fin), MINUTOS_DIA)

    for (let t = inicio; t + duracionMinutos <= fin; t += duracionMinutos) {
      if (t < minutoActual) continue

      const seSuperpone = ocupados.some(
        (o) => t < o.fin && t + duracionMinutos > o.inicio
      )
      if (!seSuperpone) slots.push(minutosAHora(t))
    }
  }
  return slots
}
