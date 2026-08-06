import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

// Contador que anima desde 0 hasta el valor real cuando entra en viewport.
// formatear recibe el número redondeado y decide cómo mostrarlo (ej. formatoCLP).
// Con prefers-reduced-motion, muestra el valor final directo, sin contar.
export function AnimatedNumber({ valor, formatear = (n) => n, className = '' }) {
  const contenedorRef = useRef(null)
  const textoRef = useRef(null)
  const enVista = useInView(contenedorRef, { once: true, margin: '-40px' })
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { damping: 22, stiffness: 90 })
  const prefiereReducido = usePrefersReducedMotion()

  useEffect(() => {
    if (enVista) motionValue.set(valor)
  }, [enVista, valor, motionValue])

  useEffect(() => {
    return spring.on('change', (v) => {
      if (textoRef.current) textoRef.current.textContent = formatear(Math.max(0, Math.round(v)))
    })
  }, [spring, formatear])

  if (prefiereReducido) {
    return <span className={`numeros-tabulares ${className}`}>{formatear(valor)}</span>
  }

  return (
    <span ref={contenedorRef} className={`numeros-tabulares ${className}`}>
      <span ref={textoRef}>{formatear(0)}</span>
    </span>
  )
}
