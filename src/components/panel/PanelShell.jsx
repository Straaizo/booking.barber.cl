import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { rutaPorRol, ROL_ADMIN, ROL_BARBERO } from '../../utils/roles'
import { HoverLink } from '../common/HoverLink'
import { IconoCuenta } from '../common/IconoCuenta'
import { IconoSalir } from './IconosNav'
import { AvisoAppMovil } from './AvisoAppMovil'

const NOMBRES_ROL = { 1: 'Superadmin', 2: 'Administrador', 3: 'Barbero' }

const FORMATO_FECHA = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })

function fechaDeHoy() {
  const fecha = FORMATO_FECHA.format(new Date())
  return fecha.charAt(0).toUpperCase() + fecha.slice(1)
}

// Cascarón compartido por los tres paneles (barbero/admin/superadmin).
// - PC (md+): barra superior densa con marca + sesión y pestañas debajo.
// - Celular: barra superior compacta + barra de navegación inferior con
//   íconos (al alcance del pulgar), y la cuenta/cerrar sesión en una hoja
//   que sube desde abajo. Respeta el notch y la barra de inicio del iPhone
//   vía `env(safe-area-inset-*)` (ver useModoApp).
// `max-w-4xl` es el ancho de siempre — cómodo para formularios de una sola
// columna. Reservas necesita más en PC: calendario + lista lado a lado.
const ANCHOS = {
  normal: 'max-w-4xl',
  amplio: 'max-w-7xl',
}

function PestanaEscritorio({ to, etiqueta, fin }) {
  return (
    <NavLink
      to={to}
      end={fin}
      className={({ isActive }) =>
        `versalitas whitespace-nowrap border-b-2 px-1 py-4 text-xs transition-colors ${
          isActive
            ? 'border-cobre text-negro-barbero'
            : 'border-transparent text-gris-calido-500 hover:text-negro-barbero'
        }`
      }
    >
      {etiqueta}
    </NavLink>
  )
}

function PestanaMovil({ to, etiquetaCorta, etiqueta, fin, Icono }) {
  return (
    <NavLink
      to={to}
      end={fin}
      className={({ isActive }) =>
        `flex min-h-14 flex-col items-center justify-center gap-0.5 pt-1.5 text-[11px] font-medium tracking-wide transition-colors ${
          isActive ? 'text-cobre-texto' : 'text-gris-calido-500'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
              isActive ? 'bg-cobre/12' : ''
            }`}
          >
            <Icono className="h-6 w-6" />
          </span>
          {etiquetaCorta ?? etiqueta}
        </>
      )}
    </NavLink>
  )
}

function inicial(nombre) {
  return (nombre ?? '?').trim().charAt(0).toUpperCase()
}

export function PanelShell({ secciones, children, ancho = 'normal', rutaCuenta }) {
  const { perfil, cerrarSesion, verComo, cambiarVerComo, barberosParaSelector } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)

  useEffect(() => {
    setMenuAbierto(false)
  }, [pathname])

  async function salir() {
    setMenuAbierto(false)
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

  const selectorVerComo = cambiarVerComo && (
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
  )

  return (
    <div className="panel-app min-h-screen bg-hueso">
      {/* ---------- PC ---------- */}
      <header className="hidden items-center justify-between border-b border-gris-calido-200 bg-negro-barbero px-8 py-4 text-hueso md:flex">
        <div className="flex items-center gap-4">
          <HoverLink href="/" className="font-display text-base italic tracking-tight">
            booking<span className="text-cobre">.</span>barber.cl
          </HoverLink>
          <span className="h-8 w-px bg-gris-calido-700" aria-hidden="true" />
          <span className="text-left">
            <span className="block text-sm leading-tight">Bienvenido, {perfil?.nombre}</span>
            <span className="versalitas block text-xs text-gris-calido-400">
              {NOMBRES_ROL[perfil?.rol_id]} · {fechaDeHoy()}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {selectorVerComo && (
            <label className="flex items-center gap-2">
              <span className="versalitas text-xs text-gris-calido-400">Ver como</span>
              {selectorVerComo}
            </label>
          )}
          {rutaCuenta && (
            <>
              <NavLink
                to={rutaCuenta}
                end
                aria-label="Cuenta"
                className={({ isActive }) =>
                  `versalitas flex items-center gap-1.5 text-xs transition-colors hover:text-cobre ${
                    isActive ? 'text-cobre' : 'text-gris-calido-400'
                  }`
                }
              >
                <IconoCuenta className="h-5 w-5" />
                <span>Cuenta</span>
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

      <nav className="hidden gap-6 overflow-x-auto border-b border-gris-calido-200 bg-white px-8 md:flex">
        {secciones.map((seccion) => (
          <PestanaEscritorio key={seccion.to} {...seccion} />
        ))}
      </nav>

      {/* ---------- Celular ---------- */}
      <header className="sticky top-0 z-30 bg-negro-barbero pt-[env(safe-area-inset-top)] text-hueso md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="min-w-0">
            <p className="font-display text-[17px] italic leading-none tracking-tight">
              booking<span className="text-cobre">.</span>barber
            </p>
            <p className="mt-1 truncate text-xs text-gris-calido-400">{fechaDeHoy()}</p>
          </div>
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú de cuenta"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-cobre text-base font-semibold text-hueso active:brightness-90"
          >
            {inicial(perfil?.nombre)}
          </button>
        </div>
      </header>

      <main
        className={`mx-auto px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-5 md:px-8 md:py-12 ${ANCHOS[ancho]}`}
      >
        <AvisoAppMovil />
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-gris-calido-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Secciones del panel"
      >
        <div className="grid" style={{ gridTemplateColumns: `repeat(${secciones.length}, minmax(0, 1fr))` }}>
          {secciones.map((seccion) => (
            <PestanaMovil key={seccion.to} {...seccion} />
          ))}
        </div>
      </nav>

      <AnimatePresence>
        {menuAbierto && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.button
              type="button"
              aria-label="Cerrar menú"
              className="absolute inset-0 bg-black/45"
              onClick={() => setMenuAbierto(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Cuenta"
              className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            >
              <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-gris-calido-200" />
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cobre text-lg font-semibold text-hueso">
                  {inicial(perfil?.nombre)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-medium text-negro-barbero">{perfil?.nombre}</p>
                  <p className="text-sm text-gris-calido-500">{NOMBRES_ROL[perfil?.rol_id]}</p>
                </div>
              </div>

              {selectorVerComo && (
                <label className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-negro-barbero px-4 py-3">
                  <span className="text-sm text-gris-calido-400">Ver como</span>
                  {selectorVerComo}
                </label>
              )}

              <div className="mt-5 flex flex-col overflow-hidden rounded-2xl border border-gris-calido-200">
                {rutaCuenta && (
                  <NavLink
                    to={rutaCuenta}
                    className="flex min-h-14 items-center gap-3 border-b border-gris-calido-200 px-4 text-base text-negro-barbero active:bg-gris-calido-100"
                  >
                    <IconoCuenta className="h-6 w-6 text-gris-calido-500" />
                    Configuración de la cuenta
                  </NavLink>
                )}
                <button
                  type="button"
                  onClick={salir}
                  className="flex min-h-14 items-center gap-3 px-4 text-left text-base text-red-700 active:bg-red-50"
                >
                  <IconoSalir className="h-6 w-6" />
                  Cerrar sesión
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
