import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Loader } from '../components/common/Loader'
import { rutaPorRol } from '../utils/roles'

export function RutaProtegida({ rolesPermitidos }) {
  const { autenticado, perfil, cargando } = useAuth()
  const ubicacion = useLocation()

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hueso">
        <Loader label="Verificando sesión" />
      </div>
    )
  }

  if (!autenticado) {
    return <Navigate to="/login" state={{ desde: ubicacion.pathname }} replace />
  }

  if (!rolesPermitidos.includes(perfil.rol_id)) {
    return <Navigate to={rutaPorRol(perfil.rol_id)} replace />
  }

  return <Outlet />
}
