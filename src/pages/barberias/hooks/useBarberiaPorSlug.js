import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import { HAY_BACKEND_REAL, obtenerBarberiaProvisoriaPorSlug } from '../../../mocks/datosProvisoriosSuperadmin'
import { normalizarPersonalizacion } from '../../../utils/personalizacion'
import { conBarberoIds } from '../../../utils/servicios'

async function obtenerBarberiaPorSlug(slug) {
  const { data, error } = await supabase
    .from('barberias')
    .select(
      `
      id, slug, nombre, telefono_whatsapp, email_contacto, direccion, logo_url, estado_id, plan_id, dias_maximos_reserva,
      personalizacion (color_primario, color_header, fuente_display, tema, eslogan, eslogan_color, descripcion, banner_url, secciones, orden_equipo, estilo_whatsapp, whatsapp_color, whatsapp_tamano, mostrar_servicios),
      servicios (id, nombre, descripcion, imagen_url, duracion_minutos, precio_clp, precio_oferta, oferta_activa, oferta_vence, activo),
      barberos (id, nombre, activo, foto_url, especialidad, intervalo_reserva_minutos,
        horarios_disponibles (dia_semana, hora_inicio, hora_fin, activo))
    `
    )
    .eq('slug', slug)
    .single()

  if (error) throw error
  return {
    ...data,
    servicios: await conBarberoIds(data.servicios),
    personalizacion: normalizarPersonalizacion(data.personalizacion),
  }
}

export function useBarberiaPorSlug(slug) {
  return useQuery({
    queryKey: ['barberia', slug],
    queryFn: () => (HAY_BACKEND_REAL ? obtenerBarberiaPorSlug(slug) : obtenerBarberiaProvisoriaPorSlug(slug)),
    enabled: Boolean(slug),
  })
}
