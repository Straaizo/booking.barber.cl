import { Outlet, useLocation } from 'react-router-dom'
import { PanelShell } from '../../components/panel/PanelShell'
import {
  IconoCalendario,
  IconoGrafico,
  IconoEquipo,
  IconoPincel,
  IconoReloj,
  IconoServicios,
} from '../../components/panel/IconosNav'

// "Mi página" (Personalización) no va en la barra inferior del celular — es
// lo que menos se usa ahí y se recomienda editarla desde el computador —,
// queda en el menú de la cuenta (`soloEscritorio`).
const SECCIONES = [
  { to: '/panel/resumen', etiqueta: 'Resumen', Icono: IconoGrafico },
  { to: '/panel/reservas', etiqueta: 'Reservas', Icono: IconoCalendario },
  { to: '/panel/barberos', etiqueta: 'Barberos', Icono: IconoEquipo },
  { to: '/panel/servicios', etiqueta: 'Servicios', Icono: IconoServicios },
  { to: '/panel/horarios', etiqueta: 'Horarios', Icono: IconoReloj },
  { to: '/panel/personalizacion', etiqueta: 'Personalización', etiquetaCorta: 'Mi página', Icono: IconoPincel, soloEscritorio: true },
]

export function PanelAdminLayout() {
  // Solo Reservas necesita el ancho amplio (calendario + lista lado a lado)
  // — el resto son formularios de una columna, más cómodos angostos.
  const esReservas = useLocation().pathname === '/panel/reservas'

  return (
    <PanelShell secciones={SECCIONES} ancho={esReservas ? 'amplio' : 'normal'} rutaCuenta="/panel/cuenta">
      <Outlet />
    </PanelShell>
  )
}
