import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../hooks/useAuth'
import { esquemaLogin } from './esquemaLogin'
import { rutaPorRol } from '../../utils/roles'
import { Button } from '../../components/common/Button'
import { HoverLink } from '../../components/common/HoverLink'
import { Loader } from '../../components/common/Loader'
import { TextReveal } from '../../components/animations/TextReveal'
import { StaticBarberPoleIllustration } from '../../components/animations/StaticBarberPoleIllustration'

export function Login() {
  const { iniciarSesion, autenticado, perfil, cargando: verificandoSesion } = useAuth()
  const navigate = useNavigate()
  const [errorEnvio, setErrorEnvio] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(esquemaLogin) })

  useEffect(() => {
    if (autenticado && perfil) {
      navigate(rutaPorRol(perfil.rol_id), { replace: true })
    }
  }, [autenticado, perfil, navigate])

  async function onSubmit(datos) {
    setErrorEnvio(null)
    try {
      await iniciarSesion(datos)
    } catch (error) {
      setErrorEnvio(error.message)
    }
  }

  if (verificandoSesion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hueso">
        <Loader label="Verificando sesión" />
      </div>
    )
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative flex flex-col justify-between overflow-hidden bg-negro-barbero px-6 py-10 text-hueso md:px-14 md:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 top-1/3 h-72 w-72 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #A85C32 0%, transparent 70%)' }}
        />

        <HoverLink href="/" className="relative w-fit font-display text-lg italic tracking-tight">
          booking<span className="text-cobre">.</span>barber.cl
        </HoverLink>

        <div className="relative mt-10 flex flex-1 items-center gap-6 md:mt-0 md:flex-col md:items-start md:justify-center md:gap-10">
          <StaticBarberPoleIllustration className="h-32 w-auto shrink-0 md:h-48" />
          <TextReveal
            texto="Tu panel, *con hora propia* también."
            as="h1"
            className="max-w-sm text-2xl font-light leading-[1.15] tracking-tight md:text-4xl"
          />
        </div>

        <p className="versalitas relative hidden text-xs text-gris-calido-400 md:block">
          Un proyecto de Emia Studios
        </p>
      </div>

      <div className="flex items-center justify-center bg-hueso px-6 py-14 md:px-14">
        <div className="w-full max-w-sm">
          <span className="versalitas text-xs text-cobre">— Acceso al panel</span>
          <h2 className="font-display mt-2 text-3xl font-light tracking-tight text-negro-barbero">
            Ingresar
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-9 flex flex-col gap-6">
            <label className="flex flex-col gap-2">
              <span className="versalitas text-xs text-gris-calido-500">Usuario</span>
              <input
                {...register('usuario')}
                type="text"
                autoComplete="username"
                placeholder="tu.usuario"
                className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-base text-negro-barbero outline-none transition-colors focus:border-cobre"
              />
              {errors.usuario && (
                <span role="alert" className="text-xs text-red-700">
                  {errors.usuario.message}
                </span>
              )}
            </label>

            <label className="flex flex-col gap-2">
              <span className="versalitas text-xs text-gris-calido-500">Contraseña</span>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-base text-negro-barbero outline-none transition-colors focus:border-cobre"
              />
              {errors.password && (
                <span role="alert" className="text-xs text-red-700">
                  {errors.password.message}
                </span>
              )}
            </label>

            {errorEnvio && (
              <p role="alert" className="text-sm text-red-700">
                {errorEnvio}
              </p>
            )}

            <Button
              as="button"
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full disabled:opacity-60"
            >
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
