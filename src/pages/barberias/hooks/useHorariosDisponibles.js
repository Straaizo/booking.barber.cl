import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import { esBarberoDemo, HORARIOS_DEMO } from '../../../config/demo'
import { HAY_BACKEND_REAL, listarHorariosDisponiblesProvisorios } from '../../../mocks/datosProvisoriosSuperadmin'

async function obtenerHorarios(barberoId) {
  if (esBarberoDemo(barberoId)) return HORARIOS_DEMO
  if (!HAY_BACKEND_REAL) return listarHorariosDisponiblesProvisorios(barberoId)

  const { data, error } = await supabase
    .from('horarios_disponibles')
    .select('id, dia_semana, hora_inicio, hora_fin')
    .eq('barbero_id', barberoId)
    .eq('activo', 1)

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
