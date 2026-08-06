import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const NOMBRES_ROL = { 1: 'Superadmin', 2: 'Administrador', 3: 'Barbero' }

// Cascarón compartido por los tres paneles (barbero/admin/superadmin) — barra
// superior densa con identidad de marca + sesión, y una franja lateral
// opcional para navegación cuando el panel tiene más de una sección.
export function PanelShell({ titulo, nav, children }) {
  const { perfil, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  async function salir() {
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-hueso">
      <header className="flex items-center justify-between border-b border-gris-calido-200 bg-negro-barbero px-5 py-4 text-hueso md:px-8">
        <div className="flex items-center gap-4">
          <span className="font-display text-base italic tracking-tight">
            booking<span className="text-cobre">.</span>barber.cl
          </span>
          <span className="versalitas hidden text-xs text-gris-calido-400 md:inline">
            {titulo}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-right sm:block">
            <span className="block leading-tight">{perfil?.nombre}</span>
            <span className="versalitas block text-xs text-gris-calido-400">
              {NOMBRES_ROL[perfil?.rol_id]}
            </span>
          </span>
          <button
            type="button"
            onClick={salir}
            className="versalitas rounded-md border border-gris-calido-700 px-3 py-2 text-xs text-hueso transition-colors hover:border-cobre hover:text-cobre"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {nav && (
        <nav className="flex gap-1 overflow-x-auto border-b border-gris-calido-200 bg-white px-5 md:px-8">
          {nav}
        </nav>
      )}

      <main className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-12">{children}</main>
    </div>
  )
}
