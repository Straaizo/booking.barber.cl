import { useEffect } from 'react'
import { registrarServiceWorker } from '../services/pushService'

// La PWA es solo del login en adelante: el <link rel="manifest"> no vive en
// index.html (eso haría instalable la home y las páginas públicas de cada
// barbería) — se agrega solo mientras está montado el login o un panel, y
// se saca al salir, así el navegador ofrece "Instalar app" únicamente ahí.
export function useModoApp() {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'manifest'
    link.href = '/site.webmanifest'
    document.head.appendChild(link)
    registrarServiceWorker()
    return () => link.remove()
  }, [])
}
