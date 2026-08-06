import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring } from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

// A diferencia de AnimatedNumber (que cuenta una sola vez al entrar en
// viewport), este contador sigue en vivo cualquier valor que cambie —
// pensado para resultados de calculadoras/inputs, no para reveals de scroll.
// Con prefers-reduced-motion, salta directo al valor nuevo sin transición.
export function LiveNumber({ valor, formatear = (n) => n, min = 0, className = '' }) {
  const textoRef = useRef(null)
  const motionValue = useMotionValue(valor)
  // damping 30 con stiffness 170 queda sobreamortiguado a propósito: sin esto,
  // el spring puede rebotar por debajo de 0 al bajar rápido (con el teclado o
  // arrastrando el slider) y se ve un monto negativo por una fracción de segundo.
  const spring = useSpring(motionValue, { damping: 30, stiffness: 170 })
  const prefiereReducido = usePrefersReducedMotion()

  useEffect(() => {
    if (prefiereReducido) {
      motionValue.jump(valor)
    } else {
      motionValue.set(valor)
    }
  }, [valor, motionValue, prefiereReducido])

  useEffect(() => {
    return spring.on('change', (v) => {
      if (textoRef.current) textoRef.current.textContent = formatear(Math.max(min, Math.round(v)))
    })
  }, [spring, formatear, min])

  return (
    <span ref={textoRef} className={`numeros-tabulares ${className}`}>
      {formatear(Math.max(min, Math.round(spring.get())))}
    </span>
  )
}
