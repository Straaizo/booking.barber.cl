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

  // La RPC entrega `{ inicio, fin }` (el fin real de cada reserva, no una
  // fila de `reservas`). `calcularSlotsDisponibles` (src/utils/horarios.js)
  // hoy solo lee `fecha_hora` de cada ocupado y sigue aproximando su fin con
  // la duración del servicio que se está por reservar — se mantiene ese
  // nombre acá para no tener que tocar esa función, fuera del alcance de
  // este cambio. El `fin` real que ya entrega la RPC queda disponible pero
  // sin usar todavía.
  return data.map((r) => ({ fecha_hora: r.inicio, fecha_hora_fin: r.fin }))
}

export function useReservasDelDia(barberoId, fechaISO) {
  return useQuery({
    queryKey: ['reservas_del_dia', barberoId, fechaISO],
    queryFn: () => obtenerReservasDelDia(barberoId, fechaISO),
    enabled: Boolean(barberoId && fechaISO),
  })
}
