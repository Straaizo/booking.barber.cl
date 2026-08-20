import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import {
  HAY_BACKEND_REAL,
  listarHorariosDeBarberoProvisorios,
  crearHorarioProvisorio,
  actualizarHorarioProvisorio,
  listarExcepcionesDeBarberoProvisorias,
  crearExcepcionProvisoria,
  eliminarExcepcionProvisoria,
} from '../../../mocks/datosProvisoriosSuperadmin'
import { comoColumnasReales } from '../../../utils/booleanosReales'

const COLUMNAS = 'id, barbero_id, dia_semana, hora_inicio, hora_fin, activo'
const COLUMNAS_EXCEPCION = 'id, barbero_id, fecha, hora_inicio, hora_fin, cerrado'

function clave(barberoId) {
  return ['horarios_admin', barberoId]
}

async function obtenerHorarios(barberoId) {
  const { data, error } = await supabase
    .from('horarios_disponibles')
    .select(COLUMNAS)
    .eq('barbero_id', barberoId)
    .order('dia_semana')

  if (error) throw error
  return data
}

// Se usa tanto desde el panel del dueño (con un selector de barbero) como
// desde el panel del propio barbero (siempre sobre su propio id) — el hook
// no necesita saber quién lo está mirando, solo de qué barbero.
export function useHorariosDeBarbero(barberoId) {
  return useQuery({
    queryKey: clave(barberoId),
    queryFn: () =>
      HAY_BACKEND_REAL ? obtenerHorarios(barberoId) : listarHorariosDeBarberoProvisorios(barberoId),
    enabled: Boolean(barberoId),
  })
}

export function useCrearHorario(barberoId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (horario) => {
      if (!HAY_BACKEND_REAL) return crearHorarioProvisorio(barberoId, horario)
      const { data, error } = await supabase
        .from('horarios_disponibles')
        .insert({ ...comoColumnasReales(horario), barbero_id: barberoId, activo: 1 })
        .select(COLUMNAS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberoId) }),
  })
}

function claveExcepciones(barberoId) {
  return ['excepciones_horario', barberoId]
}

async function obtenerExcepciones(barberoId) {
  const { data, error } = await supabase
    .from('excepciones_horario')
    .select(COLUMNAS_EXCEPCION)
    .eq('barbero_id', barberoId)
    .order('fecha')

  if (error) throw error
  return data
}

// Excepción puntual para una fecha exacta (no un día de la semana) — pensada
// para "mañana llego más tarde" o "ese día no trabajo", sin tocar el horario
// semanal recurrente que sigue igual el resto de las semanas.
export function useExcepcionesDeBarbero(barberoId) {
  return useQuery({
    queryKey: claveExcepciones(barberoId),
    queryFn: () =>
      HAY_BACKEND_REAL
        ? obtenerExcepciones(barberoId)
        : listarExcepcionesDeBarberoProvisorias(barberoId),
    enabled: Boolean(barberoId),
  })
}

export function useCrearExcepcion(barberoId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (excepcion) => {
      if (!HAY_BACKEND_REAL) return crearExcepcionProvisoria(barberoId, excepcion)
      const { data, error } = await supabase
        .from('excepciones_horario')
        .upsert({ ...comoColumnasReales(excepcion), barbero_id: barberoId }, { onConflict: 'barbero_id,fecha' })
        .select(COLUMNAS_EXCEPCION)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claveExcepciones(barberoId) }),
  })
}

export function useEliminarExcepcion(barberoId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      if (!HAY_BACKEND_REAL) return eliminarExcepcionProvisoria(id)
      const { error } = await supabase.from('excepciones_horario').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claveExcepciones(barberoId) }),
  })
}

export function useActualizarHorario(barberoId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, cambios }) => {
      if (!HAY_BACKEND_REAL) return actualizarHorarioProvisorio(id, cambios)
      const { data, error } = await supabase
        .from('horarios_disponibles')
        .update(comoColumnasReales(cambios))
        .eq('id', id)
        .select(COLUMNAS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberoId) }),
  })
}
