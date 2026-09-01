import { useEffect, useState } from 'react'
import { VistaBarberia } from '../barberias/components/VistaBarberia'

// Página aislada, sin layout ni datos propios — vive en un <iframe> dentro
// de PanelPersonalizacion.jsx y solo refleja lo que el panel le manda por
// `postMessage`. Necesita ser un iframe (no un <div> achicado) porque los
// media queries de Tailwind (`md:...`) responden al viewport real del
// documento que los evalúa — un iframe tiene el suyo propio, un div no. El
// <iframe> tiene una altura fija (ver PanelPersonalizacion.jsx) y scrollea
// internamente si el contenido es más alto — a propósito: es lo que hace que
// esta página se comporte como una ventana real (con su propio scroll, no el
// de la página del panel) y que elementos con `position: fixed` (como la
// burbuja de WhatsApp) queden pegados a SU viewport, no al final de todo el
// contenido.
export function PreviewBarberia() {
  const [barberia, setBarberia] = useState(null)

  useEffect(() => {
    function alMensaje(evento) {
      // Sin este chequeo, cualquier página del mundo podría incrustar esta
      // ruta en un <iframe> propio y mandarle datos falsos — no hay ninguna
      // escritura real de por medio (solo se muestra lo que llega), pero
      // tampoco hay razón para aceptar mensajes de otro origen que no sea
      // esta misma app.
      if (evento.origin !== window.location.origin) return
      if (evento.data?.tipo === 'preview-barberia') setBarberia(evento.data.barberia)
    }
    window.addEventListener('message', alMensaje)
    window.parent?.postMessage({ tipo: 'preview-barberia-listo' }, window.location.origin)
    return () => window.removeEventListener('message', alMensaje)
  }, [])

  if (!barberia) return null
  return <VistaBarberia barberia={barberia} />
}
