import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

// Orientación REAL del dispositivo, no la forma de la ventana: con el teclado
// abierto (en algunos Android achica la ventana) la vista queda más ancha que
// alta y un `@media (orientation: landscape)` mostraría este aviso en medio
// de escribir. Solo cuenta en teléfonos (lado corto de la pantalla < 500px).
function telefonoAcostado() {
  try {
    const ladoCorto = Math.min(window.screen.width, window.screen.height)
    if (ladoCorto >= 500) return false
    const tipo = window.screen.orientation?.type
    if (tipo) return tipo.startsWith('landscape')
    return Math.abs(window.orientation ?? 0) === 90
  } catch {
    return false
  }
}

// iOS ignora el `orientation: portrait` del manifest y no hay forma web de
// bloquear la rotación en iPhone — la app instalada se acuesta igual. En vez
// de dejar el panel deformado en horizontal, se tapa todo con este aviso.
// Lo monta el router solo dentro de la app instalada.
export function AvisoGirarTelefono() {
  const [acostado, setAcostado] = useState(telefonoAcostado)

  useEffect(() => {
    const revisar = () => setAcostado(telefonoAcostado())
    window.screen.orientation?.addEventListener?.('change', revisar)
    window.addEventListener('orientationchange', revisar)
    window.addEventListener('resize', revisar)
    return () => {
      window.screen.orientation?.removeEventListener?.('change', revisar)
      window.removeEventListener('orientationchange', revisar)
      window.removeEventListener('resize', revisar)
    }
  }, [])

  if (!acostado) return null

  return (
    <div
      role="alert"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5 bg-negro-barbero px-8 text-center text-hueso"
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
