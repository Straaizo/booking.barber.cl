import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import {
  HAY_BACKEND_REAL,
  listarPlanesProvisorios,
  actualizarPrecioPlanProvisorio,
} from '../../../mocks/datosProvisoriosSuperadmin'

// El pricing público de la home (Pricing.jsx) está hardcodeado, no lee esta
// tabla — no hay alta automatizada de barberías, "Elegir" siempre lleva a
// hablar por WhatsApp. Esta tabla sigue viva para dos cosas: el selector de
// plan al crear/editar una barbería (usa `max_barberos` para el límite real,
// ver PanelSuperadminBarberias.jsx / PanelSuperadminBarberiaDetalle.jsx), y
// el precio, que el superadmin puede seguir ajustando acá — solo el precio,
// nunca el nombre ni el máximo de barberos ni crear un plan nuevo, ver
// PanelSuperadminPlanes.jsx.
const COLUMNAS = 'id, nombre, precio_clp, max_barberos, orden'
const CLAVE = ['planes_superadmin']

// Plan "Solo" (id 1) — discontinuado, ya no se ofrece a barberías nuevas.
// Se filtra acá (no se borra de la tabla) para no dejar huérfana ninguna
// barbería vieja que todavía tenga ese `plan_id`; solo deja de listarse en
// el panel de Precios y en los selectores de plan.
const ID_PLAN_DISCONTINUADO = 1

async function obtenerPlanes() {
  const { data, error } = await supabase
    .from('planes')
    .select(COLUMNAS)
    .neq('id', ID_PLAN_DISCONTINUADO)
    .order('orden')
  if (error) throw error
  return data
}

export function usePlanesSuperadmin() {
  return useQuery({ queryKey: CLAVE, queryFn: HAY_BACKEND_REAL ? obtenerPlanes : listarPlanesProvisorios })
}

export function useActualizarPrecioPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, precio_clp }) => {
      if (!HAY_BACKEND_REAL) return actualizarPrecioPlanProvisorio(id, precio_clp)
      const { data, error } = await supabase
        .from('planes')
        .update({ precio_clp })
        .eq('id', id)
        .select(COLUMNAS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  })
}
