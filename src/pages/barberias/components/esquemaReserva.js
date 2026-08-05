import { z } from 'zod'

export const esquemaDatosCliente = z.object({
  cliente_nombre: z
    .string()
    .trim()
    .min(2, 'Ingresa tu nombre completo')
    .max(80, 'Nombre demasiado largo'),
  cliente_telefono: z
    .string()
    .trim()
    .regex(/^(\+?56)?\s?9\d{8}$/, 'Ingresa un celular chileno válido (ej: 9 1234 5678)'),
})
