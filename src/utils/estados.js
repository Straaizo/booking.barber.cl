// IDs fijos de la tabla `estados` (catálogo).
export const ESTADO_ACTIVO = 1
export const ESTADO_INACTIVO = 2
export const ESTADO_SUSPENDIDO_PAGO = 3
export const ESTADO_PENDIENTE_ACTIVACION = 4

export const NOMBRE_ESTADO = {
  [ESTADO_ACTIVO]: 'Activo',
  [ESTADO_INACTIVO]: 'Inactivo',
  [ESTADO_SUSPENDIDO_PAGO]: 'Suspendido por pago',
  [ESTADO_PENDIENTE_ACTIVACION]: 'Pendiente de activación',
}

export const TONO_ESTADO = {
  [ESTADO_ACTIVO]: 'text-verde-barberia',
  [ESTADO_INACTIVO]: 'text-gris-calido-500',
  [ESTADO_SUSPENDIDO_PAGO]: 'text-red-700',
  [ESTADO_PENDIENTE_ACTIVACION]: 'text-cobre',
}
