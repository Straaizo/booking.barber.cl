import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import {
  HAY_BACKEND_REAL,
  listarServiciosAdminProvisorios,
  listarServiciosDeBarberoProvisorios,
  crearServicioDeBarberoProvisorio,
  actualizarServicioProvisorio,
} from '../../../mocks/datosProvisoriosSuperadmin'

const COLUMNAS = 'id, nombre, duracion_minutos, precio_clp, precio_oferta, oferta_activa, activo, barbero_id'

function claveServicios(barberiaId) {
  return ['servicios_panel', barberiaId]
}

// El catálogo COMPARTIDO de la barbería — lo que ve, en solo lectura, un
// barbero al que el dueño no le activó "servicios propios": lo administra el
// dueño, no hay edición posible desde este lado.
async function obtenerServiciosCompartidos(barberiaId) {
  const { data, error } = await supabase
    .from('servicios')
    .select(COLUMNAS)
    .eq('barberia_id', barberiaId)
    .is('barbero_id', null)
    .order('nombre')

  if (error) throw error
  return data
}

export function useServiciosDeBarberia(barberiaId) {
  return useQuery({
    queryKey: claveServicios(barberiaId),
    queryFn: () =>
      HAY_BACKEND_REAL ? obtenerServiciosCompartidos(barberiaId) : listarServiciosAdminProvisorios(barberiaId),
    enabled: Boolean(barberiaId),
  })
}

// El catálogo PROPIO de un barbero — solo existe si el dueño le activó
// "servicios propios" desde la pestaña Barberos; ahí el barbero tiene CRUD
// completo (no solo precio), igual que el dueño sobre el catálogo compartido.
function claveCatalogoPropio(barberoId) {
  return ['catalogo_propio_barbero', barberoId]
}

async function obtenerCatalogoPropio(barberoId) {
  const { data, error } = await supabase
    .from('servicios')
    .select(COLUMNAS)
    .eq('barbero_id', barberoId)
    .order('nombre')

  if (error) throw error
  return data
}

export function useCatalogoPropioBarbero(barberiaId, barberoId) {
  return useQuery({
    queryKey: claveCatalogoPropio(barberoId),
    queryFn: () =>
      HAY_BACKEND_REAL
        ? obtenerCatalogoPropio(barberoId)
        : listarServiciosDeBarberoProvisorios(barberiaId, barberoId),
    enabled: Boolean(barberiaId && barberoId),
  })
}

export function useCrearServicioPropio(barberiaId, barberoId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (servicio) => {
      if (!HAY_BACKEND_REAL) return crearServicioDeBarberoProvisorio(barberiaId, barberoId, servicio)
      const { data, error } = await supabase
        .from('servicios')
        .insert({ ...servicio, barberia_id: barberiaId, barbero_id: barberoId, activo: true })
        .select(COLUMNAS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claveCatalogoPropio(barberoId) }),
  })
}

export function useActualizarServicioPropio(barberiaId, barberoId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, cambios }) => {
      if (!HAY_BACKEND_REAL) return actualizarServicioProvisorio(barberiaId, id, cambios)
      const { data, error } = await supabase
        .from('servicios')
        .update(cambios)
        .eq('id', id)
        .select(COLUMNAS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claveCatalogoPropio(barberoId) }),
  })
}
