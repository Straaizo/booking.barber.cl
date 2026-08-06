import { Suspense, lazy, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsMobile } from '../../hooks/useIsMobile'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { StaticBarberPoleIllustration } from './StaticBarberPoleIllustration'
import { Loader } from '../common/Loader'

const Scene3DCanvas = lazy(() => import('./Scene3DCanvas'))

// Misma caja para el 3D y el respaldo estático: si el monitor de rendimiento
// baja a la ilustración después de un par de segundos (ver más abajo), el
// contenedor no cambia de tamaño de golpe — solo cambia lo que hay adentro.
const CAJA = 'mx-auto flex h-80 w-full max-w-xs items-center justify-center md:h-[30rem] md:max-w-sm'

export function HeroScene3D() {
  const isMobile = useIsMobile()
  const prefersReducedMotion = usePrefersReducedMotion()
  const [rendimientoBajo, setRendimientoBajo] = useState(false)

  const manejarRendimientoBajo = useCallback((fpsPromedio) => {
    console.info(`[3D] Rendimiento bajo (${fpsPromedio.toFixed(1)} fps) — se baja a la ilustración estática.`)
    setRendimientoBajo(true)
  }, [])

  // prefers-reduced-motion es una preferencia de accesibilidad: se respeta
  // siempre, sin importar el equipo. rendimientoBajo, en cambio, se decide
  // recién con una medición real de fps (ver MonitorRendimiento) — no se
  // asume de antemano que "mobile" implica un equipo débil.
  const mostrarEstatica = prefersReducedMotion || rendimientoBajo

  return (
    <AnimatePresence mode="wait">
      {mostrarEstatica ? (
        <motion.div
          key="estatica"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className={CAJA}
        >
          <StaticBarberPoleIllustration className="h-56 w-auto" />
        </motion.div>
      ) : (
        <motion.div
          key="3d"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className={CAJA}
        >
          <Suspense fallback={<Loader label="Cargando escena" />}>
            <Scene3DCanvas liviano={isMobile} onRendimientoBajo={manejarRendimientoBajo} />
          </Suspense>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
