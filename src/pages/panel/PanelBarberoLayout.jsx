import { NavLink, Outlet } from 'react-router-dom'
import { PanelShell } from '../../components/panel/PanelShell'

const SECCIONES = [
  { to: '/panel/barbero/reservas', etiqueta: 'Reservas' },
  { to: '/panel/barbero/horarios', etiqueta: 'Horarios' },
  { to: '/panel/barbero/servicios', etiqueta: 'Servicios' },
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

export function PanelBarberoLayout() {
  const nav = SECCIONES.map((seccion) => <PestanaNav key={seccion.to} {...seccion} />)

  return (
    <PanelShell titulo="Panel de barbero" nav={<div className="flex gap-6">{nav}</div>}>
      <Outlet />
    </PanelShell>
  )
}
