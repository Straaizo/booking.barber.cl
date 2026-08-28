import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import {
  FONDOS_HERO_MOVIL,
  DURACION_FONDO_MS,
  DURACION_TRANSICION_FONDO_MS,
} from '../data/heroFondoMovil'

// Solo se monta en mobile (ver Hero.jsx): reemplaza el fondo sólido negro por
// un carrusel de fotos reales de la barbería, difuminadas y oscurecidas para
// que el texto del hero se siga leyendo igual encima, sin tocar el layout.
export function HeroFondoMovil() {
  const prefiereReducido = usePrefersReducedMotion()
  const [indice, setIndice] = useState(0)
  const [secundariasListas, setSecundariasListas] = useState(false)

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
    if (prefiereReducido || FONDOS_HERO_MOVIL.length <= 1) return
    const id = setInterval(() => {
      setIndice((actual) => (actual + 1) % FONDOS_HERO_MOVIL.length)
    }, DURACION_FONDO_MS)
    return () => clearInterval(id)
  }, [prefiereReducido])

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {FONDOS_HERO_MOVIL.map((fondo, i) => {
        if (i !== 0 && !secundariasListas) return null
        return (
          <motion.div
            key={fondo.id}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: indice === i ? 1 : 0 }}
            transition={{ duration: DURACION_TRANSICION_FONDO_MS / 1000, ease: 'easeInOut' }}
          >
            <picture>
              <source srcSet={fondo.webp} type="image/webp" />
              <img
                src={fondo.jpg}
                alt=""
                className="h-full w-full scale-110 object-cover blur-md"
                style={{ objectPosition: fondo.objectPosition }}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchpriority={i === 0 ? 'high' : 'auto'}
                decoding={i === 0 ? 'sync' : 'async'}
                draggable={false}
              />
            </picture>
          </motion.div>
        )
      })}
      <div className="absolute inset-0 bg-gradient-to-b from-negro-barbero/80 via-negro-barbero/70 to-negro-barbero/90" />
    </div>
  )
}
