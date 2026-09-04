import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { PanelShell } from '../../components/panel/PanelShell'

const SECCIONES = [
  { to: '/panel/reservas', etiqueta: 'Reservas' },
  { to: '/panel/barberos', etiqueta: 'Barberos' },
  { to: '/panel/servicios', etiqueta: 'Servicios' },
  { to: '/panel/horarios', etiqueta: 'Horarios' },
  { to: '/panel/personalizacion', etiqueta: 'Personalización' },
]

function PestanaNav({ to, etiqueta }) {
  return (
    <NavLink
      to={to}
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

export function PanelAdminLayout() {
  const nav = SECCIONES.map((seccion) => <PestanaNav key={seccion.to} {...seccion} />)
  // Solo Reservas necesita el ancho amplio (calendario + lista lado a lado)
  // — el resto son formularios de una columna, más cómodos angostos.
  const esReservas = useLocation().pathname === '/panel/reservas'

  return (
    <PanelShell
      nav={<div className="flex gap-6">{nav}</div>}
      ancho={esReservas ? 'amplio' : 'normal'}
      rutaCuenta="/panel/cuenta"
    >
      <Outlet />
    </PanelShell>
  )
}
