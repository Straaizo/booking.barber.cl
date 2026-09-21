import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { IconoCandado } from '../components/panel/IconoCandado'
import { CampoCodigoOTP } from '../components/common/CampoCodigoOTP'
import { confirmarCodigo } from '../services/mfaService'

// Se muestra en vez del panel cuando la cuenta (superadmin, ver
// RutaProtegida) tiene la verificación en dos pasos activada pero esta
// sesión todavía no pasó por ella — pasa una vez por sesión, no en cada
// página: una vez confirmado el código, Supabase deja la sesión en aal2 y
// no se vuelve a pedir hasta el próximo login real.
//
// `intento` como `key` del campo: al fallar un código, se remonta
// CampoCodigoOTP entero (en vez de limpiarlo a mano) — vuelve con los 6
// cuadros vacíos y el foco en el primero, listo para reintentar.
export function DesafioMFA({ factorId, onVerificado }) {
  const { cerrarSesion } = useAuth()
  const [error, setError] = useState(null)
  const [verificando, setVerificando] = useState(false)
  const [intento, setIntento] = useState(0)

  async function confirmar(codigo) {
    setError(null)
    setVerificando(true)
    try {
      await confirmarCodigo(factorId, codigo)
      onVerificado()
    } catch {
      setError('Código incorrecto. Intenta de nuevo.')
      setVerificando(false)
      setIntento((n) => n + 1)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-hueso px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.07] blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--color-cobre) 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm text-center">
        <span className="font-display inline-block text-lg italic tracking-tight text-negro-barbero">
          booking<span className="text-cobre-claro">.</span>barber.cl
        </span>

        <div className="mt-10 flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-cobre/30 bg-cobre/5">
            <IconoCandado className="h-6 w-6 text-cobre" />
          </span>
        </div>

        <span className="versalitas mt-6 block text-xs text-cobre-texto">— Verificación de seguridad</span>
        <h1 className="font-display mt-2 text-2xl font-light tracking-tight text-negro-barbero">
          Verificación en dos pasos
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-gris-calido-500">
          Ingresa el código de 6 dígitos de tu app de autenticación.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <CampoCodigoOTP
            key={intento}
            onCompleto={confirmar}
            deshabilitado={verificando}
          />
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          {verificando && <p className="versalitas text-xs text-gris-calido-400">Verificando…</p>}
        </div>

        <button
          type="button"
          onClick={cerrarSesion}
          className="versalitas mt-8 text-xs text-gris-calido-500 hover:text-negro-barbero"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
