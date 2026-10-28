import { Outlet } from 'react-router-dom'
import { PanelShell } from '../../components/panel/PanelShell'
import { IconoEtiqueta, IconoMegafono, IconoTienda } from '../../components/panel/IconosNav'

const SECCIONES = [
  { to: '/admin', etiqueta: 'Barberías', fin: true, Icono: IconoTienda },
  { to: '/admin/planes', etiqueta: 'Precios', Icono: IconoEtiqueta },
  { to: '/admin/novedades', etiqueta: 'Novedades', Icono: IconoMegafono },
]

export function PanelSuperadminLayout() {
  return (
    <PanelShell secciones={SECCIONES} rutaCuenta="/admin/cuenta">
      <Outlet />
    </PanelShell>
  )
}
