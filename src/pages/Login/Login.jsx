import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useIsMobile } from '../../hooks/useIsMobile'
import { rutaPorRol } from '../../utils/roles'
import { Loader } from '../../components/common/Loader'
import { LoginDesktop } from './desktop/LoginDesktop'
import { LoginMobile } from './mobile/LoginMobile'

// Orquestador: decide si renderizar la composición desktop o la móvil (cada
// una es una pieza propia, no la misma achicada — ver desktop/LoginDesktop.jsx
// y mobile/LoginMobile.jsx) y maneja los dos estados que son de la pantalla
// en sí, no del formulario: verificar sesión existente, y redirigir si ya hay
// una activa. useIsMobile reacciona en vivo a resize/rotación de pantalla.
export function Login() {
  const { autenticado, perfil, cargando: verificandoSesion } = useAuth()
  const esMobile = useIsMobile()
  const navigate = useNavigate()

  useEffect(() => {
    if (autenticado && perfil) {
      navigate(rutaPorRol(perfil.rol_id), { replace: true })
    }
  }, [autenticado, perfil, navigate])

  if (verificandoSesion || (autenticado && perfil)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hueso">
        <Loader label="Verificando sesión" />
      </div>
    )
  }

  return esMobile ? <LoginMobile /> : <LoginDesktop />
}
