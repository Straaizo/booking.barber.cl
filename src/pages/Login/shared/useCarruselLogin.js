import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { DURACION_SLIDE_MS, DESFASE_TEXTO_MS } from '../data/slides'

// Toda la coreografía del carrusel del login — timing, desfase entre imagen y
// texto, pausa mientras se escribe, gate de carga progresiva y respeto a
// prefers-reduced-motion — vive acá. Tanto la composición desktop como la
// mobile solo leen el resultado y lo dibujan a su manera.
export function useCarruselLogin(totalSlides, { pausado = false } = {}) {
  const prefiereReducido = usePrefersReducedMotion()
  const [indiceImagen, setIndiceImagen] = useState(0)
  const [indiceTexto, setIndiceTexto] = useState(0)
  const [secundariasListas, setSecundariasListas] = useState(false)
  const timeoutTextoRef = useRef(null)

  // El resto de las imágenes (todas menos la primera) se empiezan a pedir
  // recién cuando el navegador queda con tiempo libre tras el primer render
  // — así el formulario es interactivo sin esperar por fotos que no se van a
  // ver todavía. Safari no tiene requestIdleCallback: setTimeout es su respaldo.
  useEffect(() => {
    const enIdle = () => setSecundariasListas(true)
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(enIdle, { timeout: 1500 })
      return () => cancelIdleCallback(id)
    }
    const id = setTimeout(enIdle, 300)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    if (prefiereReducido || pausado || totalSlides <= 1) return

    const id = setInterval(() => {
      setIndiceImagen((actual) => (actual + 1) % totalSlides)
    }, DURACION_SLIDE_MS)
    return () => clearInterval(id)
  }, [prefiereReducido, pausado, totalSlides])

  // El texto sale/entra ~500ms después que la imagen empieza a fundirse —
  // si ambos se mueven juntos se siente mecánico, un carrusel automático y no
  // una decisión de dirección de arte.
  useEffect(() => {
    clearTimeout(timeoutTextoRef.current)
    timeoutTextoRef.current = setTimeout(() => {
      setIndiceTexto(indiceImagen)
    }, DESFASE_TEXTO_MS)
    return () => clearTimeout(timeoutTextoRef.current)
  }, [indiceImagen])

  return {
    indiceImagen,
    indiceTexto,
    secundariasListas,
    rotando: !prefiereReducido && !pausado && totalSlides > 1,
  }
}
