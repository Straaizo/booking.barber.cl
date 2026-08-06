import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'

async function obtenerBarberiaConPlan(barberiaId) {
  const { data, error } = await supabase
    .from('barberias')
    .select('id, nombre, slug, estado_id, planes (nombre, max_barberos)')
    .eq('id', barberiaId)
    .single()

  if (error) throw error
  return data
}

// Info de la barbería + su plan contratado — principalmente para conocer
// `max_barberos` y poder aplicar el límite al crear barberos nuevos.
export function useBarberiaAdmin(barberiaId) {
  return useQuery({
    queryKey: ['barberia_admin', barberiaId],
    queryFn: () => obtenerBarberiaConPlan(barberiaId),
    enabled: Boolean(barberiaId),
  })
}
