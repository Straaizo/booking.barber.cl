import { motion } from 'framer-motion'

// iOS ignora el `orientation: portrait` del manifest y no hay forma web de
// bloquear la rotación en iPhone — la app instalada se acuesta igual. En vez
// de dejar el panel deformado en horizontal, se tapa todo con este aviso
// (solo en pantallas bajas: un celular acostado, nunca un computador ni un
// tablet grande). Lo monta el router solo dentro de la app instalada.
export function AvisoGirarTelefono() {
  return (
    <div
      role="alert"
      className="fixed inset-0 z-[200] hidden flex-col items-center justify-center gap-5 bg-negro-barbero px-8 text-center text-hueso [@media(orientation:landscape)_and_(max-height:500px)]:flex"
    >
      <motion.svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-cobre-claro"
        animate={{ rotate: [-90, 0, 0, -90] }}
        transition={{ duration: 2.4, times: [0, 0.35, 0.75, 1], repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <rect x="6" y="2" width="12" height="20" rx="2.5" />
        <path d="M11 18.5h2" />
      </motion.svg>
      <div>
        <p className="font-display text-2xl font-light tracking-tight">
          Gira tu <span className="italic text-cobre-claro">teléfono</span>
        </p>
        <p className="mt-2 text-sm text-hueso/60">Booking Barber se usa en vertical.</p>
      </div>
    </div>
  )
}
