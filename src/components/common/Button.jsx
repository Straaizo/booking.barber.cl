import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

const TIRON_MAXIMO = 10

// Botón principal con magnetismo suave: sigue levemente el mouse dentro de su
// área y vuelve a su lugar con un spring al salir — no es solo un hover:scale.
export function Button({ as = 'a', className = '', ...props }) {
  const MotionElement = motion[as]
  const referencia = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 250, damping: 18, mass: 0.4 })
  const springY = useSpring(y, { stiffness: 250, damping: 18, mass: 0.4 })

  function manejarMovimiento(evento) {
    const caja = referencia.current?.getBoundingClientRect()
    if (!caja) return
    const relativoX = evento.clientX - (caja.left + caja.width / 2)
    const relativoY = evento.clientY - (caja.top + caja.height / 2)
    x.set((relativoX / (caja.width / 2)) * TIRON_MAXIMO)
    y.set((relativoY / (caja.height / 2)) * TIRON_MAXIMO)
  }

  function resetear() {
    x.set(0)
    y.set(0)
  }

  return (
    <MotionElement
      ref={referencia}
      onMouseMove={manejarMovimiento}
      onMouseLeave={resetear}
      style={{ x: springX, y: springY }}
      whileTap={{ scale: 0.96 }}
      className={`inline-block rounded-lg bg-cobre px-7 py-3.5 text-center font-semibold tracking-tight text-hueso transition-colors duration-200 hover:bg-cobre-oscuro focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-laton ${className}`}
      {...props}
    />
  )
}
