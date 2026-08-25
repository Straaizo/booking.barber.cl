// El negocio siempre corre en hora de Chile (America/Santiago — ver la
// cabecera de supabase/migrations/20260819120000_schema.sql), pero
// `new Date(iso).getHours()` (o `.toLocaleTimeString()` sin `timeZone`)
// usa la hora LOCAL del dispositivo que mira la pantalla, no la de Chile.
// Coincide para cualquiera que esté físicamente en Chile (el caso normal),
// pero se rompe apenas alguien mira el panel desde otro huso horario, o —
// más importante para probar esto — desde una máquina de desarrollo/testing
// configurada en otro huso. Estas dos funciones fijan siempre
// 'America/Santiago', sin depender de dónde esté el dispositivo.

const ZONA_NEGOCIO = 'America/Santiago'

// {hora, minuto} de un instante, en hora de Chile — para posicionar algo en
// una grilla de horas (ej: el calendario semanal de Reservas).
export function horaMinutoEnSantiago(fecha) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_NEGOCIO,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(fecha)
  const hora = Number(partes.find((p) => p.type === 'hour')?.value ?? 0) % 24
  const minuto = Number(partes.find((p) => p.type === 'minute')?.value ?? 0)
  return { hora, minuto }
}

// "YYYY-MM-DD" del día calendario en Chile — para agrupar/comparar por día
// sin que el huso horario del dispositivo corra la fecha (ej: 23:30 en Chile
// un lunes no debe contarse como martes solo porque el navegador está en UTC).
export function claveFechaSantiago(fecha) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_NEGOCIO }).format(fecha)
}

// El día calendario de Chile de `fecha`, como un Date "puro" a medianoche
// LOCAL del dispositivo — para poder seguir comparando contra otros
// marcadores de día (los que arma la grilla del calendario, que son
// simples Y/M/D sin huso real) con los getters locales de siempre
// (`getFullYear`/`getMonth`/`getDate`), sin mezclar dos sistemas de hora.
export function diaSantiagoComoFechaLocal(fecha) {
  const [y, m, d] = claveFechaSantiago(fecha).split('-').map(Number)
  return new Date(y, m - 1, d)
}

// "Hoy", pero el día calendario de Chile — no el del dispositivo.
export function hoyEnSantiago() {
  return diaSantiagoComoFechaLocal(new Date())
}

// El lunes de la semana que contiene `fecha` (convención chilena: la semana
// empieza en lunes, no domingo) — un marcador de día puro, no un instante,
// así que no hace falta pasar por Santiago acá; `fecha` ya debería serlo
// (ej: el resultado de `hoyEnSantiago()`).
export function inicioDeSemanaLunes(fecha) {
  const dia = fecha.getDay() // 0 = domingo
  const desplazamiento = dia === 0 ? 6 : dia - 1
  const resultado = new Date(fecha)
  resultado.setHours(0, 0, 0, 0)
  resultado.setDate(fecha.getDate() - desplazamiento)
  return resultado
}

// Convierte una hora de pared en Chile (los campos sueltos que ya escribió
// alguien en un formulario: año, mes, día, hora, minuto) al instante UTC
// real que representa — lo opuesto de `horaMinutoEnSantiago`. Hace falta
// para guardar una reserva editada con la hora que el dueño quiso decir en
// Chile, no la que resultaría de interpretar esos mismos números en el huso
// del dispositivo que tiene abierto el panel.
export function santiagoAFechaUTC(anio, mes, dia, horas, minutos) {
  // Primer instante aproximado: los mismos números, leídos como si fueran UTC.
  const aproximada = new Date(Date.UTC(anio, mes - 1, dia, horas, minutos))
  // El offset real de Chile en esa fecha (varía entre -3 y -4 según la época
  // del año) — se consulta a Intl en vez de codificarlo a mano, porque la
  // regla de horario de verano de Chile cambia con los años.
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_NEGOCIO,
    timeZoneName: 'shortOffset',
  }).formatToParts(aproximada)
  const textoOffset = partes.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT-4'
  const offsetHoras = Number(textoOffset.match(/GMT([+-]\d+)/)?.[1] ?? -4)
  return new Date(aproximada.getTime() - offsetHoras * 3_600_000)
}
