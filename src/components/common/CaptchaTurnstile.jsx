import { useEffect, useRef } from 'react'

// Cloudflare Turnstile — verifica que quien reserva no es un bot, casi
// siempre sin pedirle nada a la persona (`interaction-only`: el cuadro solo
// aparece si Cloudflare necesita una confirmación extra). El token que
// entrega se valida en el servidor (Edge Function `crear-reserva`) y sirve
// una sola vez — por eso, tras cada intento de reserva, quien lo usa cambia
// la `key` de este componente para pedir uno nuevo.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY
const URL_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let cargaScript = null

function cargarTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (!cargaScript) {
    cargaScript = new Promise((resolver, rechazar) => {
      const script = document.createElement('script')
      script.src = URL_SCRIPT
      script.async = true
      script.onload = () => resolver(window.turnstile)
      script.onerror = () => {
        cargaScript = null
        rechazar(new Error('No se pudo cargar la verificación.'))
      }
      document.head.appendChild(script)
    })
  }
  return cargaScript
}

export function CaptchaTurnstile({ onToken, onError }) {
  const contenedor = useRef(null)

  useEffect(() => {
    let widgetId = null
    let activo = true

    cargarTurnstile()
      .then((turnstile) => {
        if (!activo || !contenedor.current) return
        widgetId = turnstile.render(contenedor.current, {
          sitekey: SITE_KEY,
          appearance: 'interaction-only',
          language: 'es',
          callback: (token) => onToken(token),
          'expired-callback': () => onToken(null),
          'error-callback': () => {
            onToken(null)
            onError?.()
          },
        })
      })
      .catch(() => activo && onError?.())

    return () => {
      activo = false
      try {
        if (widgetId !== null) window.turnstile?.remove(widgetId)
      } catch {
        /* el widget ya no existe — nada que limpiar */
      }
    }
    // Se monta una vez por `key` — ver comentario de arriba.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={contenedor} />
}
