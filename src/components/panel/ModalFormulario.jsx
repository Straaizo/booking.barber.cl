import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE_ENTRADA, DURACION_MICRO } from '../animations/easing'

// Card flotante sobre la página con el fondo difuminado — para editar o
// crear algo puntual (una cuenta, una contraseña) sin sacar a la persona de
// dónde estaba ni ensuciar la pantalla con un formulario siempre visible.
// Esc y clic afuera cierran igual que el botón "Cerrar".
export function ModalFormulario({ abierto, titulo, onCerrar, children }) {
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-negro-barbero/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            onClick={(evento) => evento.stopPropagation()}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: DURACION_MICRO, ease: EASE_ENTRADA }}
            className="w-full max-w-sm rounded-lg border border-gris-calido-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="versalitas text-xs text-cobre">{titulo}</span>
              <button
                type="button"
                onClick={onCerrar}
                aria-label="Cerrar"
                className="text-lg leading-none text-gris-calido-400 transition-colors hover:text-negro-barbero"
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
