import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'

const COLUMNAS = 'id, titulo, descripcion, etiqueta, fecha, orden, activo'
const CLAVE = ['novedades_superadmin']

// A diferencia de la lectura pública (`useNovedadesPublicas`, solo activas),
// acá el superadmin necesita ver también las ocultas para poder
// reactivarlas — por eso no filtra por `activo`.
async function obtenerNovedades() {
  const { data, error } = await supabase.from('novedades').select(COLUMNAS).order('orden')
  if (error) throw error
  return data
}

export function useNovedadesSuperadmin() {
  return useQuery({ queryKey: CLAVE, queryFn: obtenerNovedades })
}

export function useCrearNovedad() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (novedad) => {
      const { data, error } = await supabase.from('novedades').insert(novedad).select(COLUMNAS).single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  })
}

export function useActualizarNovedad() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, cambios }) => {
      const { data, error } = await supabase
        .from('novedades')
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

export function useEliminarNovedad() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('novedades').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  })
}
