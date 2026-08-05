import { motion } from 'framer-motion'

export function Loader({ label = 'Cargando' }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col items-center gap-3">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <rect
          x="26"
          y="24"
          width="22"
          height="8"
          rx="3"
          fill="#4A453F"
          opacity="0.25"
        />
        <motion.g
          style={{ originX: '28px', originY: '28px' }}
          animate={{ rotate: [-38, 4, -38] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <rect x="26" y="24.5" width="21" height="7" rx="3" fill="#A85C32" />
          <circle cx="28" cy="28" r="6" fill="#1C1B19" />
        </motion.g>
      </svg>
      <span className="text-sm font-medium text-gris-calido-700">{label}…</span>
    </div>
  )
}
