import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useIsMobile } from '../../hooks/useIsMobile'
import { rutaPorRol } from '../../utils/roles'
import { Loader } from '../../components/common/Loader'
import { IconoErrorAnimado } from '../../components/common/IconoErrorAnimado'
import { ModalFormulario } from '../../components/panel/ModalFormulario'
import { linkWhatsApp } from '../../utils/formatos'
import { LoginDesktop } from './desktop/LoginDesktop'
import { LoginMobile } from './mobile/LoginMobile'

const NUMERO_CONTACTO = import.meta.env.VITE_WHATSAPP_CONTACTO

// Orquestador: decide si renderizar la composición desktop o la móvil (cada
// una es una pieza propia, no la misma achicada — ver desktop/LoginDesktop.jsx
// y mobile/LoginMobile.jsx) y maneja los dos estados que son de la pantalla
// en sí, no del formulario: verificar sesión existente, y redirigir si ya hay
// una activa. useIsMobile reacciona en vivo a resize/rotación de pantalla.
export function Login() {
  const { autenticado, perfil, cargando: verificandoSesion, errorPerfil, limpiarErrorPerfil } = useAuth()
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

  return (
    <>
      {esMobile ? <LoginMobile /> : <LoginDesktop />}
      <ModalFormulario
        abierto={Boolean(errorPerfil)}
        titulo="Error al iniciar sesión"
        onCerrar={limpiarErrorPerfil}
        ancho="md"
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <IconoErrorAnimado className="h-8 w-8" />
          {errorPerfil?.esGoogleSinVincular ? (
            <p className="text-lg font-medium leading-snug text-negro-barbero">
              No encontramos una cuenta en booking.barber.cl vinculada a esa cuenta de Google.
            </p>
          ) : (
            <p className="text-lg font-medium leading-snug text-negro-barbero">
              No pudimos verificar tu cuenta. Intenta de nuevo o contacta a quien administra tu barbería.
            </p>
          )}
          {NUMERO_CONTACTO && (
            <a
              href={linkWhatsApp(NUMERO_CONTACTO, 'Tengo problemas para entrar con mi cuenta')}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-cobre-texto underline-offset-2 hover:underline"
            >
              Contactar a soporte
            </a>
          )}
        </div>
      </ModalFormulario>
    </>
  )
}
