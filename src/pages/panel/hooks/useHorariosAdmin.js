import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'

const COLUMNAS = 'id, barbero_id, dia_semana, hora_inicio, hora_fin, activo'

function clave(barberoId) {
  return ['horarios_admin', barberoId]
}

async function obtenerHorarios(barberoId) {
  const { data, error } = await supabase
    .from('horarios_disponibles')
    .select(COLUMNAS)
    .eq('barbero_id', barberoId)
    .order('dia_semana')

  if (error) throw error
  return data
}

export function useHorariosDeBarbero(barberoId) {
  return useQuery({
    queryKey: clave(barberoId),
    queryFn: () => obtenerHorarios(barberoId),
    enabled: Boolean(barberoId),
  })
}

export function useCrearHorario(barberoId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (horario) => {
      const { data, error } = await supabase
        .from('horarios_disponibles')
        .insert({ ...horario, barbero_id: barberoId, activo: true })
        .select(COLUMNAS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberoId) }),
  })
}

export function useActualizarHorario(barberoId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, cambios }) => {
      const { data, error } = await supabase
        .from('horarios_disponibles')
        .update(cambios)
        .eq('id', id)
        .select(COLUMNAS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberoId) }),
  })
}
