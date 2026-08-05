import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useTienePunteroFino } from '../../hooks/useTienePunteroFino'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

const SELECTOR_INTERACTIVO = 'a, button, input, textarea, [data-cursor-hover]'

// Cursor propio: un punto que sigue al mouse al instante y un anillo con
// inercia suave detrás. Se agranda sobre elementos interactivos. Solo se monta
// con puntero fino (mouse/trackpad) y sin prefers-reduced-motion — en touch o
// con movimiento reducido, el navegador usa el cursor nativo sin costo extra.
export function Cursor() {
  const tienePunteroFino = useTienePunteroFino()
  const prefiereReducido = usePrefersReducedMotion()
  const [sobreInteractivo, setSobreInteractivo] = useState(false)
  const [visible, setVisible] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const anilloX = useSpring(x, { damping: 28, stiffness: 260, mass: 0.5 })
  const anilloY = useSpring(y, { damping: 28, stiffness: 260, mass: 0.5 })

  const activo = tienePunteroFino && !prefiereReducido

  useEffect(() => {
    if (!activo) return

    document.body.classList.add('tiene-cursor-propio')

    function moverPuntero(evento) {
      x.set(evento.clientX)
      y.set(evento.clientY)
      if (!visible) setVisible(true)
      const interactivo = evento.target.closest(SELECTOR_INTERACTIVO)
      setSobreInteractivo(Boolean(interactivo))
    }

    function ocultar() {
      setVisible(false)
    }

    window.addEventListener('pointermove', moverPuntero)
    window.addEventListener('pointerleave', ocultar)
    return () => {
      document.body.classList.remove('tiene-cursor-propio')
      window.removeEventListener('pointermove', moverPuntero)
      window.removeEventListener('pointerleave', ocultar)
    }
  }, [activo, x, y, visible])

  if (!activo) return null

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-cobre"
        style={{ x, y, translateX: '-50%', translateY: '-50%', opacity: visible ? 1 : 0 }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[100] rounded-full border border-cobre"
        style={{
          x: anilloX,
          y: anilloY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: visible ? 1 : 0,
        }}
        animate={{
          width: sobreInteractivo ? 52 : 30,
          height: sobreInteractivo ? 52 : 30,
          backgroundColor: sobreInteractivo ? 'rgba(168,92,50,0.12)' : 'rgba(168,92,50,0)',
        }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      />
    </>
  )
}
