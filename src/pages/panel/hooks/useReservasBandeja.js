import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import {
  HAY_BACKEND_REAL,
  listarReservasBandejaProvisorias,
  listarReservasDeBarberoProvisorias,
  cancelarReservaProvisoria,
} from '../../../mocks/datosProvisoriosSuperadmin'

const COLUMNAS =
  'id, cliente_nombre, cliente_telefono, fecha_hora, estado, servicios (nombre, precio_clp), barberos (nombre)'

function clave(barberiaId) {
  return ['reservas_bandeja', barberiaId]
}

async function obtenerReservas(barberiaId) {
  const { data, error } = await supabase
    .from('reservas')
    .select(COLUMNAS)
    .eq('barberia_id', barberiaId)
    .order('fecha_hora', { ascending: true })

  if (error) throw error
  return data
}

// Todas las reservas de la barbería — el panel del dueño.
export function useReservasBandeja(barberiaId) {
  return useQuery({
    queryKey: clave(barberiaId),
    queryFn: () =>
      HAY_BACKEND_REAL ? obtenerReservas(barberiaId) : listarReservasBandejaProvisorias(barberiaId),
    enabled: Boolean(barberiaId),
  })
}

function claveBarbero(barberoId) {
  return ['reservas_de_barbero', barberoId]
}

async function obtenerReservasDeBarbero(barberoId) {
  const { data, error } = await supabase
    .from('reservas')
    .select(COLUMNAS)
    .eq('barbero_id', barberoId)
    .order('fecha_hora', { ascending: true })

  if (error) throw error
  return data
}

// Solo las reservas de un barbero — su propio panel, no la bandeja completa
// del dueño.
export function useReservasDeBarbero(barberoId) {
  return useQuery({
    queryKey: claveBarbero(barberoId),
    queryFn: () =>
      HAY_BACKEND_REAL ? obtenerReservasDeBarbero(barberoId) : listarReservasDeBarberoProvisorias(barberoId),
    enabled: Boolean(barberoId),
  })
}

export function useCancelarReserva(barberiaId, barberoId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      if (!HAY_BACKEND_REAL) return cancelarReservaProvisoria(id)
      const { error } = await supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      if (barberiaId) queryClient.invalidateQueries({ queryKey: clave(barberiaId) })
      if (barberoId) queryClient.invalidateQueries({ queryKey: claveBarbero(barberoId) })
    },
  })
}
