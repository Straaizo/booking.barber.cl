import { z } from 'zod'

export const esquemaLogin = z.object({
  usuario: z.string().trim().min(1, 'Ingresa tu usuario'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})
