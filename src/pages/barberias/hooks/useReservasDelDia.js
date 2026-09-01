import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import { esBarberoDemo } from '../../../config/demo'
import { HAY_BACKEND_REAL, listarReservasDelDiaProvisorias } from '../../../mocks/datosProvisoriosSuperadmin'

async function obtenerReservasDelDia(barberoId, fechaISO) {
  if (esBarberoDemo(barberoId)) return []
  if (!HAY_BACKEND_REAL) return listarReservasDelDiaProvisorias(barberoId, fechaISO)

  // Con RLS activo, un visitante sin sesión no puede leer `reservas` directo
  // (expondría nombre/teléfono de clientes de cualquier barbería) — por eso
  // esto pasa por `horas_ocupadas`, que solo devuelve los rangos ya tomados.
  const { data, error } = await supabase.rpc('horas_ocupadas', {
    p_barbero_id: barberoId,
    p_fecha: fechaISO,
  })

  if (error) throw error

  // La RPC entrega `{ inicio, fin }` — el fin real de cada reserva ya
  // tomada, calculado con la duración de SU propio servicio. Se renombra acá
  // a `fecha_hora`/`fecha_hora_fin` porque así los usa `calcularSlotsDisponibles`
  // (src/utils/horarios.js) para chequear superposición sin aproximar con la
  // duración del servicio que se está por reservar ahora.
  return data.map((r) => ({ fecha_hora: r.inicio, fecha_hora_fin: r.fin }))
}

export function useReservasDelDia(barberoId, fechaISO) {
  return useQuery({
    queryKey: ['reservas_del_dia', barberoId, fechaISO],
    queryFn: () => obtenerReservasDelDia(barberoId, fechaISO),
    enabled: Boolean(barberoId && fechaISO),
  })
}
