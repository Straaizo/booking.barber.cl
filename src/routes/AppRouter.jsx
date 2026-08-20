import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Home } from '../pages/Home/Home'
import { PaginaBarberia } from '../pages/barberias/PaginaBarberia'
import { RutaBarberia } from '../pages/barberias/RutaBarberia'
import { RutaDemo } from '../pages/demo/RutaDemo'
import { Login } from '../pages/Login/Login'
import { RutaProtegida } from './RutaProtegida'
import { PanelBarberoLayout } from '../pages/panel/PanelBarberoLayout'
import { PanelBarberoReservas } from '../pages/panel/PanelBarberoReservas'
import { PanelBarberoHorarios } from '../pages/panel/PanelBarberoHorarios'
import { PanelBarberoServicios } from '../pages/panel/PanelBarberoServicios'
import { PanelAdminLayout } from '../pages/panel/PanelAdminLayout'
import { PanelReservas } from '../pages/panel/PanelReservas'
import { PanelBarberos } from '../pages/panel/PanelBarberos'
import { PanelServicios } from '../pages/panel/PanelServicios'
import { PanelHorarios } from '../pages/panel/PanelHorarios'
import { PanelPersonalizacion } from '../pages/panel/PanelPersonalizacion'
import { PreviewBarberia } from '../pages/panel/PreviewBarberia'
import { PanelSuperadminLayout } from '../pages/panel/PanelSuperadminLayout'
import { PanelSuperadminBarberias } from '../pages/panel/PanelSuperadminBarberias'
import { PanelSuperadminBarberiaDetalle } from '../pages/panel/PanelSuperadminBarberiaDetalle'
import { PanelSuperadminPlanes } from '../pages/panel/PanelSuperadminPlanes'
import { ROL_BARBERO, ROL_ADMIN, ROL_SUPERADMIN } from '../utils/roles'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/login', element: <Login /> },
  // Superficie de render aislada para la vista previa PC/Móvil del panel de
  // personalización — vive en un <iframe>, recibe sus datos por postMessage,
  // nunca se navega a mano. Al cargar ahí dentro (con su propia
  // ventana/documento), toda esta app se vuelve a montar independiente —
  // incluido `<Cursor />` (ver main.jsx), que ahí sigue el mouse local a ese
  // documento sin ningún problema.
  { path: '/_preview-barberia', element: <PreviewBarberia /> },
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
    children: [
      {
        path: '/panel/barbero',
        element: <PanelBarberoLayout />,
        children: [
          { index: true, element: <Navigate to="/panel/barbero/reservas" replace /> },
          { path: 'reservas', element: <PanelBarberoReservas /> },
          { path: 'horarios', element: <PanelBarberoHorarios /> },
          { path: 'servicios', element: <PanelBarberoServicios /> },
        ],
      },
    ],
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
          { path: 'personalizacion', element: <PanelPersonalizacion /> },
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
  // Cualquier URL que no matchee nada de arriba (mal escrita, adivinada,
  // apuntando a algo que ya no existe) vuelve al inicio en vez de quedar en
  // blanco — no es una medida de seguridad en sí, pero evita que alguien
  // "explorando" URLs a mano tenga alguna señal de que encontró algo.
  { path: '*', element: <Navigate to="/" replace /> },
])

export function AppRouter() {
  // v7_startTransition es una bandera de <RouterProvider>, no de
  // createBrowserRouter — evita el warning en consola, no cambia nada visible
  // (React Router ya recomienda activarla desde ahora, antes de que sea
  // obligatoria en v7).
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />
}
