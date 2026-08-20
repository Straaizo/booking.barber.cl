import { supabase } from './supabaseClient'

// Todas las operaciones que crean/cambian/borran una cuenta real (nunca solo
// una fila de negocio) pasan por la Edge Function `gestionar-usuario` — ver
// supabase/functions/gestionar-usuario/index.ts para el motivo exacto: crear
// o tocar una cuenta de Supabase Auth requiere la clave de servicio, que
// nunca puede vivir acá (código de navegador).
async function invocarGestionUsuario(body) {
  const { data, error } = await supabase.functions.invoke('gestionar-usuario', { body })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

// El `usuario` (nombre de login) no se manda: lo genera la Edge Function a
// partir de `nombre`, revisando unicidad contra la base real — ver
// supabase/functions/gestionar-usuario/index.ts.
export function crearCuentaDueno({ barberiaId, nombre, password }) {
  return invocarGestionUsuario({ accion: 'crear_dueno', barberiaId, nombre, password })
}

export function crearCuentaBarbero({ barberiaId, barberoId, nombre, password }) {
  return invocarGestionUsuario({ accion: 'crear_barbero', barberiaId, barberoId, nombre, password })
}

export function resetearPasswordUsuario({ usuarioId, password }) {
  return invocarGestionUsuario({ accion: 'resetear_password', usuarioId, password })
}

export function eliminarCuentaUsuario({ usuarioId }) {
  return invocarGestionUsuario({ accion: 'eliminar_cuenta', usuarioId })
}
