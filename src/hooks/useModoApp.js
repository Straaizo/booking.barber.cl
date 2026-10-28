import { useEffect, useState } from 'react'
import { registrarServiceWorker } from '../services/pushService'

// Chrome/Android dispara `beforeinstallprompt` una sola vez por carga de
// página — se captura a nivel de módulo (este archivo se importa desde el
// router, al arrancar la app) para no perderlo si el aviso de instalación
// todavía no está montado en ese momento.
let eventoInstalacion = null
const suscriptores = new Set()

function avisar() {
  suscriptores.forEach((fn) => fn(eventoInstalacion))
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault()
    eventoInstalacion = evento
    avisar()
  })
  window.addEventListener('appinstalled', () => {
    eventoInstalacion = null
    avisar()
  })
}

// La PWA es solo de los paneles: el <link rel="manifest"> no vive en
// index.html (eso haría instalable la home, el login y las páginas públicas
// de cada barbería) — se agrega solo mientras hay un panel montado y se saca
// al salir, así el navegador ofrece "Instalar app" únicamente ahí.
// `viewport-fit=cover` habilita `env(safe-area-inset-*)` (notch y barra de
// inicio del iPhone) solo en el panel, sin tocar las páginas públicas.
export function useModoApp() {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'manifest'
    link.href = '/site.webmanifest'
    document.head.appendChild(link)

    const viewport = document.querySelector('meta[name="viewport"]')
    const viewportOriginal = viewport?.getAttribute('content')
    viewport?.setAttribute('content', `${viewportOriginal}, viewport-fit=cover`)

    registrarServiceWorker()
    return () => {
      link.remove()
      if (viewportOriginal) viewport.setAttribute('content', viewportOriginal)
    }
  }, [])
}

// Instalación directa (solo navegadores que la exponen: Chrome/Edge en
// Android). En iPhone no existe — ahí se muestran los pasos a mano.
export function useInstalacionApp() {
  const [evento, setEvento] = useState(eventoInstalacion)

  useEffect(() => {
    suscriptores.add(setEvento)
    return () => suscriptores.delete(setEvento)
  }, [])

  async function instalar() {
    if (!evento) return false
    try {
      evento.prompt()
      const { outcome } = await evento.userChoice
      if (outcome === 'accepted') {
        eventoInstalacion = null
        avisar()
      }
      return outcome === 'accepted'
    } catch {
      return false
    }
  }

  return { puedeInstalar: Boolean(evento), instalar }
}
