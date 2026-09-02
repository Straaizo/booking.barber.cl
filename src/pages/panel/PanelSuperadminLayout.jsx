import { NavLink, Outlet } from 'react-router-dom'
import { PanelShell } from '../../components/panel/PanelShell'

const SECCIONES = [
  { to: '/admin', etiqueta: 'Barberías', fin: true },
  { to: '/admin/planes', etiqueta: 'Precios' },
  { to: '/admin/novedades', etiqueta: 'Novedades' },
]

function PestanaNav({ to, etiqueta, fin }) {
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

export function PanelSuperadminLayout() {
  const nav = SECCIONES.map((seccion) => <PestanaNav key={seccion.to} {...seccion} />)

  return (
    <PanelShell titulo="Panel superadmin" nav={<div className="flex gap-6">{nav}</div>}>
      <Outlet />
    </PanelShell>
  )
}
