import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useParams } from 'react-router-dom'
import { Home } from '../pages/Home/Home'
import { RutaProtegida } from './RutaProtegida'
import { Loader } from '../components/common/Loader'
import { ROL_BARBERO, ROL_ADMIN, ROL_SUPERADMIN } from '../utils/roles'

// `Home` es la única página que se carga sin lazy — es la puerta de entrada
// más visitada (bookingbarber.cl) y no vale la pena el viaje de red extra
// que implica un chunk separado para ella. Todo lo demás (páginas públicas
// de barbería, login, y sobre todo los 3 paneles con toda su lógica de
// Supabase/TanStack Query) antes viajaba junto en un solo bundle de ~980kB
// gzip aunque el visitante nunca los usara — separados en chunks, cada
// visita solo descarga el código de la ruta que realmente pisa.
function pagina(cargar, nombre) {
  return lazy(() => cargar().then((modulo) => ({ default: modulo[nombre] })))
}

const PaginaBarberia = pagina(() => import('../pages/barberias/PaginaBarberia'), 'PaginaBarberia')
const RutaBarberia = pagina(() => import('../pages/barberias/RutaBarberia'), 'RutaBarberia')
const RutaDemo = pagina(() => import('../pages/demo/RutaDemo'), 'RutaDemo')
const Login = pagina(() => import('../pages/Login/Login'), 'Login')
const PanelBarberoLayout = pagina(() => import('../pages/panel/PanelBarberoLayout'), 'PanelBarberoLayout')
const PanelBarberoReservas = pagina(() => import('../pages/panel/PanelBarberoReservas'), 'PanelBarberoReservas')
const PanelBarberoHorarios = pagina(() => import('../pages/panel/PanelBarberoHorarios'), 'PanelBarberoHorarios')
const PanelBarberoServicios = pagina(() => import('../pages/panel/PanelBarberoServicios'), 'PanelBarberoServicios')
const PanelAdminLayout = pagina(() => import('../pages/panel/PanelAdminLayout'), 'PanelAdminLayout')
const PanelReservas = pagina(() => import('../pages/panel/PanelReservas'), 'PanelReservas')
const PanelBarberos = pagina(() => import('../pages/panel/PanelBarberos'), 'PanelBarberos')
const PanelServicios = pagina(() => import('../pages/panel/PanelServicios'), 'PanelServicios')
const PanelHorarios = pagina(() => import('../pages/panel/PanelHorarios'), 'PanelHorarios')
const PanelPersonalizacion = pagina(() => import('../pages/panel/PanelPersonalizacion'), 'PanelPersonalizacion')
const PreviewBarberia = pagina(() => import('../pages/panel/PreviewBarberia'), 'PreviewBarberia')
const PanelSuperadminLayout = pagina(() => import('../pages/panel/PanelSuperadminLayout'), 'PanelSuperadminLayout')
const PanelSuperadminBarberias = pagina(() => import('../pages/panel/PanelSuperadminBarberias'), 'PanelSuperadminBarberias')
const PanelSuperadminBarberiaDetalle = pagina(
  () => import('../pages/panel/PanelSuperadminBarberiaDetalle'),
  'PanelSuperadminBarberiaDetalle'
)
const PanelSuperadminPlanes = pagina(() => import('../pages/panel/PanelSuperadminPlanes'), 'PanelSuperadminPlanes')
const PanelSuperadminNovedades = pagina(() => import('../pages/panel/PanelSuperadminNovedades'), 'PanelSuperadminNovedades')
// Una sola página de "Configuración" (contraseña propia + vincular Google),
// reusada tal cual en los 3 paneles — no hay nada en su contenido que
// dependa del rol.
const PanelCuenta = pagina(() => import('../pages/panel/PanelCuenta'), 'PanelCuenta')

function CargandoPagina() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-hueso">
      <Loader label="Cargando" />
    </div>
  )
}

// Cualquiera que ya tenga guardado un link viejo con el prefijo (compartido
// antes de este cambio, en Instagram/WhatsApp/etc.) sigue llegando a la
// página correcta en vez de un 404 — `replace` para no dejar el link viejo
// en el historial del navegador.
function RedirigirBarberiaSinPrefijo() {
  const { slug } = useParams()
  return <Navigate to={`/${slug}`} replace />
}

const router = createBrowserRouter([
  {
    element: (
      <Suspense fallback={<CargandoPagina />}>
        <Outlet />
      </Suspense>
    ),
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
  // Superficie de render aislada para la vista previa PC/Móvil del panel de
  // personalización — vive en un <iframe>, recibe sus datos por postMessage,
  // nunca se navega a mano. Al cargar ahí dentro (con su propia
  // ventana/documento), toda esta app se vuelve a montar independiente —
  // incluido `<Cursor />` (ver main.jsx), que ahí sigue el mouse local a ese
  // documento sin ningún problema.
  { path: '/_preview-barberia', element: <PreviewBarberia /> },
  { path: '/barberias/:slug', element: <RedirigirBarberiaSinPrefijo /> },
  {
    path: '/demo',
    element: <RutaDemo />,
    children: [{ index: true, element: <PaginaBarberia /> }],
  },
  // Va al final a propósito: React Router prioriza rutas fijas sobre esta
  // (`/:slug`) sin importar el orden del array, así que `/login`, `/demo`,
  // `/panel`, `/admin` y `/_preview-barberia` siguen resolviendo a lo suyo —
  // esta solo atrapa cualquier otra cosa, que es exactamente lo que tiene
  // que pasar con el slug de una barbería. `esSlugReservado()` (utils/slug.js)
  // bloquea crear una barbería con alguna de esas palabras, para que nunca
  // quede con una página pública inalcanzable.
  {
    path: '/:slug',
    element: <RutaBarberia />,
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
          { path: 'cuenta', element: <PanelCuenta /> },
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
          { path: 'cuenta', element: <PanelCuenta /> },
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
          { path: 'novedades', element: <PanelSuperadminNovedades /> },
          { path: 'cuenta', element: <PanelCuenta /> },
        ],
      },
    ],
  },
  // Cualquier URL que no matchee nada de arriba (mal escrita, adivinada,
  // apuntando a algo que ya no existe) vuelve al inicio en vez de quedar en
  // blanco — no es una medida de seguridad en sí, pero evita que alguien
  // "explorando" URLs a mano tenga alguna señal de que encontró algo.
      { path: '*', element: <Navigate to="/" replace /> },
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
