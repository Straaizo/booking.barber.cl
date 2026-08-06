import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'

function claveServicios(barberiaId) {
  return ['servicios_panel', barberiaId]
}

async function obtenerServicios(barberiaId) {
  const { data, error } = await supabase
    .from('servicios')
    .select('id, nombre, duracion_minutos, precio_clp, precio_oferta, oferta_activa, activo')
    .eq('barberia_id', barberiaId)
    .order('nombre')

  if (error) throw error
  return data
}

export function useServiciosDeBarberia(barberiaId) {
  return useQuery({
    queryKey: claveServicios(barberiaId),
    queryFn: () => obtenerServicios(barberiaId),
    enabled: Boolean(barberiaId),
  })
}

async function actualizarServicio({ id, cambios }) {
  const { data, error } = await supabase
    .from('servicios')
    .update(cambios)
    .eq('id', id)
    .select('id, nombre, duracion_minutos, precio_clp, precio_oferta, oferta_activa, activo')
    .single()

  if (error) throw error
  return data
}

// Solo permite tocar precio_clp / precio_oferta / oferta_activa — es el
// contrato que respeta el rol barbero según las políticas de la base de
// datos; el resto de las columnas de `servicios` viaja intacto.
export function useActualizarPrecioServicio(barberiaId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: actualizarServicio,
    onMutate: async ({ id, cambios }) => {
      await queryClient.cancelQueries({ queryKey: claveServicios(barberiaId) })
      const anterior = queryClient.getQueryData(claveServicios(barberiaId))

      queryClient.setQueryData(claveServicios(barberiaId), (actual) =>
        actual?.map((servicio) => (servicio.id === id ? { ...servicio, ...cambios } : servicio))
      )

      return { anterior }
    },
    onError: (_error, _variables, contexto) => {
      if (contexto?.anterior) {
        queryClient.setQueryData(claveServicios(barberiaId), contexto.anterior)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: claveServicios(barberiaId) })
    },
  })
}
