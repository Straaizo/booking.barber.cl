import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import {
  HAY_BACKEND_REAL,
  listarServiciosAdminProvisorios,
  crearServicioAdminProvisorio,
  actualizarServicioProvisorio,
} from '../../../mocks/datosProvisoriosSuperadmin'
import { comoColumnasReales } from '../../../utils/booleanosReales'
import { conBarberoIds } from '../../../utils/servicios'

const COLUMNAS =
  'id, nombre, descripcion, imagen_url, duracion_minutos, precio_clp, precio_oferta, oferta_activa, activo'

function clave(barberiaId) {
  return ['servicios_admin', barberiaId]
}

// Sincroniza qué barberos tienen asignado un servicio: borra todas las filas
// de ese servicio en la tabla puente y vuelve a insertar las que quedaron —
// más simple que diffear altas/bajas, y el volumen (unos pocos barberos por
// servicio) no lo justifica.
async function sincronizarBarberosDelServicio(barberiaId, servicioId, barberoIds) {
  const { error: errorBorrar } = await supabase
    .from('servicio_barberos')
    .delete()
    .eq('servicio_id', servicioId)
  if (errorBorrar) throw errorBorrar

  if (barberoIds.length === 0) return

  const filas = barberoIds.map((barbero_id) => ({ servicio_id: servicioId, barberia_id: barberiaId, barbero_id }))
  const { error: errorInsertar } = await supabase.from('servicio_barberos').insert(filas)
  if (errorInsertar) throw errorInsertar
}

async function releerServicio(id) {
  const { data, error } = await supabase.from('servicios').select(COLUMNAS).eq('id', id).single()
  if (error) throw error
  const [servicio] = await conBarberoIds([data])
  return servicio
}

// TODOS los servicios de la barbería — compartidos y los asignados a uno o
// varios barberos puntuales: el dueño administra el catálogo completo desde
// acá, ya no existe un catálogo aparte que edite cada barbero (ver
// PanelBarberos.jsx, se sacó el toggle de "servicios propios").
async function obtenerServicios(barberiaId) {
  const { data, error } = await supabase
    .from('servicios')
    .select(COLUMNAS)
    .eq('barberia_id', barberiaId)
    .order('nombre')

  if (error) throw error
  return conBarberoIds(data)
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
      const { barbero_ids, ...datosServicio } = servicio
      if (!HAY_BACKEND_REAL) return crearServicioAdminProvisorio(barberiaId, servicio)

      const { data, error } = await supabase
        .from('servicios')
        .insert({ ...comoColumnasReales(datosServicio), barberia_id: barberiaId, activo: 1 })
        .select(COLUMNAS)
        .single()
      if (error) throw error

      if (barbero_ids?.length > 0) {
        await sincronizarBarberosDelServicio(barberiaId, data.id, barbero_ids)
        return releerServicio(data.id)
      }
      return { ...data, barbero_ids: [] }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}

export function useActualizarServicioAdmin(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, cambios }) => {
      if (!HAY_BACKEND_REAL) return actualizarServicioProvisorio(barberiaId, id, cambios)

      const { barbero_ids, ...cambiosServicio } = cambios
      if (Object.keys(cambiosServicio).length > 0) {
        const { error } = await supabase.from('servicios').update(comoColumnasReales(cambiosServicio)).eq('id', id)
        if (error) throw error
      }
      if (barbero_ids !== undefined) {
        await sincronizarBarberosDelServicio(barberiaId, id, barbero_ids)
      }
      return releerServicio(id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}
