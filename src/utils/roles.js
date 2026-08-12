// IDs fijos de la tabla `roles` (catálogo, evita texto libre en el modelo).
export const ROL_SUPERADMIN = 1
export const ROL_ADMIN = 2
export const ROL_BARBERO = 3

export function rutaPorRol(rolId) {
  if (rolId === ROL_SUPERADMIN) return '/admin'
  if (rolId === ROL_ADMIN) return '/panel'
  if (rolId === ROL_BARBERO) return '/panel/barbero'
  return '/login'
}
