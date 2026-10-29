import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import { onReservaCreada } from '../../../services/eventosReserva'
import { esBarberoDemo } from '../../../config/demo'
import { HAY_BACKEND_REAL, crearReservaProvisoria } from '../../../mocks/datosProvisoriosSuperadmin'

async function simularReservaDemo(reserva) {
  await new Promise((resolver) => setTimeout(resolver, 500))
  return { id: `demo-reserva-${Date.now()}`, ...reserva }
}

// La reserva real pasa por la Edge Function `crear-reserva`, que valida el
// captcha antes de insertar — la tabla ya no acepta inserts directos desde
// el navegador. Los errores de negocio (horario tomado, enfriamiento por
// teléfono, etc.) vuelven con su `code` P0001 igual que antes, así
// `mensajeErrorReserva` los sigue mostrando tal cual. Nada más abajo
// (onSuccess, onReservaCreada) usa un campo calculado por el servidor — el
// propio objeto enviado alcanza.
async function insertarReserva({ captcha, ...reserva }) {
  if (esBarberoDemo(reserva.barbero_id)) return simularReservaDemo(reserva)
  if (!HAY_BACKEND_REAL) return crearReservaProvisoria(reserva)

  const { error } = await supabase.functions.invoke('crear-reserva', { body: { ...reserva, captcha } })
  if (error) {
    let cuerpo = null
    try {
      cuerpo = await error.context?.json()
    } catch {
      cuerpo = null
    }
    throw Object.assign(new Error(cuerpo?.error ?? error.message), { code: cuerpo?.code })
  }
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
