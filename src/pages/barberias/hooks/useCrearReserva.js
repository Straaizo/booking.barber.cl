import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import { onReservaCreada } from '../../../services/eventosReserva'
import { esBarberoDemo } from '../../../config/demo'

async function simularReservaDemo(reserva) {
  await new Promise((resolver) => setTimeout(resolver, 500))
  return { id: `demo-reserva-${Date.now()}`, ...reserva }
}

async function insertarReserva(reserva) {
  if (esBarberoDemo(reserva.barbero_id)) return simularReservaDemo(reserva)

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
