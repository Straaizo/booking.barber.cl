import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import {
  HAY_BACKEND_REAL,
  obtenerBarberiaParaPersonalizacion,
  guardarPersonalizacionProvisoria,
} from '../../../mocks/datosProvisoriosSuperadmin'
import { normalizarPersonalizacion } from '../../../utils/personalizacion'

const CLAVE = (barberiaId) => ['personalizacion_admin', barberiaId]

async function obtenerBarberiaParaPersonalizacionReal(barberiaId) {
  const { data, error } = await supabase
    .from('barberias')
    .select(
      `
      id, nombre, slug, logo_url, direccion, telefono_whatsapp,
      personalizacion (color_primario, color_header, fuente_display, eslogan, descripcion, banner_url, secciones),
      servicios (id, nombre, duracion_minutos, precio_clp, precio_oferta, oferta_activa, oferta_vence, activo),
      barberos (id, nombre, activo, foto_url, especialidad)
    `
    )
    .eq('id', barberiaId)
    .single()
  if (error) throw error
  return { ...data, personalizacion: normalizarPersonalizacion(data.personalizacion) }
}

// Trae lo que necesita la pantalla de personalización: identidad básica de la
// barbería (para el link público) + su fila de `personalizacion`.
export function usePersonalizacionAdmin(barberiaId) {
  return useQuery({
    queryKey: CLAVE(barberiaId),
    queryFn: () =>
      HAY_BACKEND_REAL
        ? obtenerBarberiaParaPersonalizacionReal(barberiaId)
        : obtenerBarberiaParaPersonalizacion(barberiaId),
    enabled: Boolean(barberiaId),
  })
}

// `logo_url` vive en `barberias`, el resto en `personalizacion` (1:1 por
// `barberia_id`) — se separan acá para no obligar a quien llama a saber en
// qué tabla vive cada campo.
async function guardarPersonalizacionReal(barberiaId, cambios) {
  const { logo_url, ...personalizacionCambios } = cambios
  if (logo_url !== undefined) {
    const { error } = await supabase.from('barberias').update({ logo_url }).eq('id', barberiaId)
    if (error) throw error
  }
  if (Object.keys(personalizacionCambios).length > 0) {
    const { error } = await supabase
      .from('personalizacion')
      .upsert({ barberia_id: barberiaId, ...personalizacionCambios })
    if (error) throw error
  }
}

export function useGuardarPersonalizacion(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cambios) =>
      HAY_BACKEND_REAL
        ? guardarPersonalizacionReal(barberiaId, cambios)
        : guardarPersonalizacionProvisoria(barberiaId, cambios),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE(barberiaId) }),
  })
}
