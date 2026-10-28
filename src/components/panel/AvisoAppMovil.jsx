import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useInstalacionApp } from '../../hooks/useModoApp'
import { ES_APP_INSTALADA, ES_IOS, activarPush, pushActivo, soportaPush } from '../../services/pushService'
import { HAY_BACKEND_REAL } from '../../mocks/datosProvisoriosSuperadmin'
import { ROL_SUPERADMIN } from '../../utils/roles'
import { IconoCampana, IconoCompartirIOS } from './IconosNav'
import { IconoX } from './IconoX'

const CLAVE_OCULTO = 'booking_barber_aviso_app_oculto'

function leerOculto() {
  try {
    return sessionStorage.getItem(CLAVE_OCULTO) === '1'
  } catch {
    return false
  }
}

// Guía en 2 pasos dentro del panel (solo celular): primero instalar la app,
// después activar las notificaciones de reserva nueva. "Ahora no" lo esconde
// solo por esta sesión — vuelve a aparecer la próxima vez que se abra el
// panel hasta que el paso esté hecho.
export function AvisoAppMovil() {
  const { perfil } = useAuth()
  const { puedeInstalar, instalar } = useInstalacionApp()
  const [oculto, setOculto] = useState(leerOculto)
  const [pushListo, setPushListo] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState(null)

  const recibeReservas = perfil && perfil.rol_id !== ROL_SUPERADMIN
  const puedeActivarPush = HAY_BACKEND_REAL && recibeReservas && soportaPush()

  useEffect(() => {
    if (!puedeActivarPush) return
    pushActivo()
      .then(setPushListo)
      .catch(() => setPushListo(false))
  }, [puedeActivarPush])

  function ocultar() {
    try {
      sessionStorage.setItem(CLAVE_OCULTO, '1')
    } catch {
      /* sin sessionStorage el aviso solo se oculta hasta recargar */
    }
    setOculto(true)
  }

  async function alActivarPush() {
    setProcesando(true)
    setError(null)
    try {
      await activarPush()
      setPushListo(true)
    } catch (err) {
      setError(
        err.message === 'denegado'
          ? 'Las notificaciones están bloqueadas. Actívalas en Ajustes → Booking Barber → Notificaciones.'
          : 'No se pudieron activar. Intenta de nuevo.'
      )
    } finally {
      setProcesando(false)
    }
  }

  if (oculto) return null

  let contenido = null

  if (!ES_APP_INSTALADA) {
    contenido = (
      <>
        <p className="font-display text-lg leading-snug">Instala la app</p>
        <p className="mt-1 text-[15px] leading-relaxed text-gris-calido-200">
          Abre tu panel desde la pantalla de inicio, como cualquier app
          {recibeReservas ? ', y recibe un aviso con cada reserva nueva.' : '.'}
        </p>
        {puedeInstalar ? (
          <button
            type="button"
            onClick={instalar}
            className="mt-4 min-h-12 w-full rounded-xl bg-cobre text-base font-semibold text-hueso active:brightness-90"
          >
            Instalar app
          </button>
        ) : ES_IOS ? (
          <ol className="mt-4 flex flex-col gap-2.5 text-[15px] text-hueso">
            <li className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm">1</span>
              <span className="flex items-center gap-1.5">
                Toca <IconoCompartirIOS className="h-5 w-5 text-cobre-claro" /> <strong>Compartir</strong> en Safari
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm">2</span>
              <span>
                Elige <strong>Agregar a inicio</strong>
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm">3</span>
              <span>Abre la app desde tu pantalla de inicio</span>
            </li>
          </ol>
        ) : (
          <p className="mt-3 text-[15px] text-hueso">
            Abre el menú <strong>⋮</strong> del navegador y elige <strong>Instalar app</strong> o{' '}
            <strong>Agregar a pantalla de inicio</strong>.
          </p>
        )}
      </>
    )
  } else if (puedeActivarPush && pushListo === false) {
    contenido = (
      <>
        <p className="flex items-center gap-2 font-display text-lg leading-snug">
          <IconoCampana className="h-6 w-6 text-cobre-claro" />
          Activa las notificaciones
        </p>
        <p className="mt-1 text-[15px] leading-relaxed text-gris-calido-200">
          Te avisamos al instante cuando un cliente reserva: nombre, servicio y hora.
        </p>
        <button
          type="button"
          onClick={alActivarPush}
          disabled={procesando}
          className="mt-4 min-h-12 w-full rounded-xl bg-cobre text-base font-semibold text-hueso active:brightness-90 disabled:opacity-70"
        >
          {procesando ? 'Activando…' : 'Activar notificaciones'}
        </button>
        {error && <p className="mt-2 text-sm text-cobre-claro">{error}</p>}
      </>
    )
  }

  if (!contenido) return null

  return (
    <div className="relative mb-6 rounded-2xl bg-negro-barbero p-5 pr-12 text-hueso shadow-lg md:hidden">
      <button
        type="button"
        onClick={ocultar}
        aria-label="Ahora no"
        className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full text-gris-calido-400 active:bg-white/10"
      >
        <IconoX className="h-4 w-4" />
      </button>
      {contenido}
    </div>
  )
}
