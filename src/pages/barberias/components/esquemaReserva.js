import { z } from 'zod'

// El input de teléfono (ver PasoDatos.jsx) ya obliga el prefijo "+56 9" como
// una etiqueta fija, no editable — lo único que el cliente puede escribir
// son los 8 dígitos siguientes, y cada tecla que no sea un número se
// descarta antes de llegar a este esquema. Así que acá solo queda validar
// la forma final: exactamente "9" + 8 dígitos.
export const esquemaDatosCliente = z.object({
  cliente_nombre: z
    .string()
    .trim()
    .min(2, 'Ingresa tu nombre completo')
    .max(80, 'Nombre demasiado largo'),
  cliente_telefono: z
    .string()
    .regex(/^9\d{8}$/, 'Ingresa tus 8 dígitos después del 9')
    // Los 8 dígitos repetidos (90000000, 91111111...) no son un celular real
    // — nunca los rechaza la base de datos por sí sola (cualquier
    // combinación con el formato correcto pasa), así que se frena acá para
    // no ensuciar la agenda con reservas imposibles de contactar de verdad.
    .refine((valor) => !/^9(\d)\1{7}$/.test(valor), 'Ese número no parece un celular real'),
})
