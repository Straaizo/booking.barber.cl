import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'

function clave(barberiaId) {
  return ['barberos_admin', barberiaId]
}

async function obtenerBarberos(barberiaId) {
  const { data, error } = await supabase
    .from('barberos')
    .select('id, nombre, activo')
    .eq('barberia_id', barberiaId)
    .order('nombre')

  if (error) throw error
  return data
}

export function useBarberosAdmin(barberiaId) {
  return useQuery({
    queryKey: clave(barberiaId),
    queryFn: () => obtenerBarberos(barberiaId),
    enabled: Boolean(barberiaId),
  })
}

export function useCrearBarbero(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (nombre) => {
      const { data, error } = await supabase
        .from('barberos')
        .insert({ barberia_id: barberiaId, nombre, activo: true })
        .select('id, nombre, activo')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}

export function useActualizarBarbero(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, cambios }) => {
      const { data, error } = await supabase
        .from('barberos')
        .update(cambios)
        .eq('id', id)
        .select('id, nombre, activo')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}
