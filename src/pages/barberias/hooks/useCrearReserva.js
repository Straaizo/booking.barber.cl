import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import { onReservaCreada } from '../../../services/eventosReserva'
import { esBarberoDemo } from '../../../config/demo'
import { HAY_BACKEND_REAL, crearReservaProvisoria } from '../../../mocks/datosProvisoriosSuperadmin'

async function simularReservaDemo(reserva) {
  await new Promise((resolver) => setTimeout(resolver, 500))
  return { id: `demo-reserva-${Date.now()}`, ...reserva }
}

async function insertarReserva(reserva) {
  if (esBarberoDemo(reserva.barbero_id)) return simularReservaDemo(reserva)
  if (!HAY_BACKEND_REAL) return crearReservaProvisoria(reserva)

  // Sin `.select()`: quien reserva público nunca tuvo (ni necesita) permiso
  // de LEER `reservas` — solo de insertar (`reservas_insert_publico`, RLS).
  // Pedir la fila de vuelta con `.select().single()` obliga a Postgres a
  // releerla para el RETURNING, y como no hay ninguna política de lectura
  // que alcance a un visitante anónimo, la fila queda invisible para esa
  // relectura y Postgres rechaza el insert entero con un genérico "new row
  // violates row-level security policy" — aunque el insert en sí era
  // perfectamente válido. Nada más abajo (onSuccess, onReservaCreada) usa
  // un campo calculado por el servidor — el propio objeto enviado alcanza.
  const { error } = await supabase.from('reservas').insert(reserva)
  if (error) throw error
  return reserva
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
