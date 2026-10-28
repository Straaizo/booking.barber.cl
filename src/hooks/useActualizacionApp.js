import { useEffect, useState } from 'react'

const CADA_CUANTO_MS = 15 * 60 * 1000
const CLAVE_RECARGA = 'booking_barber_recarga_version'

// La app instalada (sobre todo en iPhone) puede quedar abierta en segundo
// plano días enteros con el código viejo en memoria. Compara la versión con
// la que se compiló este JS (`__VERSION_APP__`, ver vite.config.js) con la
// publicada en `/version.json`.
// - Al abrir o volver a la app: si hay versión nueva se recarga sola, antes
//   de que la persona alcance a usarla. La sesión se mantiene (vive en el
//   almacenamiento del teléfono, no en la página), no hay que volver a entrar.
// - Mientras se está usando (revisión cada 15 min): solo se avisa, para no
//   recargar en medio de algo que la persona esté escribiendo.
export function useActualizacionApp() {
  const [hayNueva, setHayNueva] = useState(false)

  useEffect(() => {
    if (import.meta.env.DEV) return

    let activo = true
    async function revisar(alAbrir) {
      if (document.visibilityState !== 'visible') return
      try {
        const respuesta = await fetch('/version.json', { cache: 'no-store' })
        if (!respuesta.ok) return
        const { version } = await respuesta.json()
        if (!activo || !version || version === __VERSION_APP__) return

        // Una sola recarga automática por versión: si por caché el código
        // nuevo no llegara, no se entra en un bucle de recargas.
        let yaRecargada = false
        try {
          yaRecargada = sessionStorage.getItem(CLAVE_RECARGA) === version
          if (alAbrir && !yaRecargada) sessionStorage.setItem(CLAVE_RECARGA, version)
        } catch {
          yaRecargada = true
        }
        if (alAbrir && !yaRecargada) window.location.reload()
        else setHayNueva(true)
      } catch {
        /* sin conexión: se reintenta en la próxima revisión */
      }
    }

    const alCambiarVisibilidad = () => revisar(true)
    revisar(true)
    const intervalo = setInterval(() => revisar(false), CADA_CUANTO_MS)
    document.addEventListener('visibilitychange', alCambiarVisibilidad)
    return () => {
      activo = false
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
    }
  }, [])

  async function actualizar() {
    try {
      const registro = await navigator.serviceWorker?.getRegistration('/')
      await registro?.update()
    } catch {
      /* el service worker no cambia en cada versión; recargar alcanza */
    }
    window.location.reload()
  }

  return { hayNueva, actualizar }
}
