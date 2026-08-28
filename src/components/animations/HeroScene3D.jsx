import { Suspense, lazy, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { StaticBarberPoleIllustration } from './StaticBarberPoleIllustration'
import { Loader } from '../common/Loader'

const Scene3DCanvas = lazy(() => import('./Scene3DCanvas'))

// Misma caja para el 3D y el respaldo estático: si el monitor de rendimiento
// baja a la ilustración después de un par de segundos (ver más abajo), el
// contenedor no cambia de tamaño de golpe — solo cambia lo que hay adentro.
// `items-end` (no `items-center`): el <Canvas> del 3D siempre ocupa el 100%
// de la caja, así que la alineación no le afecta — pero el SVG estático
// (StaticBarberPoleIllustration) trae su propia sombra "de apoyo" pegada
// abajo de su viewBox; centrarlo en una caja alta dejaba esa sombra
// flotando en la mitad, en vez de tocando la base como un objeto parado.
const CAJA = 'mx-auto flex h-80 w-full max-w-xs items-end justify-center md:h-[30rem] md:max-w-sm'

// Este componente ya solo se monta en desktop — `Hero.jsx` no lo renderiza
// en mobile en absoluto (ni el 3D ni este mismo respaldo estático tenían
// sentido ahí, ver ese archivo). Acá solo quedan los 2 motivos legítimos de
// desktop para preferir la ilustración estática: accesibilidad
// (`prefers-reduced-motion`) y un equipo de escritorio que igual mida fps
// bajos.
export function HeroScene3D() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [rendimientoBajo, setRendimientoBajo] = useState(false)

  const manejarRendimientoBajo = useCallback((fpsPromedio) => {
    console.info(`[3D] Rendimiento bajo (${fpsPromedio.toFixed(1)} fps) — se baja a la ilustración estática.`)
    setRendimientoBajo(true)
  }, [])

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
            <Scene3DCanvas onRendimientoBajo={manejarRendimientoBajo} />
          </Suspense>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
