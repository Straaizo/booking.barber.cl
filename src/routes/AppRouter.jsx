import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Home } from '../pages/Home/Home'
import { PaginaBarberia } from '../pages/barberias/PaginaBarberia'
import { RutaBarberia } from '../pages/barberias/RutaBarberia'
import { RutaDemo } from '../pages/demo/RutaDemo'
import { Login } from '../pages/Login/Login'
import { RutaProtegida } from './RutaProtegida'
import { PanelBarbero } from '../pages/panel/PanelBarbero'
import { PanelAdminLayout } from '../pages/panel/PanelAdminLayout'
import { PanelReservas } from '../pages/panel/PanelReservas'
import { PanelBarberos } from '../pages/panel/PanelBarberos'
import { PanelServicios } from '../pages/panel/PanelServicios'
import { PanelHorarios } from '../pages/panel/PanelHorarios'
import { PanelSuperadminLayout } from '../pages/panel/PanelSuperadminLayout'
import { PanelSuperadminBarberias } from '../pages/panel/PanelSuperadminBarberias'
import { PanelSuperadminBarberiaDetalle } from '../pages/panel/PanelSuperadminBarberiaDetalle'
import { PanelSuperadminPlanes } from '../pages/panel/PanelSuperadminPlanes'
import { ROL_BARBERO, ROL_ADMIN, ROL_SUPERADMIN } from '../utils/roles'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/login', element: <Login /> },
  {
    path: '/barberias/:slug',
    element: <RutaBarberia />,
    children: [{ index: true, element: <PaginaBarberia /> }],
  },
  {
    path: '/demo',
    element: <RutaDemo />,
    children: [{ index: true, element: <PaginaBarberia /> }],
  },
  {
    element: <RutaProtegida rolesPermitidos={[ROL_BARBERO]} />,
    children: [{ path: '/panel/precios', element: <PanelBarbero /> }],
  },
  {
    element: <RutaProtegida rolesPermitidos={[ROL_ADMIN]} />,
    children: [
      {
        path: '/panel',
        element: <PanelAdminLayout />,
        children: [
          { index: true, element: <Navigate to="/panel/reservas" replace /> },
          { path: 'reservas', element: <PanelReservas /> },
          { path: 'barberos', element: <PanelBarberos /> },
          { path: 'servicios', element: <PanelServicios /> },
          { path: 'horarios', element: <PanelHorarios /> },
        ],
      },
    ],
  },
  {
    element: <RutaProtegida rolesPermitidos={[ROL_SUPERADMIN]} />,
    children: [
      {
        path: '/admin',
        element: <PanelSuperadminLayout />,
        children: [
          { index: true, element: <PanelSuperadminBarberias /> },
          { path: 'barberias/:id', element: <PanelSuperadminBarberiaDetalle /> },
          { path: 'planes', element: <PanelSuperadminPlanes /> },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
