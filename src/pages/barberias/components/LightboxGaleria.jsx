import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { EASE_ENTRADA, DURACION_MICRO } from '../../../components/animations/easing'

// Overlay a pantalla completa para ver una foto de la galería en grande, con
// navegación por teclado (Esc cierra, ← → cambian de foto) y click afuera de
// la imagen para cerrar — el gesto estándar de cualquier lightbox, así nadie
// tiene que aprender un patrón nuevo para ver las fotos de la barbería.
export function LightboxGaleria({ imagenes, indice, onCerrar, onCambiarIndice, nombreBarberia }) {
  const foto = imagenes[indice]
  const hayVarias = imagenes.length > 1

  useEffect(() => {
    function alTeclado(evento) {
      if (evento.key === 'Escape') onCerrar()
      if (evento.key === 'ArrowRight' && hayVarias) onCambiarIndice((indice + 1) % imagenes.length)
      if (evento.key === 'ArrowLeft' && hayVarias) onCambiarIndice((indice - 1 + imagenes.length) % imagenes.length)
    }
    window.addEventListener('keydown', alTeclado)
    return () => window.removeEventListener('keydown', alTeclado)
  }, [indice, hayVarias, imagenes.length, onCerrar, onCambiarIndice])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DURACION_MICRO }}
      onClick={onCerrar}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-negro-barbero/90 px-4 py-10"
    >
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar"
        className="absolute right-5 top-5 text-3xl text-hueso/70 transition-colors hover:text-hueso"
      >
        ×
      </button>

      {hayVarias && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onCambiarIndice((indice - 1 + imagenes.length) % imagenes.length)
          }}
          aria-label="Foto anterior"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-4xl text-hueso/70 transition-colors hover:text-hueso md:left-6"
        >
          ‹
        </button>
      )}

      <motion.img
        key={indice}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DURACION_MICRO, ease: EASE_ENTRADA }}
        src={foto.url}
        alt={foto.leyenda || `${nombreBarberia} — foto ${indice + 1}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
      />

      {foto.leyenda && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 text-center text-sm text-hueso/90">
          {foto.leyenda}
        </p>
      )}

      {hayVarias && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onCambiarIndice((indice + 1) % imagenes.length)
          }}
          aria-label="Foto siguiente"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-4xl text-hueso/70 transition-colors hover:text-hueso md:right-6"
        >
          ›
        </button>
      )}
    </motion.div>
  )
}
