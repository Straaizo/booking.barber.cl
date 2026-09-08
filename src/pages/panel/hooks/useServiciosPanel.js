import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import { HAY_BACKEND_REAL, listarServiciosAdminProvisorios } from '../../../mocks/datosProvisoriosSuperadmin'
import { conBarberoIds } from '../../../utils/servicios'

const COLUMNAS =
  'id, nombre, descripcion, imagen_url, duracion_minutos, precio_clp, precio_oferta, oferta_activa, activo'

function claveServicios(barberoId) {
  return ['servicios_panel_barbero', barberoId]
}

// Lo que ve un barbero en su propia pestaña "Servicios": los compartidos (sin
// barberos asignados, para cualquiera) más los que el dueño le asignó a él
// puntualmente — siempre de solo lectura, el catálogo lo administra el dueño
// desde su panel (ver PanelServicios.jsx). Reemplaza al viejo "catálogo
// propio" editable por barbero, que se sacó del todo.
async function obtenerServiciosDelBarbero(barberiaId, barberoId) {
  const { data, error } = await supabase
    .from('servicios')
    .select(COLUMNAS)
    .eq('barberia_id', barberiaId)
    .order('nombre')

  if (error) throw error
  const servicios = await conBarberoIds(data)
  return servicios.filter((s) => s.barbero_ids.length === 0 || s.barbero_ids.includes(barberoId))
}

export function useServiciosDeBarberia(barberiaId, barberoId) {
  return useQuery({
    queryKey: claveServicios(barberoId),
    queryFn: () =>
      HAY_BACKEND_REAL
        ? obtenerServiciosDelBarbero(barberiaId, barberoId)
        : listarServiciosAdminProvisorios(barberiaId),
    enabled: Boolean(barberiaId && barberoId),
  })
}
