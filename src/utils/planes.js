// IDs fijos de la tabla `planes` (catálogo) — mismos valores sembrados en
// supabase/sql/000_schema.sql.
export const PLAN_SOLO = 1
export const PLAN_EQUIPO = 2
export const PLAN_ESTUDIO = 3

// Secciones "operativas" — vienen con tener más de un barbero, no son un
// plus de marca: mostrar el equipo, el horario de atención, y la galería de
// fotos (con tope de cantidad, ver `maxFotosGaleria`). Disponibles desde el
// plan Equipo.
const SECCIONES_DESDE_EQUIPO = ['equipo', 'horario', 'galeria']
// El resto (imagen y texto, testimonios) — bloques de texto libre y reseñas
// con color/tipografía propios, pensados para reforzar identidad más que
// para dar información básica del negocio — quedan exclusivos de Estudio.

// La identidad básica (color de marca, color del header, tipografía del
// nombre, tema claro/oscuro, eslogan, WhatsApp) sigue disponible para
// cualquier plan, eso no se restringe acá.
export function seccionDisponibleParaPlan(tipoSeccion, planId) {
  if (planId === PLAN_ESTUDIO) return true
  if (planId === PLAN_EQUIPO) return SECCIONES_DESDE_EQUIPO.includes(tipoSeccion)
  return false
}

// Tope de fotos en la sección Galería — Equipo alcanza para mostrar lo
// esencial del local/trabajo, Estudio queda con espacio de sobra para una
// vidriera más completa. `Infinity` en vez de un número enorme: así no hay
// que inventar un techo arbitrario para "ilimitado".
export function maxFotosGaleria(planId) {
  return planId === PLAN_ESTUDIO ? Infinity : 6
}

// Si hay ALGUNA sección editable en el plan actual (Equipo ya tiene equipo/
// horario) — se usa para decidir si mostrar el editor de secciones o el
// aviso de upgrade completo (plan Solo, ninguna sección disponible).
export function puedePersonalizarSecciones(planId) {
  return planId === PLAN_EQUIPO || planId === PLAN_ESTUDIO
}
