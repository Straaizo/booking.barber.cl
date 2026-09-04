import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { rutaPorRol, ROL_ADMIN, ROL_BARBERO } from '../../utils/roles'
import { HoverLink } from '../common/HoverLink'
import { IconoCuenta } from '../common/IconoCuenta'

const NOMBRES_ROL = { 1: 'Superadmin', 2: 'Administrador', 3: 'Barbero' }

const FORMATO_FECHA = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })

function fechaDeHoy() {
  const fecha = FORMATO_FECHA.format(new Date())
  return fecha.charAt(0).toUpperCase() + fecha.slice(1)
}

// Cascarón compartido por los tres paneles (barbero/admin/superadmin) — barra
// superior densa con identidad de marca + sesión, y una franja lateral
// opcional para navegación cuando el panel tiene más de una sección.
// `max-w-4xl` es el ancho de siempre — cómodo para formularios de una sola
// columna (Barberos, Servicios, Horarios). Reservas necesita más: un
// calendario + una lista de horas lado a lado se ven apretados ahí, con
// harto espacio vacío sobrando a los costados en una pantalla de escritorio
// normal.
const ANCHOS = {
  normal: 'max-w-4xl',
  amplio: 'max-w-7xl',
}

export function PanelShell({ nav, children, ancho = 'normal', rutaCuenta }) {
  const { perfil, cerrarSesion, verComo, cambiarVerComo, barberosParaSelector } = useAuth()
  const navigate = useNavigate()

  async function salir() {
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  // TEMPORAL: solo existe mientras no hay backend real (`cambiarVerComo` es
  // `null` en cuanto lo hay) — sin login real todavía no hay otra forma de
  // entrar como barbero para probar su panel.
  function alCambiarVerComo(evento) {
    const valor = evento.target.value
    cambiarVerComo(valor)
    navigate(rutaPorRol(valor === 'dueno' ? ROL_ADMIN : ROL_BARBERO), { replace: true })
  }

  return (
    <div className="min-h-screen bg-hueso">
      <header className="flex items-center justify-between border-b border-gris-calido-200 bg-negro-barbero px-5 py-4 text-hueso md:px-8">
        <div className="flex items-center gap-4">
          <HoverLink href="/" className="font-display text-base italic tracking-tight">
            booking<span className="text-cobre">.</span>barber.cl
          </HoverLink>
          <span className="hidden h-8 w-px bg-gris-calido-700 sm:block" aria-hidden="true" />
          <span className="hidden text-left sm:block">
            <span className="block text-sm leading-tight">Bienvenido, {perfil?.nombre}</span>
            <span className="versalitas block text-xs text-gris-calido-400">
              {NOMBRES_ROL[perfil?.rol_id]} · {fechaDeHoy()}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {cambiarVerComo && (
            <label className="hidden items-center gap-2 md:flex">
              <span className="versalitas text-xs text-gris-calido-400">Ver como</span>
              <select
                name="ver_como"
                value={verComo}
                onChange={alCambiarVerComo}
                className="min-h-9 rounded-md border border-gris-calido-700 bg-negro-barbero px-2 py-1 text-xs text-hueso outline-none"
              >
                <option value="dueno">Dueño</option>
                {barberosParaSelector.map((barbero) => (
                  <option key={barbero.id} value={barbero.id}>
                    Barbero: {barbero.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
          {rutaCuenta && (
            <>
              <NavLink
                to={rutaCuenta}
                aria-label="Cuenta"
                className="versalitas flex items-center gap-1.5 text-xs text-gris-calido-400 transition-colors hover:text-cobre"
              >
                <IconoCuenta className="h-5 w-5" />
                <span className="hidden sm:inline">Cuenta</span>
              </NavLink>
              <span className="h-8 w-px bg-gris-calido-700" aria-hidden="true" />
            </>
          )}
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

      <main className={`mx-auto px-5 py-8 md:px-8 md:py-12 ${ANCHOS[ancho]}`}>{children}</main>
    </div>
  )
}
