import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import {
  HAY_BACKEND_REAL,
  listarReservasBandejaProvisorias,
  listarReservasDeBarberoProvisorias,
  cancelarReservaProvisoria,
} from '../../../mocks/datosProvisoriosSuperadmin'

const COLUMNAS =
  'id, cliente_nombre, cliente_telefono, fecha_hora, fecha_hora_fin, estado, servicio_id, barbero_id, servicios (nombre, precio_clp), barberos (nombre, usa_catalogo_propio)'

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

// Vuelve a confirmar una reserva cancelada por error — el trigger
// `trg_reservas_u40_validar_disponibilidad` (ver
// 20260824000002_reprogramar_reservas.sql) revalida solo que el horario siga
// libre (el slot pudo ocuparse con otra reserva mientras esta estaba
// cancelada) antes de dejar pasar el cambio.
export function useReactivarReserva(barberiaId, barberoId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      if (!HAY_BACKEND_REAL) throw new Error('No disponible en modo de prueba.')
      const { error } = await supabase.from('reservas').update({ estado: 'confirmada' }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      if (barberiaId) queryClient.invalidateQueries({ queryKey: clave(barberiaId) })
      if (barberoId) queryClient.invalidateQueries({ queryKey: claveBarbero(barberoId) })
    },
  })
}

// Todos los servicios ACTIVOS de la barbería, con su `barbero_id` — a
// diferencia de `useServiciosAdmin` (solo el catálogo compartido), acá hace
// falta también el catálogo propio de cada barbero para poder ofrecer las
// opciones correctas al reprogramar una reserva de cualquiera de ellos.
export function useServiciosParaReprogramar(barberiaId) {
  return useQuery({
    queryKey: ['servicios_para_reprogramar', barberiaId],
    queryFn: async () => {
      if (!HAY_BACKEND_REAL) return []
      const { data, error } = await supabase
        .from('servicios')
        .select('id, nombre, precio_clp, barbero_id')
        .eq('barberia_id', barberiaId)
        .eq('activo', 1)
      if (error) throw error
      return data
    },
    enabled: Boolean(barberiaId),
  })
}

// Cambia la hora y/o el servicio de una reserva ya confirmada — para cuando
// el cliente se equivocó y avisó directamente a la barbería. Los triggers
// `trg_reservas_u20/u30/u40` (ver 20260824000002_reprogramar_reservas.sql)
// recalculan precio/duración y revalidan disponibilidad solos; acá solo se
// manda el cambio, igual que cualquier otro `.update()`.
export function useReprogramarReserva(barberiaId, barberoId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, servicio_id, fecha_hora }) => {
      if (!HAY_BACKEND_REAL) throw new Error('No disponible en modo de prueba.')
      const { error } = await supabase.from('reservas').update({ servicio_id, fecha_hora }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      if (barberiaId) queryClient.invalidateQueries({ queryKey: clave(barberiaId) })
      if (barberoId) queryClient.invalidateQueries({ queryKey: claveBarbero(barberoId) })
    },
  })
}
