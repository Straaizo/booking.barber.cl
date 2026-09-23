import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import {
  HAY_BACKEND_REAL,
  listarReservasBandejaProvisorias,
  listarReservasDeBarberoProvisorias,
  cancelarReservaProvisoria,
} from '../../../mocks/datosProvisoriosSuperadmin'
import { conBarberoIds } from '../../../utils/servicios'

const COLUMNAS =
  'id, cliente_nombre, cliente_telefono, fecha_hora, fecha_hora_fin, estado, servicio_id, barbero_id, servicios (nombre, precio_clp), barberos (nombre, intervalo_reserva_minutos)'

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

// Mantiene el panel al día solo — sin esto, una reserva nueva (o cancelada,
// o reprogramada) desde OTRO dispositivo o pestaña quedaba invisible hasta
// recargar la página a mano. Se suscribe a los cambios de `reservas` de esta
// barbería/barbero (requiere `alter publication supabase_realtime add table
// reservas`, ver 20260923000000_habilitar_realtime_reservas.sql — sin esa
// migración, Supabase nunca transmite el cambio aunque el cliente esté bien
// suscrito) y, ante cualquier cambio, invalida las queries en vez de
// intentar aplicar el cambio a mano — mismo dato, una sola fuente de verdad.
//
// Pasa por las mismas políticas RLS de siempre: un dueño solo recibe eventos
// de su propia barbería, un barbero solo de las suyas — no es una vía nueva
// de acceso, solo una forma más rápida de enterarse de algo que igual ya
// podían leer.
export function useRealtimeReservas({ barberiaId, barberoId } = {}) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!HAY_BACKEND_REAL) return
    if (!barberiaId && !barberoId) return

    const filtro = barberiaId ? `barberia_id=eq.${barberiaId}` : `barbero_id=eq.${barberoId}`
    const canal = supabase
      .channel(`reservas-${barberiaId ? 'barberia-' + barberiaId : 'barbero-' + barberoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservas', filter: filtro },
        () => {
          if (barberiaId) queryClient.invalidateQueries({ queryKey: clave(barberiaId) })
          if (barberoId) queryClient.invalidateQueries({ queryKey: claveBarbero(barberoId) })
          // Sin filtro de fecha/barbero exacto: invalida cualquier día ya
          // cargado, para que un cambio ajeno no deje una grilla de horas
          // vieja (ej: el dueño reprogramando mientras alguien más mira el
          // mismo día en el asistente de reserva).
          queryClient.invalidateQueries({ queryKey: ['reservas_del_dia'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [barberiaId, barberoId, queryClient])
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

// Todos los servicios ACTIVOS de la barbería, con sus barberos asignados —
// hace falta para poder ofrecer las opciones correctas al reprogramar una
// reserva de cualquiera de ellos (ver `ModalReprogramarReserva` en
// PanelReservas.jsx).
export function useServiciosParaReprogramar(barberiaId) {
  return useQuery({
    queryKey: ['servicios_para_reprogramar', barberiaId],
    queryFn: async () => {
      if (!HAY_BACKEND_REAL) return []
      const { data, error } = await supabase
        .from('servicios')
        .select('id, nombre, precio_clp, duracion_minutos')
        .eq('barberia_id', barberiaId)
        .eq('activo', 1)
      if (error) throw error
      return conBarberoIds(data)
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
