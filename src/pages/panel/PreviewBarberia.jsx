import { useEffect, useState } from 'react'
import { VistaBarberia } from '../barberias/components/VistaBarberia'

// Página aislada, sin layout ni datos propios — vive en un <iframe> dentro
// de PanelPersonalizacion.jsx y solo refleja lo que el panel le manda por
// `postMessage`. Necesita ser un iframe (no un <div> achicado) porque los
// media queries de Tailwind (`md:...`) responden al viewport real del
// documento que los evalúa — un iframe tiene el suyo propio, un div no.
export function PreviewBarberia() {
  const [barberia, setBarberia] = useState(null)

  useEffect(() => {
    function alMensaje(evento) {
      if (evento.data?.tipo === 'preview-barberia') setBarberia(evento.data.barberia)
    }
    window.addEventListener('message', alMensaje)
    window.parent?.postMessage({ tipo: 'preview-barberia-listo' }, '*')
    return () => window.removeEventListener('message', alMensaje)
  }, [])

  if (!barberia) return null
  return <VistaBarberia barberia={barberia} />
}
