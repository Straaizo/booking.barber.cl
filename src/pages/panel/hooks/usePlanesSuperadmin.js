import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'

const COLUMNAS = 'id, nombre, precio_clp, max_barberos, orden'
const CLAVE = ['planes_superadmin']

async function obtenerPlanes() {
  const { data, error } = await supabase.from('planes').select(COLUMNAS).order('orden')
  if (error) throw error
  return data
}

export function usePlanesSuperadmin() {
  return useQuery({ queryKey: CLAVE, queryFn: obtenerPlanes })
}

export function useCrearPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (plan) => {
      const { data, error } = await supabase.from('planes').insert(plan).select(COLUMNAS).single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  })
}

export function useActualizarPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, cambios }) => {
      const { data, error } = await supabase
        .from('planes')
        .update(cambios)
        .eq('id', id)
        .select(COLUMNAS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  })
}
