import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import {
  HAY_BACKEND_REAL,
  listarBarberosProvisorios,
  crearBarberoProvisorio,
  actualizarBarberoProvisorio,
  darDeBajaBarberoProvisorio,
  establecerContrasenaBarberoProvisoria,
  eliminarCuentaBarberoProvisoria,
  activarCatalogoPropioProvisorio,
  desactivarCatalogoPropioProvisorio,
} from '../../../mocks/datosProvisoriosSuperadmin'
import { crearCuentaBarbero, resetearPasswordUsuario, eliminarCuentaUsuario } from '../../../services/usuariosService'
import { comoColumnasReales } from '../../../utils/booleanosReales'

// Busca el id de la cuenta (`usuarios.id`) ligada a un barbero — hace falta
// para resetear la contraseña o borrar la cuenta, porque la Edge Function
// trabaja sobre `usuarios.id`, no sobre `barberos.id`.
async function idDeCuentaDelBarbero(barberoId) {
  const { data, error } = await supabase.from('usuarios').select('id').eq('barbero_id', barberoId).single()
  if (error) throw error
  return data.id
}

const COLUMNAS = 'id, nombre, activo, foto_url, especialidad, usa_catalogo_propio, intervalo_reserva_minutos'

function clave(barberiaId) {
  return ['barberos_admin', barberiaId]
}

// Dos consultas, no un embed `usuarios (usuario)` — PostgREST no arma el
// embed automático porque la FK real (`usuarios_barbero_fk`) es compuesta
// (`barbero_id, barberia_id` juntas, ver 20260819120000_schema.sql), no una
// columna simple. Con el embed, TODO barbero volvía con `usuario: null` sin
// ningún error visible, aunque la cuenta existiera de verdad en `usuarios`
// — confirmado con una consulta directa a la base (Miguel Diaz sí tenía
// cuenta, "mdiaz", y el panel igual mostraba "+ Crear cuenta").
async function obtenerBarberos(barberiaId) {
  const { data: barberos, error } = await supabase
    .from('barberos')
    .select(COLUMNAS)
    .eq('barberia_id', barberiaId)
    .order('nombre')
  if (error) throw error
  if (barberos.length === 0) return []

  const { data: cuentas, error: errorCuentas } = await supabase
    .from('usuarios')
    .select('barbero_id, usuario')
    .in(
      'barbero_id',
      barberos.map((b) => b.id)
    )
  if (errorCuentas) throw errorCuentas

  const usuarioPorBarberoId = new Map(cuentas.map((c) => [c.barbero_id, c.usuario]))
  return barberos.map((b) => ({ ...b, usuario: usuarioPorBarberoId.get(b.id) ?? null }))
}

export function useBarberosAdmin(barberiaId) {
  return useQuery({
    queryKey: clave(barberiaId),
    queryFn: () =>
      HAY_BACKEND_REAL ? obtenerBarberos(barberiaId) : listarBarberosProvisorios(barberiaId),
    enabled: Boolean(barberiaId),
  })
}

