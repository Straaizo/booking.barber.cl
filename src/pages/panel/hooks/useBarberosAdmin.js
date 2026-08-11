import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import {
  HAY_BACKEND_REAL,
  listarBarberosProvisorios,
  crearBarberoProvisorio,
  actualizarBarberoProvisorio,
} from '../../../mocks/datosProvisoriosSuperadmin'

const COLUMNAS = 'id, nombre, activo, foto_url, especialidad'

function clave(barberiaId) {
  return ['barberos_admin', barberiaId]
}

async function obtenerBarberos(barberiaId) {
  const { data, error } = await supabase
    .from('barberos')
    .select(COLUMNAS)
    .eq('barberia_id', barberiaId)
    .order('nombre')

  if (error) throw error
  return data
}

export function useBarberosAdmin(barberiaId) {
  return useQuery({
    queryKey: clave(barberiaId),
    queryFn: () =>
      HAY_BACKEND_REAL ? obtenerBarberos(barberiaId) : listarBarberosProvisorios(barberiaId),
    enabled: Boolean(barberiaId),
  })
}

export function useCrearBarbero(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (nombre) => {
      if (!HAY_BACKEND_REAL) return crearBarberoProvisorio(barberiaId, nombre)
      const { data, error } = await supabase
        .from('barberos')
        .insert({ barberia_id: barberiaId, nombre, activo: true })
        .select(COLUMNAS)
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
      if (!HAY_BACKEND_REAL) return actualizarBarberoProvisorio(barberiaId, id, cambios)
      const { data, error } = await supabase
        .from('barberos')
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
