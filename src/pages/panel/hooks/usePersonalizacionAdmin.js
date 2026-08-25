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
      id, nombre, slug, logo_url, direccion, telefono_whatsapp, plan_id,
      personalizacion (color_primario, color_header, fuente_display, tema, eslogan, eslogan_color, descripcion, banner_url, secciones, orden_equipo, estilo_whatsapp, whatsapp_color, whatsapp_tamano, mostrar_servicios),
      servicios (id, nombre, duracion_minutos, precio_clp, precio_oferta, oferta_activa, oferta_vence, activo, barbero_id),
      barberos (id, nombre, activo, foto_url, especialidad, usa_catalogo_propio,
        horarios_disponibles (dia_semana, hora_inicio, hora_fin, activo))
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

// `logo_url`, `direccion` y `telefono_whatsapp` viven en `barberias`, el
// resto en `personalizacion` (1:1 por `barberia_id`) — se separan acá para
// no obligar a quien llama a saber en qué tabla vive cada campo.
async function guardarPersonalizacionReal(barberiaId, cambios) {
  const { logo_url, direccion, telefono_whatsapp, ...personalizacionCambios } = cambios
  const cambiosBarberia = { logo_url, direccion, telefono_whatsapp }
  const hayCambiosBarberia = Object.values(cambiosBarberia).some((v) => v !== undefined)
  if (hayCambiosBarberia) {
    const { error } = await supabase.from('barberias').update(cambiosBarberia).eq('id', barberiaId)
    if (error) throw error
  }
  if (Object.keys(personalizacionCambios).length > 0) {
    // `update`, no `upsert`: la fila de `personalizacion` siempre existe de
    // antes (la crea sola `crear_personalizacion_default()` al crear la
    // barbería) — con `upsert`, Postgres evalúa la política RLS de INSERT
    // sobre la fila propuesta ANTES de llegar siquiera a la resolución por
    // conflicto, y esa tabla nunca tuvo una policy de `insert` para
    // `authenticated` (solo `personalizacion_update`) — por eso todo intento
    // de guardar volvía 403, sin relación con ningún campo nuevo.
    const { error } = await supabase
      .from('personalizacion')
      .update(personalizacionCambios)
      .eq('barberia_id', barberiaId)
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
