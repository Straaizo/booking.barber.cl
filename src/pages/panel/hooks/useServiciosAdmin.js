import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import {
  HAY_BACKEND_REAL,
  listarServiciosAdminProvisorios,
  crearServicioAdminProvisorio,
  actualizarServicioProvisorio,
} from '../../../mocks/datosProvisoriosSuperadmin'
import { comoColumnasReales } from '../../../utils/booleanosReales'

const COLUMNAS = 'id, nombre, duracion_minutos, precio_clp, precio_oferta, oferta_activa, activo, barbero_id'

function clave(barberiaId) {
  return ['servicios_admin', barberiaId]
}

// Solo el catálogo COMPARTIDO (`barbero_id` vacío) — el catálogo propio de un
// barbero (si el dueño se lo activó) lo administra el barbero desde su panel.
async function obtenerServicios(barberiaId) {
  const { data, error } = await supabase
    .from('servicios')
    .select(COLUMNAS)
    .eq('barberia_id', barberiaId)
    .is('barbero_id', null)
    .order('nombre')

  if (error) throw error
  return data
}

export function useServiciosAdmin(barberiaId) {
  return useQuery({
    queryKey: clave(barberiaId),
    queryFn: () =>
      HAY_BACKEND_REAL ? obtenerServicios(barberiaId) : listarServiciosAdminProvisorios(barberiaId),
    enabled: Boolean(barberiaId),
  })
}

export function useCrearServicio(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (servicio) => {
      if (!HAY_BACKEND_REAL) return crearServicioAdminProvisorio(barberiaId, servicio)
      const { data, error } = await supabase
        .from('servicios')
        .insert({ ...comoColumnasReales(servicio), barberia_id: barberiaId, activo: 1, barbero_id: null })
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
      if (!HAY_BACKEND_REAL) return actualizarServicioProvisorio(barberiaId, id, cambios)
      const { data, error } = await supabase
        .from('servicios')
        .update(comoColumnasReales(cambios))
        .eq('id', id)
        .select(COLUMNAS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}
