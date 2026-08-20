// IDs fijos de la tabla `planes` (catálogo) — mismos valores sembrados en
// supabase/sql/000_schema.sql.
export const PLAN_SOLO = 1
export const PLAN_EQUIPO = 2
export const PLAN_ESTUDIO = 3

// Las secciones extra de personalización (galería, imagen y texto, equipo)
// son una función paga desde el plan Equipo hacia arriba — el plan Solo no
// las tiene. La identidad básica (color, tipografía, eslogan, WhatsApp) sigue
// disponible para cualquier plan, eso no se restringe acá.
export function puedePersonalizarSecciones(planId) {
  return planId === PLAN_EQUIPO || planId === PLAN_ESTUDIO
}
