import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import {
  HAY_BACKEND_REAL,
  obtenerBarberiaProvisoria,
  crearCuentaDuenoProvisoria,
  establecerContrasenaDuenoProvisoria,
  eliminarCuentaDuenoProvisoria,
} from '../../../mocks/datosProvisoriosSuperadmin'
import {
  crearCuentaDueno,
  crearCuentaBarbero,
  resetearPasswordUsuario,
  eliminarCuentaUsuario,
} from '../../../services/usuariosService'

function clave(barberiaId) {
  return ['cuenta_dueno', barberiaId]
}

// En el esquema real la cuenta de dueño es una fila en `usuarios` (rol_id=2)
// ligada por `barberia_id` — a diferencia del modo provisorio, donde vive
// como campos sueltos (`usuario_dueno`/`nombre_dueno`) directo en la
// barbería, por simplicidad.
async function obtenerCuentaDuenoReal(barberiaId) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, usuario, nombre')
    .eq('barberia_id', barberiaId)
    .eq('rol_id', 2)
    .maybeSingle()
  if (error) throw error
  return data
}

async function obtenerCuentaDuenoMock(barberiaId) {
  const barberia = await obtenerBarberiaProvisoria(barberiaId)
  if (!barberia.usuario_dueno) return null
  return { id: null, usuario: barberia.usuario_dueno, nombre: barberia.nombre_dueno }
}

export function useCuentaDueno(barberiaId) {
  return useQuery({
    queryKey: clave(barberiaId),
    queryFn: () => (HAY_BACKEND_REAL ? obtenerCuentaDuenoReal(barberiaId) : obtenerCuentaDuenoMock(barberiaId)),
    enabled: Boolean(barberiaId),
  })
}

export function useCrearCuentaDueno(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ nombre, password }) => {
      if (!HAY_BACKEND_REAL) return crearCuentaDuenoProvisoria(barberiaId, { nombre, password })
      return crearCuentaDueno({ barberiaId, nombre, password })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}

export function useEstablecerPasswordDueno(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ password }) => {
      if (!HAY_BACKEND_REAL) return establecerContrasenaDuenoProvisoria(barberiaId, password)
      const cuenta = await obtenerCuentaDuenoReal(barberiaId)
      if (!cuenta) throw new Error('Esta barbería todavía no tiene cuenta de dueño.')
      return resetearPasswordUsuario({ usuarioId: cuenta.id, password })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}

// Le crea el login a un barbero que ya existe pero todavía no tiene cuenta
// (por ejemplo, uno cargado antes de que este sistema existiera) — distinto
// de `useCrearBarbero`, que crea el barbero Y la cuenta juntos de una.
export function useCrearCuentaBarbero(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ barberoId, nombre, password }) => {
      if (!HAY_BACKEND_REAL) {
        throw new Error('En modo de prueba todo barbero se crea junto con su cuenta.')
      }
      return crearCuentaBarbero({ barberiaId, barberoId, nombre, password })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['barberos_admin', barberiaId] }),
  })
}

export function useEliminarCuentaDueno(barberiaId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      if (!HAY_BACKEND_REAL) return eliminarCuentaDuenoProvisoria(barberiaId)
      const cuenta = await obtenerCuentaDuenoReal(barberiaId)
      if (!cuenta) throw new Error('Esta barbería no tiene cuenta de dueño.')
      return eliminarCuentaUsuario({ usuarioId: cuenta.id })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave(barberiaId) }),
  })
}
