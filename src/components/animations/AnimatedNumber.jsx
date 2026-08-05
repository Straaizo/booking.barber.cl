import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'

// Contador que anima desde 0 hasta el valor real cuando entra en viewport.
// formatear recibe el número redondeado y decide cómo mostrarlo (ej. formatoCLP).
export function AnimatedNumber({ valor, formatear = (n) => n, className = '' }) {
  const contenedorRef = useRef(null)
  const textoRef = useRef(null)
  const enVista = useInView(contenedorRef, { once: true, margin: '-40px' })
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { damping: 22, stiffness: 90 })

  useEffect(() => {
    if (enVista) motionValue.set(valor)
  }, [enVista, valor, motionValue])

  useEffect(() => {
    return spring.on('change', (v) => {
      if (textoRef.current) textoRef.current.textContent = formatear(Math.round(v))
    })
  }, [spring, formatear])

  return (
    <span ref={contenedorRef} className={`numeros-tabulares ${className}`}>
      <span ref={textoRef}>{formatear(0)}</span>
    </span>
  )
}
