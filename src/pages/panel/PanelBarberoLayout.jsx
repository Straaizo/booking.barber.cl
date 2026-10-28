import { Outlet } from 'react-router-dom'
import { PanelShell } from '../../components/panel/PanelShell'
import { IconoCalendario, IconoInicio, IconoReloj, IconoServicios } from '../../components/panel/IconosNav'

const SECCIONES = [
  { to: '/panel/barbero/inicio', etiqueta: 'Inicio', Icono: IconoInicio },
  { to: '/panel/barbero/reservas', etiqueta: 'Reservas', Icono: IconoCalendario },
  { to: '/panel/barbero/horarios', etiqueta: 'Horarios', Icono: IconoReloj },
  { to: '/panel/barbero/servicios', etiqueta: 'Servicios', Icono: IconoServicios },
]

export function PanelBarberoLayout() {
  return (
    <PanelShell secciones={SECCIONES} rutaCuenta="/panel/barbero/cuenta">
      <Outlet />
    </PanelShell>
  )
}
