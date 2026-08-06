import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'

const COLUMNAS = 'id, nombre, duracion_minutos, precio_clp, precio_oferta, oferta_activa, activo'

function clave(barberiaId) {
  return ['servicios_admin', barberiaId]
}

async function obtenerServicios(barberiaId) {
  const { data, error } = await supabase
    .from('servicios')
    .select(COLUMNAS)
    .eq('barberia_id', barberiaId)
    .order('nombre')

  if (error) throw error
  return data
}

export function useServiciosAdmin(barberiaId) {
  return useQuery({
    queryKey: clave(barberiaId),
    queryFn: () => obtenerServicios(barberiaId),
    enabled: Boolean(barberiaId),
  })
}

export function useCrearServicio(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (servicio) => {
      const { data, error } = await supabase
        .from('servicios')
        .insert({ ...servicio, barberia_id: barberiaId, activo: true })
        .select(COLUMNAS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}

export function useActualizarServicioAdmin(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, cambios }) => {
      const { data, error } = await supabase
        .from('servicios')
        .update(cambios)
        .eq('id', id)
        .select(COLUMNAS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}
