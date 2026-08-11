import { AnimatePresence, motion } from 'framer-motion'
import { EASE_ENTRADA, EASE_SALIDA, DURACION_MICRO } from '../animations/easing'

// Reemplaza al mensaje de texto suelto junto al botón de guardar: una
// tarjeta flotante que primero muestra "guardando" y al terminar pasa sola a
// "guardado" (o a un error), sin que haya que ir a buscarla en la pantalla.
export function ToastGuardado({ estado }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 md:justify-end md:pr-10">
      <AnimatePresence>
        {estado && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97, transition: { duration: DURACION_MICRO, ease: EASE_SALIDA } }}
            transition={{ duration: 0.35, ease: EASE_ENTRADA }}
            role={estado === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex items-center gap-3 rounded-lg border border-gris-calido-700 bg-negro-barbero px-4 py-3 shadow-xl"
          >
            {estado === 'cargando' && (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-hueso/25 border-t-cobre"
                />
                <span className="text-sm text-hueso">Guardando cambios…</span>
              </>
            )}
            {estado === 'ok' && (
              <>
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-verde-barberia text-xs text-hueso"
                >
                  ✓
                </span>
                <span className="text-sm text-hueso">Cambios guardados</span>
              </>
            )}
            {estado === 'error' && (
              <>
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-700 text-xs text-hueso"
                >
                  ✕
                </span>
                <span className="text-sm text-hueso">No pudimos guardar los cambios</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
