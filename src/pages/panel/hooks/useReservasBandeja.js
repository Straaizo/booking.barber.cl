import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'

function clave(barberiaId) {
  return ['reservas_bandeja', barberiaId]
}

async function obtenerReservas(barberiaId) {
  const { data, error } = await supabase
    .from('reservas')
    .select(
      'id, cliente_nombre, cliente_telefono, fecha_hora, estado, servicios (nombre, precio_clp), barberos (nombre)'
    )
    .eq('barberia_id', barberiaId)
    .order('fecha_hora', { ascending: true })

  if (error) throw error
  return data
}

export function useReservasBandeja(barberiaId) {
  return useQuery({
    queryKey: clave(barberiaId),
    queryFn: () => obtenerReservas(barberiaId),
    enabled: Boolean(barberiaId),
  })
}

export function useCancelarReserva(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}
