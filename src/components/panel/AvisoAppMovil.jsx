import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useInstalacionApp } from '../../hooks/useModoApp'
import { ES_APP_INSTALADA, ES_IOS, activarPush, pushActivo, soportaPush } from '../../services/pushService'
import { HAY_BACKEND_REAL } from '../../mocks/datosProvisoriosSuperadmin'
import { ROL_SUPERADMIN } from '../../utils/roles'
import { IconoCampana, IconoCompartirIOS } from './IconosNav'
import { IconoX } from './IconoX'

const CLAVE_OCULTO_HASTA = 'booking_barber_aviso_app_oculto_hasta'
const DIAS_OCULTO = 3

function leerOculto() {
  try {
    return Number(localStorage.getItem(CLAVE_OCULTO_HASTA) || 0) > Date.now()
  } catch {
    return false
  }
}

// Guía en 2 pasos dentro del panel (solo celular): primero instalar la app,
// después activar las notificaciones de reserva nueva.
// - Si el teléfono ya dio permiso de notificaciones (ej. volvió a entrar
//   después de cerrar sesión, que borra la suscripción), se vuelve a
//   suscribir solo, sin preguntar ni mostrar nada.
// - Si el permiso está bloqueado, no se insiste: solo se puede cambiar
//   desde Ajustes, y eso se explica en Configuración.
// - "Ahora no" lo esconde por unos días, no para siempre.
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
    let activo = true
    const marcar = (valor) => activo && setPushListo(valor)
    async function revisar() {
      if (Notification.permission === 'denied') return marcar(true)
      if (await pushActivo()) return marcar(true)
      if (Notification.permission === 'granted') {
        // Permiso ya concedido: activar no muestra ningún diálogo.
        await activarPush()
        return marcar(true)
      }
      marcar(false)
    }
    revisar().catch(() => marcar(false))
    return () => {
      activo = false
    }
  }, [puedeActivarPush])

  function ocultar() {
    try {
      localStorage.setItem(CLAVE_OCULTO_HASTA, String(Date.now() + DIAS_OCULTO * 86_400_000))
    } catch {
      /* sin localStorage el aviso solo se oculta hasta recargar */
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
        <p className="text-base font-semibold leading-snug">Instala la app</p>
        <p className="mt-0.5 text-sm leading-snug text-gris-calido-200">
          {recibeReservas ? 'Tu panel en la pantalla de inicio y avisos de cada reserva.' : 'Tu panel en la pantalla de inicio.'}
        </p>
        {puedeInstalar ? (
          <button
            type="button"
            onClick={instalar}
            className="mt-3 min-h-12 w-full rounded-xl bg-cobre text-base font-semibold text-hueso active:brightness-90"
          >
            Instalar app
          </button>
        ) : ES_IOS ? (
          <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-xl bg-white/8 px-3 py-2.5 text-[15px] text-hueso">
            Toca <IconoCompartirIOS className="h-5 w-5 text-cobre-claro" /> <strong>Compartir</strong> →{' '}
            <strong>Agregar a inicio</strong>
          </p>
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
        <p className="flex items-center gap-2 text-base font-semibold leading-snug">
          <IconoCampana className="h-5 w-5 text-cobre-claro" />
          Activa las notificaciones
        </p>
        <p className="mt-0.5 text-sm leading-snug text-gris-calido-200">
          Te avisamos al instante cuando un cliente reserva: nombre, servicio y hora.
        </p>
        <button
          type="button"
          onClick={alActivarPush}
          disabled={procesando}
          className="mt-3 min-h-12 w-full rounded-xl bg-cobre text-base font-semibold text-hueso active:brightness-90 disabled:opacity-70"
        >
          {procesando ? 'Activando…' : 'Activar notificaciones'}
        </button>
        {error && <p className="mt-2 text-sm text-cobre-claro">{error}</p>}
      </>
    )
  }

  if (!contenido) return null

  return (
    <div className="relative mb-5 rounded-2xl bg-negro-barbero p-4 pr-11 text-hueso shadow-lg md:hidden">
      <button
        type="button"
        onClick={ocultar}
        aria-label="Ahora no"
        className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-gris-calido-400 active:bg-white/10"
      >
        <IconoX className="h-4 w-4" />
      </button>
      {contenido}
    </div>
  )
}
