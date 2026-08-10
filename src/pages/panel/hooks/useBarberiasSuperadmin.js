import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import { ESTADO_PENDIENTE_ACTIVACION } from '../../../utils/estados'
import {
  HAY_BACKEND_REAL,
  listarBarberiasProvisorias,
  obtenerBarberiaProvisoria,
  slugProvisorioDisponible,
  crearBarberiaProvisoria,
  cambiarPlanProvisorio,
  cambiarEstadoProvisorio,
} from '../../../mocks/datosProvisoriosSuperadmin'

const CLAVE = ['barberias_superadmin']

async function obtenerBarberias() {
  const { data, error } = await supabase
    .from('barberias')
    .select('id, nombre, slug, estado_id, plan_id, planes (nombre)')
    .order('nombre')

  if (error) throw error
  return data
}

export function useBarberiasSuperadmin() {
  return useQuery({ queryKey: CLAVE, queryFn: HAY_BACKEND_REAL ? obtenerBarberias : listarBarberiasProvisorias })
}

async function obtenerBarberiaDetalle(id) {
  const { data, error } = await supabase
    .from('barberias')
    .select(
      'id, nombre, slug, estado_id, plan_id, telefono_whatsapp, email_contacto, direccion, planes (nombre, max_barberos)'
    )
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export function useBarberiaDetalle(id) {
  return useQuery({
    queryKey: ['barberia_detalle', id],
    queryFn: () => (HAY_BACKEND_REAL ? obtenerBarberiaDetalle(id) : obtenerBarberiaProvisoria(id)),
    enabled: Boolean(id),
  })
}

export async function slugDisponible(slug) {
  if (!HAY_BACKEND_REAL) return slugProvisorioDisponible(slug)
  const { data, error } = await supabase.from('barberias').select('id').eq('slug', slug).maybeSingle()
  if (error) throw error
  return !data
}

export function useCrearBarberia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (barberia) => {
      if (!HAY_BACKEND_REAL) return crearBarberiaProvisoria(barberia)
      const { data, error } = await supabase
        .from('barberias')
        .insert({ ...barberia, estado_id: ESTADO_PENDIENTE_ACTIVACION })
        .select('id, nombre, slug, estado_id, plan_id, planes (nombre)')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  })
}

export function useCambiarPlanBarberia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, planId }) => {
      if (!HAY_BACKEND_REAL) return cambiarPlanProvisorio(id, planId)
      const { error } = await supabase.from('barberias').update({ plan_id: planId }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: CLAVE })
      queryClient.invalidateQueries({ queryKey: ['barberia_detalle', id] })
    },
  })
}

// Cambia el estado de una barbería Y deja el registro en `historial_estados`
// como una sola operación atómica del lado del servidor (ver
// supabase/sql/002_cambiar_estado_barberia.sql) — evita que el estado cambie
// sin quedar auditado si algo falla a mitad de camino.
export function useCambiarEstadoBarberia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ barberiaId, estadoNuevoId, motivo }) => {
      if (!HAY_BACKEND_REAL) return cambiarEstadoProvisorio(barberiaId, estadoNuevoId, motivo)
      const { error } = await supabase.rpc('cambiar_estado_barberia', {
        p_barberia_id: barberiaId,
        p_estado_nuevo_id: estadoNuevoId,
        p_motivo: motivo,
      })
      if (error) throw error
    },
    onSuccess: (_data, { barberiaId }) => {
      queryClient.invalidateQueries({ queryKey: CLAVE })
      queryClient.invalidateQueries({ queryKey: ['barberia_detalle', barberiaId] })
      queryClient.invalidateQueries({ queryKey: ['historial_estados', barberiaId] })
    },
  })
}
