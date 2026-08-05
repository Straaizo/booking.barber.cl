import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { useIsMobile } from '../../hooks/useIsMobile'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { StaticBarberPoleIllustration } from './StaticBarberPoleIllustration'
import { Loader } from '../common/Loader'

const Scene3DCanvas = lazy(() => import('./Scene3DCanvas'))

export function HeroScene3D() {
  const isMobile = useIsMobile()
  const prefersReducedMotion = usePrefersReducedMotion()
  const useLightweightVersion = isMobile || prefersReducedMotion

  if (useLightweightVersion) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
        className="mx-auto h-56 w-auto"
      >
        <StaticBarberPoleIllustration className="h-full w-auto" />
      </motion.div>
    )
  }

  return (
    <div className="mx-auto flex h-80 w-full max-w-xs items-center justify-center md:h-[30rem] md:max-w-sm">
      <Suspense fallback={<Loader label="Cargando escena" />}>
        <Scene3DCanvas />
      </Suspense>
    </div>
  )
}
