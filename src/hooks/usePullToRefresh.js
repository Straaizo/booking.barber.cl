import { useEffect, useRef, useState } from 'react'

const UMBRAL = 72
const MAXIMO = 110

// "Deslizar hacia abajo para actualizar" — la app instalada en iPhone no
// tiene recarga del navegador, así que el gesto se implementa a mano. Solo
// arranca si la página ya está arriba del todo y el dedo baja en vertical
// (no interfiere con las tiras que se deslizan de lado). Devuelve cuánto se
// tiró (para dibujar el indicador) y si está actualizando.
export function usePullToRefresh(onActualizar, habilitado = true) {
  const [distancia, setDistancia] = useState(0)
  const [actualizando, setActualizando] = useState(false)
  const inicio = useRef(null)
  const distanciaRef = useRef(0)
  const actualizandoRef = useRef(false)

  useEffect(() => {
    if (!habilitado) return

    function alTocar(evento) {
      if (actualizandoRef.current || window.scrollY > 0 || evento.touches.length !== 1) return
      // Con una hoja/modal abierto el gesto no corresponde a la página.
      if (document.querySelector('[aria-modal="true"]')) return
      inicio.current = { x: evento.touches[0].clientX, y: evento.touches[0].clientY }
    }

    function alMover(evento) {
      if (!inicio.current) return
      const dy = evento.touches[0].clientY - inicio.current.y
      const dx = evento.touches[0].clientX - inicio.current.x
      if (dy <= 0 || Math.abs(dx) > Math.abs(dy) || window.scrollY > 0) {
        inicio.current = null
        distanciaRef.current = 0
        setDistancia(0)
        return
      }
      // Resistencia: cuanto más se tira, menos avanza (como en iOS).
      const valor = Math.min(MAXIMO, dy * 0.5)
      distanciaRef.current = valor
      setDistancia(valor)
    }

    async function alSoltar() {
      if (!inicio.current) return
      inicio.current = null
      const alcanzado = distanciaRef.current >= UMBRAL * 0.75
      distanciaRef.current = 0
      setDistancia(0)
      if (!alcanzado) return
      actualizandoRef.current = true
      setActualizando(true)
      try {
        await onActualizar()
      } catch {
        /* el error ya lo muestra cada pantalla con su propio estado de carga */
      } finally {
        actualizandoRef.current = false
        setActualizando(false)
      }
    }

    window.addEventListener('touchstart', alTocar, { passive: true })
    window.addEventListener('touchmove', alMover, { passive: true })
    window.addEventListener('touchend', alSoltar)
    window.addEventListener('touchcancel', alSoltar)
    return () => {
      window.removeEventListener('touchstart', alTocar)
      window.removeEventListener('touchmove', alMover)
      window.removeEventListener('touchend', alSoltar)
      window.removeEventListener('touchcancel', alSoltar)
    }
  }, [onActualizar, habilitado])

  return { distancia, actualizando, progreso: Math.min(1, distancia / (UMBRAL * 0.75)) }
}
