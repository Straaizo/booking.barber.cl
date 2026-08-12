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
import { ROL_BARBERO, ROL_ADMIN } from '../utils/roles'

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
  // TEMPORAL: se saca el <RutaProtegida> de /admin para trabajar en el panel
  // superadmin sin pasar por el login (todavía no hay Supabase real conectado
  // — ver .env). Revertir envolviendo de nuevo en
  // <RutaProtegida rolesPermitidos={[ROL_SUPERADMIN]}> (importar ROL_SUPERADMIN
  // desde '../utils/roles') apenas se retome el login o se conecte el backend real.
  {
    path: '/admin',
    element: <PanelSuperadminLayout />,
    children: [
      { index: true, element: <PanelSuperadminBarberias /> },
      { path: 'barberias/:id', element: <PanelSuperadminBarberiaDetalle /> },
      { path: 'planes', element: <PanelSuperadminPlanes /> },
    ],
  },
])

export function AppRouter() {
  // v7_startTransition es una bandera de <RouterProvider>, no de
  // createBrowserRouter — evita el warning en consola, no cambia nada visible
  // (React Router ya recomienda activarla desde ahora, antes de que sea
  // obligatoria en v7).
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />
}
