// Misma regla que exige la base (`servicios_oferta_coherente` en
// supabase/sql/000_schema.sql): una oferta activa necesita un precio de
// oferta puesto y menor al precio normal. Se valida acá también para no
// depender del viaje redondo al servidor y de un error genérico si no se
// cumple — usado por FilaServicioAdmin.jsx (dueño) y PanelBarberoServicios.jsx
// (catálogo propio del barbero).
export function errorDeOferta(ofertaActiva, precioOferta, precioClp) {
  if (!ofertaActiva) return null
  const oferta = precioOferta === '' || precioOferta === null || precioOferta === undefined ? null : Number(precioOferta)
  if (!oferta || oferta <= 0) return 'Ponle un precio de oferta antes de activarla.'
  if (oferta >= Number(precioClp)) return 'El precio de oferta tiene que ser menor al precio normal.'
  return null
}
