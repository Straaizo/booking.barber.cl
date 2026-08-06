import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import { esBarberoDemo } from '../../../config/demo'

async function obtenerReservasDelDia(barberoId, fechaISO) {
  if (esBarberoDemo(barberoId)) return []

  const inicio = `${fechaISO}T00:00:00`
  const fin = `${fechaISO}T23:59:59`

  const { data, error } = await supabase
    .from('reservas')
    .select('fecha_hora, servicio_id')
    .eq('barbero_id', barberoId)
    .neq('estado', 'cancelada')
    .gte('fecha_hora', inicio)
    .lte('fecha_hora', fin)

  if (error) throw error
  return data
}

export function useReservasDelDia(barberoId, fechaISO) {
  return useQuery({
    queryKey: ['reservas_del_dia', barberoId, fechaISO],
    queryFn: () => obtenerReservasDelDia(barberoId, fechaISO),
    enabled: Boolean(barberoId && fechaISO),
  })
}