export function useCrearBarbero(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ nombre, password }) => {
      if (!HAY_BACKEND_REAL) return crearBarberoProvisorio(barberiaId, nombre, password)

      const { data, error } = await supabase
        .from('barberos')
        .insert({ barberia_id: barberiaId, nombre, activo: 1 })
        .select(COLUMNAS)
        .single()
      if (error) throw error

      try {
        const cuenta = await crearCuentaBarbero({ barberiaId, barberoId: data.id, nombre, password })
        return { ...data, usuario: cuenta.usuario }
      } catch (errorCuenta) {
        // Si la cuenta no se pudo crear, no dejar un barbero sin forma de
        // entrar — se borra el registro recién creado y se avisa del error.
        await supabase.from('barberos').delete().eq('id', data.id)
        throw errorCuenta
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}

export function useActualizarBarbero(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, cambios }) => {
      if (!HAY_BACKEND_REAL) return actualizarBarberoProvisorio(barberiaId, id, cambios)
      const { data, error } = await supabase
        .from('barberos')
        .update(comoColumnasReales(cambios))
        .eq('id', id)
        .select(COLUMNAS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}

// "Dar de baja" es una baja LÓGICA — nunca un `.delete()` físico. Un barbero
// que se va se queda en la tabla (con `activo: 0` y sin cuenta), porque
// `reservas` referencia a `barberos` con una FK que ahora es `on delete
// restrict` (ver supabase/sql/000_schema.sql): borrarlo de verdad rompería
// (con toda razón) apenas tuviera una sola reserva en su historial. Sus
// horarios/excepciones/catálogo propio tampoco se tocan — quedan ahí, sin
// nadie mirándolos, por si el dueño lo reactiva más adelante.
export function useDarDeBajaBarbero(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (barberoId) => {
      if (!HAY_BACKEND_REAL) return darDeBajaBarberoProvisorio(barberiaId, barberoId)
      const { data: cuenta } = await supabase.from('usuarios').select('id').eq('barbero_id', barberoId).maybeSingle()
      if (cuenta) await eliminarCuentaUsuario({ usuarioId: cuenta.id })
      const { error } = await supabase.from('barberos').update({ activo: 0 }).eq('id', barberoId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}

// El dueño escribe la contraseña nueva a mano — nunca se la genera el sistema.
export function useEstablecerContrasenaBarbero(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ barberoId, password }) => {
      if (!HAY_BACKEND_REAL) return establecerContrasenaBarberoProvisoria(barberiaId, barberoId, password)
      const usuarioId = await idDeCuentaDelBarbero(barberoId)
      return resetearPasswordUsuario({ usuarioId, password })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}

// Borra solo el LOGIN del barbero (queda sin cuenta, pero sigue existiendo
// como barbero) — distinto de `useEliminarBarbero`, que borra todo. Pensado
// para el panel de superadmin.
export function useEliminarCuentaBarbero(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (barberoId) => {
      if (!HAY_BACKEND_REAL) return eliminarCuentaBarberoProvisoria(barberiaId, barberoId)
      const usuarioId = await idDeCuentaDelBarbero(barberoId)
      return eliminarCuentaUsuario({ usuarioId })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}

// Al activar "servicios propios" por primera vez, el barbero arranca con una
// COPIA editable del catálogo compartido (no de cero) — ver
// `activarCatalogoPropioProvisorio` para el detalle de por qué. Del lado
// real, como no hay una función de base de datos para esto todavía, se hace
// el mismo paso a mano: traer el catálogo compartido, insertar una copia con
// el `barbero_id` puesto, y recién ahí prender el flag.
export function useActivarCatalogoPropio(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (barberoId) => {
      if (!HAY_BACKEND_REAL) return activarCatalogoPropioProvisorio(barberiaId, barberoId)

      const { data: propios, error: errorPropios } = await supabase
        .from('servicios')
        .select('id')
        .eq('barbero_id', barberoId)
      if (errorPropios) throw errorPropios

      if (!propios || propios.length === 0) {
        const { data: compartidos, error: errorCompartidos } = await supabase
          .from('servicios')
          .select('nombre, duracion_minutos, precio_clp, precio_oferta, oferta_activa, oferta_vence, activo')
          .eq('barberia_id', barberiaId)
          .is('barbero_id', null)
        if (errorCompartidos) throw errorCompartidos

        if (compartidos?.length > 0) {
          const { error: errorCopia } = await supabase
            .from('servicios')
            .insert(compartidos.map((s) => ({ ...s, barberia_id: barberiaId, barbero_id: barberoId })))
          if (errorCopia) throw errorCopia
        }
      }

      const { data, error } = await supabase
        .from('barberos')
        .update({ usa_catalogo_propio: 1 })
        .eq('id', barberoId)
        .select(COLUMNAS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}

export function useDesactivarCatalogoPropio(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (barberoId) => {
      if (!HAY_BACKEND_REAL) return desactivarCatalogoPropioProvisorio(barberiaId, barberoId)
      const { data, error } = await supabase
        .from('barberos')
        .update({ usa_catalogo_propio: 0 })
        .eq('id', barberoId)
        .select(COLUMNAS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}
