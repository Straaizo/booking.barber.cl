import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import {
  HAY_BACKEND_REAL,
  listarBarberosProvisorios,
  crearBarberoProvisorio,
  actualizarBarberoProvisorio,
  activarCatalogoPropioProvisorio,
  desactivarCatalogoPropioProvisorio,
} from '../../../mocks/datosProvisoriosSuperadmin'

const COLUMNAS = 'id, nombre, activo, foto_url, especialidad, usa_catalogo_propio'

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

// Al activar "servicios propios" por primera vez, el barbero arranca con una
// COPIA editable del catálogo compartido (no de cero) — ver
// `activarCatalogoPropioProvisorio` para el detalle de por qué. Del lado
// real, como no hay una función de base de datos para esto todavía, se hace
// el mismo paso a mano: traer el catálogo compartido, insertar una copia con
// el `barbero_id` puesto, y recién ahí prender el flag.
export function useActivarCatalogoPropio(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (barberoId) => {
      if (!HAY_BACKEND_REAL) return activarCatalogoPropioProvisorio(barberiaId, barberoId)

      const { data: propios, error: errorPropios } = await supabase
        .from('servicios')
        .select('id')
        .eq('barbero_id', barberoId)
      if (errorPropios) throw errorPropios

      if (!propios || propios.length === 0) {
        const { data: compartidos, error: errorCompartidos } = await supabase
          .from('servicios')
          .select('nombre, duracion_minutos, precio_clp, precio_oferta, oferta_activa, oferta_vence, activo')
          .eq('barberia_id', barberiaId)
          .is('barbero_id', null)
        if (errorCompartidos) throw errorCompartidos

        if (compartidos?.length > 0) {
          const { error: errorCopia } = await supabase
            .from('servicios')
            .insert(compartidos.map((s) => ({ ...s, barberia_id: barberiaId, barbero_id: barberoId })))
          if (errorCopia) throw errorCopia
        }
      }

      const { data, error } = await supabase
        .from('barberos')
        .update({ usa_catalogo_propio: true })
        .eq('id', barberoId)
        .select(COLUMNAS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}

export function useDesactivarCatalogoPropio(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (barberoId) => {
      if (!HAY_BACKEND_REAL) return desactivarCatalogoPropioProvisorio(barberiaId, barberoId)
      const { data, error } = await supabase
        .from('barberos')
        .update({ usa_catalogo_propio: false })
        .eq('id', barberoId)
        .select(COLUMNAS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}
