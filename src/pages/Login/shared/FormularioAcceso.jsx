import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { esquemaLogin } from './esquemaLogin'
import { useLogin } from './useLogin'
import { IconoOjo } from './IconoOjo'
import { Button } from '../../../components/common/Button'
import { IconoGoogle } from '../../../components/common/IconoGoogle'
import { linkWhatsApp } from '../../../utils/formatos'
import { iniciarSesionConGoogle } from '../../../services/authService'
import { HAY_BACKEND_REAL, ADMIN_PROVISORIO, SUPERADMIN_PROVISORIO } from '../../../mocks/datosProvisoriosSuperadmin'

const NUMERO_CONTACTO = import.meta.env.VITE_WHATSAPP_CONTACTO

// Mismo motivo que el Loader de identidad (navaja abriéndose/cerrándose),
// en versión chica para vivir dentro del botón — nunca un spinner genérico.
function IndicadorCargaBoton() {
  return (
    <svg width="18" height="18" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="13" y="12" width="11" height="4" rx="1.5" fill="#f3eee3" opacity="0.35" />
      <motion.g
        style={{ originX: '14px', originY: '14px' }}
        animate={{ rotate: [-38, 4, -38] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="13" y="12.5" width="10.5" height="3.5" rx="1.5" fill="#f3eee3" />
        <circle cx="14" cy="14" r="3" fill="#7a4324" />
      </motion.g>
    </svg>
  )
}

// Cuánto se espera sin que el usuario tipee antes de considerar que dejó de
// escribir y el carrusel puede retomar — evita que un tipeo intermitente
// (pensando la contraseña, revisando el usuario) haga pestañear la rotación.
const RETOMAR_TRAS_INACTIVIDAD_MS = 1200

// Todo lo que la pantalla de login necesita, en un solo componente que usan
// tanto la composición desktop como la mobile. Expone dos señales distintas
// hacia afuera, a propósito — no son lo mismo:
// - `onCambioFoco`: hay foco en ALGÚN campo (dispara con el autoFocus inicial
//   y se mantiene mientras el usuario sigue dentro del formulario). La usa
//   mobile para achicar el panel de imagen en cuanto se abre el teclado.
// - `onEscribiendo`: el usuario está tipeando activamente (con un margen de
//   inactividad antes de apagarse). La usa el carrusel para pausarse — atarlo
//   a `onCambioFoco` en vez de esto fue el bug original: con autoFocus en el
//   campo de usuario, el formulario queda "enfocado" desde el segundo cero, y
//   el carrusel nunca llegaba a arrancar.
export function FormularioAcceso({ onCambioFoco, onEscribiendo, compacto = false, className = '' }) {
  const { enviar, enviando, error } = useLogin()
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [bloqMayusActivo, setBloqMayusActivo] = useState(false)
  const [mostrarAyudaRecuperar, setMostrarAyudaRecuperar] = useState(false)
  const [enviandoGoogle, setEnviandoGoogle] = useState(false)
  const [errorGoogle, setErrorGoogle] = useState(null)
  const formularioRef = useRef(null)
  const timeoutEscrituraRef = useRef(null)

  useEffect(() => () => clearTimeout(timeoutEscrituraRef.current), [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(esquemaLogin) })

  function avisarFoco() {
    onCambioFoco?.(true)
  }

  function avisarPosibleDesenfoque() {
    // Se espera un frame: si el foco pasó a OTRO campo del mismo formulario
    // (ej. Tab de usuario a contraseña), no se avisa desenfoque — evita que
    // el panel de imagen en mobile se expanda y colapse entre campo y campo.
    requestAnimationFrame(() => {
      if (!formularioRef.current) return
      if (!formularioRef.current.contains(document.activeElement)) {
        onCambioFoco?.(false)
      }
    })
  }

  function manejarTecladoPassword(evento) {
    if (typeof evento.getModifierState === 'function') {
      setBloqMayusActivo(evento.getModifierState('CapsLock'))
    }
  }

  function manejarEscritura() {
    onEscribiendo?.(true)
    clearTimeout(timeoutEscrituraRef.current)
    timeoutEscrituraRef.current = setTimeout(() => onEscribiendo?.(false), RETOMAR_TRAS_INACTIVIDAD_MS)
  }

  async function alEnviar(datos) {
    await enviar(datos)
  }

  async function alEntrarConGoogle() {
    setEnviandoGoogle(true)
    setErrorGoogle(null)
    try {
      await iniciarSesionConGoogle()
      // Si no tira error, el navegador ya está siendo redirigido a Google —
      // no hay nada más que hacer acá.
    } catch {
      setErrorGoogle('No pudimos conectar con Google. Intenta de nuevo.')
      setEnviandoGoogle(false)
    }
  }

  return (
    <form
      ref={formularioRef}
      onSubmit={handleSubmit(alEnviar)}
      onFocus={avisarFoco}
      onBlur={avisarPosibleDesenfoque}
      onInput={manejarEscritura}
      noValidate
      className={`flex flex-col ${compacto ? 'gap-3' : 'gap-6'} ${className}`}
    >
      <label className="flex flex-col gap-2">
        <span className="versalitas text-xs text-gris-calido-500">Usuario</span>
        <input
          {...register('usuario')}
          type="text"
          autoComplete="username"
          autoFocus
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
        <div className="relative flex items-center">
          <input
            {...register('password')}
            type={mostrarPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            onKeyUp={manejarTecladoPassword}
            onKeyDown={manejarTecladoPassword}
            className="min-h-11 w-full border-b border-gris-calido-200 bg-transparent py-2 pr-9 text-base text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
          <button
            type="button"
            onClick={() => setMostrarPassword((actual) => !actual)}
            aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-0 flex h-11 w-9 items-center justify-center text-gris-calido-500 transition-colors hover:text-cobre-texto"
          >
            <IconoOjo abierto={mostrarPassword} className="h-5 w-5" />
          </button>
        </div>
        {bloqMayusActivo && (
          <span className="versalitas text-xs text-cobre-texto">Bloq Mayús activado</span>
        )}
        {errors.password && (
          <span role="alert" className="text-xs text-red-700">
            {errors.password.message}
          </span>
        )}
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error.mensaje}
        </p>
      )}

      <Button as="button" type="submit" disabled={enviando} className="mt-1 w-full disabled:opacity-70">
        <span className="flex items-center justify-center gap-2">
          {enviando && <IndicadorCargaBoton />}
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </span>
      </Button>

      {/* Solo tiene sentido con Supabase real conectado — en modo de prueba
          no hay OAuth de verdad contra el que autenticarse. */}
      {HAY_BACKEND_REAL && (
        <>
          <Button
            as="button"
            type="button"
            onClick={alEntrarConGoogle}
            disabled={enviandoGoogle}
            className="w-full border border-gris-calido-200 !bg-white !text-negro-barbero hover:!brightness-100 hover:border-gris-calido-500 disabled:opacity-70"
          >
            <span className="flex items-center justify-center gap-2">
              {/* Sin IndicadorCargaBoton acá: está pensado en tonos claros
                  para el botón oscuro de arriba, invisible sobre blanco. */}
              {!enviandoGoogle && <IconoGoogle className="h-5 w-5" />}
              {enviandoGoogle ? 'Conectando…' : 'Iniciar sesión con Google'}
            </span>
          </Button>
          {errorGoogle && (
            <p role="alert" className="text-center text-sm text-red-700">
              {errorGoogle}
            </p>
          )}
        </>
      )}

      {/* Solo mientras no hay Supabase real conectado — se apaga sola junto
          con el resto del modo provisorio (ver datosProvisoriosSuperadmin.js). */}
      {!HAY_BACKEND_REAL && (
        <p className="versalitas text-center text-xs text-gris-calido-400">
          Modo de prueba — dueño: {ADMIN_PROVISORIO.usuario} / {ADMIN_PROVISORIO.password_provisoria} · superadmin:{' '}
          {SUPERADMIN_PROVISORIO.usuario} / {SUPERADMIN_PROVISORIO.password_provisoria}
        </p>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMostrarAyudaRecuperar((actual) => !actual)}
          className="min-h-11 text-sm text-gris-calido-500 underline-offset-2 hover:text-cobre-texto hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </button>
        {mostrarAyudaRecuperar && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="mt-2 text-xs leading-relaxed text-gris-calido-500"
          >
            Por ahora, pide a quien administra tu barbería que actualice tu
            contraseña desde el panel.
            {NUMERO_CONTACTO && (
              <>
                {' '}
                Si no puedes contactarlo,{' '}
                <a
                  href={linkWhatsApp(NUMERO_CONTACTO, 'Hola, necesito ayuda para ingresar a mi cuenta de booking.barber.cl')}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cobre-texto underline"
                >
                  escríbenos por WhatsApp
                </a>
                .
              </>
            )}
          </motion.p>
        )}
      </div>
    </form>
  )
}
