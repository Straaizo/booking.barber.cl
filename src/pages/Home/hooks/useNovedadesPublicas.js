import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'

// Landing pública — solo lo que el superadmin dejó activo, en el orden que
// eligió armar (`orden`, no fecha: así puede priorizar una novedad vieja
// que todavía quiere destacar por sobre una nueva menor).
async function obtenerNovedadesPublicas() {
  const { data, error } = await supabase
    .from('novedades')
    .select('id, titulo, descripcion, etiqueta, fecha')
    .eq('activo', 1)
    .order('orden')
  if (error) throw error
  return data
}

export function useNovedadesPublicas() {
  return useQuery({ queryKey: ['novedades_publicas'], queryFn: obtenerNovedadesPublicas })
}
