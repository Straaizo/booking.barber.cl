import { supabase } from '../services/supabaseClient'

// Dos consultas, no un embed `servicios ( servicio_barberos (barbero_id) )` —
// PostgREST no arma el embed automático porque la FK real
// (`servicio_barberos_servicio_fk`) es compuesta (`servicio_id, barberia_id`
// juntas, ver 20260908000000_servicios_multiples_barberos.sql), no una
// columna simple. Mismo problema que `usuarios_barbero_fk` (ver
// useBarberosAdmin.js) — con el embed, todo servicio volvía con la lista
// vacía sin ningún error visible, así que cualquier asignación a un barbero
// puntual se veía bien en modo de prueba (sin PostgREST de por medio) pero
// desaparecía sola contra Supabase real.
async function obtenerBarberoIdsPorServicio(servicioIds) {
  if (servicioIds.length === 0) return new Map()
  const { data, error } = await supabase
    .from('servicio_barberos')
    .select('servicio_id, barbero_id')
    .in('servicio_id', servicioIds)
  if (error) throw error

  const mapa = new Map()
  for (const fila of data) {
    const lista = mapa.get(fila.servicio_id) ?? []
    lista.push(fila.barbero_id)
    mapa.set(fila.servicio_id, lista)
  }
  return mapa
}

// Vacía = servicio compartido (cualquier barbero activo lo ofrece); con ids
// = solo esos barberos lo ofrecen (ver AsistenteReserva.jsx).
export async function conBarberoIds(servicios) {
  const mapa = await obtenerBarberoIdsPorServicio(servicios.map((s) => s.id))
  return servicios.map((s) => ({ ...s, barbero_ids: mapa.get(s.id) ?? [] }))
}
