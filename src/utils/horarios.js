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

export function fechaISO(fecha) {
  return fecha.toISOString().slice(0, 10)
}

const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
// Se muestra empezando el lunes (convención local), aunque `dia_semana` en
// la base sigue el `Date.getDay()` de siempre (0 = domingo).
const ORDEN_SEMANA_VISIBLE = [1, 2, 3, 4, 5, 6, 0]

// Resume el horario de TODOS los barberos activos en un solo "horario de
// atención" del local, para mostrar en la página pública: por día, toma la
// apertura más temprana y el cierre más tardío entre todos los barberos que
// atienden ese día (si alguien está, el local "está abierto" en ese rango),
// y agrupa días consecutivos con el mismo resultado en una sola línea
// ("Lunes a Viernes: 10:00 – 19:00") en vez de repetir el mismo horario 5
// veces. Los días sin ningún bloque activo simplemente no aparecen.
export function resumenHorarioSemanal(horarios) {
  const porDia = new Map()
  for (const h of horarios ?? []) {
    if (!h.activo) continue
    const actual = porDia.get(h.dia_semana)
    if (!actual) {
      porDia.set(h.dia_semana, { inicio: h.hora_inicio, fin: h.hora_fin })
    } else {
      if (h.hora_inicio < actual.inicio) actual.inicio = h.hora_inicio
      if (h.hora_fin > actual.fin) actual.fin = h.hora_fin
    }
  }

  const grupos = []
  for (const dia of ORDEN_SEMANA_VISIBLE) {
    const bloque = porDia.get(dia)
    const texto = bloque ? `${bloque.inicio.slice(0, 5)} – ${bloque.fin.slice(0, 5)}` : null
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.texto === texto) {
      ultimo.diaFin = dia
    } else {
      grupos.push({ diaInicio: dia, diaFin: dia, texto })
    }
  }

  return grupos
    .filter((g) => g.texto !== null)
    .map((g) => ({
      etiqueta:
        g.diaInicio === g.diaFin
          ? NOMBRES_DIA[g.diaInicio]
          : `${NOMBRES_DIA[g.diaInicio]} a ${NOMBRES_DIA[g.diaFin]}`,
      horario: g.texto,
    }))
}

// dia_semana sigue Date.getDay(): 0 = domingo ... 6 = sábado. Una excepción
// abierta (por ejemplo, el barbero entrando especialmente un día que
// normalmente tiene el horario semanal en cero) también cuenta como día
// disponible, aunque su día de la semana no tenga bloques recurrentes.
export function proximosDiasConHorario(horarios, excepciones = [], cantidadDias = 14) {
  const diasConHorario = new Set(horarios.map((h) => h.dia_semana))
  const fechasConExcepcionAbierta = new Set(
    excepciones.filter((e) => !e.cerrado).map((e) => e.fecha)
  )
  const dias = []
  const hoy = new Date()

  for (let i = 0; dias.length < cantidadDias && i < 60; i++) {
    const fecha = new Date(hoy)
    fecha.setDate(hoy.getDate() + i)
    if (diasConHorario.has(fecha.getDay()) || fechasConExcepcionAbierta.has(fechaISO(fecha))) {
      dias.push(fecha)
    }
  }
  return dias
}

// El paso entre horas ofrecidas (`intervaloMinutos`) es independiente de
// cuánto dura el servicio (`duracionMinutos`): un corte de 30 min puede
// ofrecerse cada 45 min si el barbero prefiere dejar más aire entre
// clientes, o cada 60 min si quiere agendar menos gente por día. La
// duración real del servicio sigue siendo la que se usa para chequear
// superposición con reservas ya tomadas — eso no puede acortarse.
// `excepcionDelDia` reemplaza por completo el horario semanal de ESA fecha
// puntual (no del día de la semana en general) — o la deja sin horas si
// viene marcada `cerrado`. Se resuelve afuera (en quien llama) buscando en
// la lista de excepciones la que coincide con `fecha`, para que esta función
// siga tratando un solo día a la vez.
export function calcularSlotsDisponibles({
  horarios,
  reservasOcupadas,
  duracionMinutos,
  intervaloMinutos,
  fecha,
  excepcionDelDia,
}) {
  if (excepcionDelDia?.cerrado) return []

  const paso = intervaloMinutos || duracionMinutos
  const diaSemana = fecha.getDay()
  const horariosDelDia = excepcionDelDia
    ? [{ hora_inicio: excepcionDelDia.hora_inicio, hora_fin: excepcionDelDia.hora_fin }]
    : horarios.filter((h) => h.dia_semana === diaSemana)
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

    for (let t = inicio; t + duracionMinutos <= fin; t += paso) {
      if (t < minutoActual) continue

      const seSuperpone = ocupados.some(
        (o) => t < o.fin && t + duracionMinutos > o.inicio
      )
      if (!seSuperpone) slots.push(minutosAHora(t))
    }
  }
  return slots
}
