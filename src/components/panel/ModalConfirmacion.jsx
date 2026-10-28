import { motion } from 'framer-motion'
import { ModalFormulario } from './ModalFormulario'

// Confirmación para una acción importante o difícil de deshacer (cancelar
// una reserva, dar de baja algo, eliminar una cuenta) — la misma tarjeta
// flotante que `ModalFormulario`, en vez de un `window.confirm()` nativo del
// navegador (sin estilo propio, y que en Chrome/Firefox ya se ve distinto en
// cada sistema operativo). Variantes:
// - `peligro` (por defecto): rojo, para lo destructivo.
// - `normal`: color de marca, para acciones importantes no destructivas
//   (ej: reactivar algo).
// - `exito`: verde, para confirmar algo positivo (ej: el cliente llegó).
const VARIANTES = {
  peligro: { boton: 'bg-red-700', icono: 'bg-red-50 text-red-700', anillo: 'bg-red-200' },
  normal: { boton: 'bg-cobre-oscuro', icono: 'bg-cobre/10 text-cobre-texto', anillo: 'bg-cobre/25' },
  exito: { boton: 'bg-verde-barberia', icono: 'bg-verde-barberia/10 text-verde-barberia', anillo: 'bg-verde-barberia/25' },
}

function IconoVariante({ variante }) {
  const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (variante === 'peligro') {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
        <path d="M12 4 21.5 20h-19z" {...trazo} />
        <motion.path
          d="M12 10v4.5"
          {...trazo}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.2, duration: 0.25 }}
        />
        <circle cx="12" cy="17.2" r="0.9" fill="currentColor" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <motion.path
        d={variante === 'exito' ? 'M5 12.5 10 17.5 19 7' : 'M12 7v6M12 16.5v.5'}
        {...trazo}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.15, duration: 0.35, ease: 'easeOut' }}
      />
    </svg>
  )
}

export function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  variante = 'peligro',
  confirmando = false,
  onConfirmar,
  onCerrar,
}) {
  const estilo = VARIANTES[variante] ?? VARIANTES.peligro

  return (
    <ModalFormulario abierto={abierto} titulo={titulo} onCerrar={onCerrar}>
      <div className="flex flex-col items-center text-center md:items-start md:text-left">
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center md:hidden">
          {/* Un pulso suave detrás del ícono, una sola vez al abrir. */}
          <motion.span
            className={`absolute inset-0 rounded-full ${estilo.anillo}`}
            initial={{ scale: 0.6, opacity: 0.8 }}
            animate={{ scale: 1.35, opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
          <motion.span
            className={`relative flex h-16 w-16 items-center justify-center rounded-full ${estilo.icono}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 260 }}
          >
            <IconoVariante variante={variante} />
          </motion.span>
        </div>
        <p className="text-base leading-relaxed text-gris-calido-700 md:text-sm">{mensaje}</p>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end md:gap-4">
        <button
          type="button"
          onClick={onCerrar}
          disabled={confirmando}
          className="min-h-12 rounded-xl bg-gris-calido-100 text-base font-medium text-negro-barbero transition-colors hover:text-negro-barbero active:bg-gris-calido-200 disabled:opacity-50 md:min-h-0 md:bg-transparent md:text-xs md:font-semibold md:uppercase md:tracking-[0.07em] md:text-gris-calido-500"
        >
          {textoCancelar}
        </button>
        <motion.button
          type="button"
          onClick={onConfirmar}
          disabled={confirmando}
          whileTap={{ scale: 0.97 }}
          className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-base font-semibold text-hueso transition-[filter] hover:brightness-110 disabled:opacity-70 md:min-h-0 md:rounded-lg md:text-sm ${estilo.boton}`}
        >
          {confirmando && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-hueso/30 border-t-hueso" aria-hidden="true" />
          )}
          {confirmando ? 'Un momento…' : textoConfirmar}
        </motion.button>
      </div>
    </ModalFormulario>
  )
}
