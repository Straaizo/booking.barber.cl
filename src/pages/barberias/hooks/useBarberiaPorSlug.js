import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import { HAY_BACKEND_REAL, obtenerBarberiaProvisoriaPorSlug } from '../../../mocks/datosProvisoriosSuperadmin'
import { normalizarPersonalizacion } from '../../../utils/personalizacion'

async function obtenerBarberiaPorSlug(slug) {
  const { data, error } = await supabase
    .from('barberias')
    .select(
      `
      id, slug, nombre, telefono_whatsapp, email_contacto, direccion, logo_url, estado_id,
      personalizacion (color_primario, color_header, fuente_display, eslogan, descripcion, banner_url, secciones),
      servicios (id, nombre, duracion_minutos, precio_clp, precio_oferta, oferta_activa, oferta_vence, activo),
      barberos (id, nombre, activo, foto_url, especialidad)
    `
    )
    .eq('slug', slug)
    .single()

  if (error) throw error
  return { ...data, personalizacion: normalizarPersonalizacion(data.personalizacion) }
}

export function useBarberiaPorSlug(slug) {
  return useQuery({
    queryKey: ['barberia', slug],
    queryFn: () => (HAY_BACKEND_REAL ? obtenerBarberiaPorSlug(slug) : obtenerBarberiaProvisoriaPorSlug(slug)),
    enabled: Boolean(slug),
  })
}
