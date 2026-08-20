// El esquema real ya no tiene columnas `boolean` (ver supabase/sql/000_schema.sql)
// — pasaron a `integer` con `check (columna in (0, 1))`, para que todo el
// esquema use un único tipo numérico. La UI sigue pensando en `true`/`false`
// (así es como habla un <Interruptor> o un checkbox en React): esta función
// traduce esos booleanos a 0/1 justo antes de que la escritura le llegue a
// Supabase, en el único lugar donde de verdad importa la forma de la columna
// real — el resto del código nunca se entera de la conversión.
export function comoColumnasReales(cambios) {
  return Object.fromEntries(
    Object.entries(cambios).map(([clave, valor]) => [clave, typeof valor === 'boolean' ? Number(valor) : valor])
  )
}
