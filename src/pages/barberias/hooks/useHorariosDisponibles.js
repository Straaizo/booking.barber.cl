import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'

async function obtenerHorarios(barberoId) {
  const { data, error } = await supabase
    .from('horarios_disponibles')
    .select('id, dia_semana, hora_inicio, hora_fin')
    .eq('barbero_id', barberoId)
    .eq('activo', true)

  if (error) throw error
  return data
}

export function useHorariosDisponibles(barberoId) {
  return useQuery({
    queryKey: ['horarios_disponibles', barberoId],
    queryFn: () => obtenerHorarios(barberoId),
    enabled: Boolean(barberoId),
  })
}
