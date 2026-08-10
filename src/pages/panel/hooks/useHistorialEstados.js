import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import { HAY_BACKEND_REAL, listarHistorialProvisorio } from '../../../mocks/datosProvisoriosSuperadmin'

async function obtenerHistorial(barberiaId) {
  const { data, error } = await supabase
    .from('historial_estados')
    .select('id, estado_anterior_id, estado_nuevo_id, motivo, created_at, usuarios (nombre)')
    .eq('barberia_id', barberiaId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export function useHistorialEstados(barberiaId) {
  return useQuery({
    queryKey: ['historial_estados', barberiaId],
    queryFn: () => (HAY_BACKEND_REAL ? obtenerHistorial(barberiaId) : listarHistorialProvisorio(barberiaId)),
    enabled: Boolean(barberiaId),
  })
}
