import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE_ENTRADA, DURACION_MICRO } from '../animations/easing'
import { useIsMobile } from '../../hooks/useIsMobile'

// Card flotante sobre la página con el fondo difuminado — para editar o
// crear algo puntual (una cuenta, una contraseña) sin sacar a la persona de
// dónde estaba ni ensuciar la pantalla con un formulario siempre visible.
// Esc y clic afuera cierran igual que el botón "Cerrar". En el celular es una
// hoja que sube desde abajo (patrón nativo de iOS/Android, al alcance del
// pulgar) en vez de una tarjeta centrada.
const ANCHOS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function ModalFormulario({ abierto, titulo, onCerrar, children, ancho = 'sm' }) {
  const esMovil = useIsMobile()

  useEffect(() => {
    if (!abierto) return
    function alTeclado(evento) {
      if (evento.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', alTeclado)
    return () => window.removeEventListener('keydown', alTeclado)
  }, [abierto, onCerrar])

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURACION_MICRO }}
          onClick={onCerrar}
          className="fixed inset-0 z-50 flex items-end justify-center bg-negro-barbero/50 backdrop-blur-sm md:items-center md:p-4"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            onClick={(evento) => evento.stopPropagation()}
            initial={esMovil ? { y: '100%' } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={esMovil ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={esMovil ? { y: '100%' } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={
              esMovil ? { type: 'spring', damping: 32, stiffness: 340 } : { duration: DURACION_MICRO, ease: EASE_ENTRADA }
            }
            className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-3 shadow-xl md:max-h-none md:overflow-visible md:rounded-lg md:border md:border-gris-calido-200 md:p-6 ${ANCHOS[ancho]}`}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-gris-calido-200 md:hidden" aria-hidden="true" />
            <div className="flex items-center justify-between gap-4">
              <span className="font-display text-xl text-negro-barbero md:font-sans md:text-xs md:font-semibold md:uppercase md:tracking-[0.07em] md:text-cobre">
                {titulo}
              </span>
              <button
                type="button"
                onClick={onCerrar}
                aria-label="Cerrar"
                className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-lg leading-none text-gris-calido-400 transition-colors hover:text-negro-barbero active:bg-gris-calido-100 md:mr-0 md:h-auto md:w-auto"
              >
                ✕
              </button>
            </div>
            <div className="mt-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
