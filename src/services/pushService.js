import { supabase } from './supabaseClient'

// Web Push del panel (reserva nueva → barbero asignado + dueño). La
// suscripción se guarda en `suscripciones_push`; quien envía es la Edge
// Function `notificar-reserva`, nunca el navegador.
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

export const ES_APP_INSTALADA =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)

export const ES_IOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

export function soportaPush() {
  return Boolean(VAPID_PUBLIC_KEY) && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null)
  return navigator.serviceWorker.register('/sw.js').catch((error) => {
    console.error('No se pudo registrar el service worker', error)
    return null
  })
}

function claveABytes(base64) {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4)
  const crudo = atob((base64 + relleno).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(crudo, (c) => c.charCodeAt(0))
}

async function suscripcionActual() {
  const registro = await navigator.serviceWorker.getRegistration('/')
  return registro ? registro.pushManager.getSubscription() : null
}

export async function pushActivo() {
  if (!soportaPush() || Notification.permission !== 'granted') return false
  return Boolean(await suscripcionActual())
}

export async function activarPush() {
  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') throw new Error(permiso === 'denied' ? 'denegado' : 'cancelado')

  await registrarServiceWorker()
  const registro = await navigator.serviceWorker.ready
  const suscripcion =
    (await registro.pushManager.getSubscription()) ??
    (await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: claveABytes(VAPID_PUBLIC_KEY),
    }))

  const { endpoint, keys } = suscripcion.toJSON()
  const { error } = await supabase.rpc('registrar_suscripcion_push', {
    p_endpoint: endpoint,
    p_p256dh: keys.p256dh,
    p_auth: keys.auth,
  })
  if (error) throw error
}

// También se llama al cerrar sesión: un celular compartido no debe seguir
// recibiendo las reservas de la cuenta que salió.
export async function desactivarPush() {
  if (!('serviceWorker' in navigator)) return
  const suscripcion = await suscripcionActual()
  if (!suscripcion) return
  const { error } = await supabase.from('suscripciones_push').delete().eq('endpoint', suscripcion.endpoint)
  await suscripcion.unsubscribe()
  if (error) throw error
}
