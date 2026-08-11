import { NavLink, Outlet } from 'react-router-dom'
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

  return (
    <PanelShell titulo="Panel de barbería" nav={<div className="flex gap-6">{nav}</div>}>
      <Outlet />
    </PanelShell>
  )
}
