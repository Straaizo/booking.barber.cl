import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'

// Atenciones a clientes que llegaron sin reserva (ver
// 20261124000000_atencion_presencial.sql): quedan como reservas ya atendidas
// y suman a las métricas del mes como cualquier otra.

export function useHorasAtencionPresencial(servicioId) {
  return useQuery({
    queryKey: ['horas_atencion_presencial', servicioId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('horas_atencion_presencial', { p_servicio_id: servicioId })
      if (error) throw error
      return data.map((fila) => fila.inicio)
    },
    enabled: Boolean(servicioId),
    staleTime: 0,
  })
}

function refrescarTrasCambio(queryClient, barberoId) {
  queryClient.invalidateQueries({ queryKey: ['reservas_de_barbero', barberoId] })
  queryClient.invalidateQueries({ queryKey: ['reservas_del_dia', barberoId] })
  queryClient.invalidateQueries({ queryKey: ['horas_atencion_presencial'] })
  queryClient.invalidateQueries({ queryKey: ['resumen_mes'] })
  queryClient.invalidateQueries({ queryKey: ['avance_meta_barberia'] })
}

export function useRegistrarAtencionPresencial(barberoId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ servicioId, inicio, nombre }) => {
      const { data, error } = await supabase.rpc('registrar_atencion_presencial', {
        p_servicio_id: servicioId,
        p_inicio: inicio,
        p_nombre: nombre || null,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => refrescarTrasCambio(queryClient, barberoId),
  })
}

export function useAnularAtencionPresencial(barberoId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.rpc('anular_atencion_presencial', { p_id: id })
      if (error) throw error
    },
    onSuccess: () => refrescarTrasCambio(queryClient, barberoId),
  })
}
