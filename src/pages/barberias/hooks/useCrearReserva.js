import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import { onReservaCreada } from '../../../services/eventosReserva'

async function insertarReserva(reserva) {
  const { data, error } = await supabase
    .from('reservas')
    .insert(reserva)
    .select()
    .single()

  if (error) throw error
  return data
}

export function useCrearReserva() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: insertarReserva,
    onSuccess: (reserva) => {
      queryClient.invalidateQueries({
        queryKey: ['reservas_del_dia', reserva.barbero_id],
      })
      onReservaCreada(reserva)
    },
  })
}
