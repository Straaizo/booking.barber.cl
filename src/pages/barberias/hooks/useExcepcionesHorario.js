import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import { esBarberoDemo } from '../../../config/demo'
import { HAY_BACKEND_REAL, listarExcepcionesDeBarberoProvisorias } from '../../../mocks/datosProvisoriosSuperadmin'

async function obtenerExcepciones(barberoId) {
  if (esBarberoDemo(barberoId)) return []
  if (!HAY_BACKEND_REAL) return listarExcepcionesDeBarberoProvisorias(barberoId)

  const { data, error } = await supabase
    .from('excepciones_horario')
    .select('fecha, hora_inicio, hora_fin, cerrado')
    .eq('barbero_id', barberoId)

  if (error) throw error
  return data
}

// Fechas puntuales donde el barbero dejó un bloque distinto al de su
// horario semanal (o marcó el día entero cerrado) — ver PasoHorario.jsx,
// que las cruza con `horarios_disponibles` al calcular las horas ofrecidas.
export function useExcepcionesHorario(barberoId) {
  return useQuery({
    queryKey: ['excepciones_horario', barberoId],
    queryFn: () => obtenerExcepciones(barberoId),
    enabled: Boolean(barberoId),
  })
}
