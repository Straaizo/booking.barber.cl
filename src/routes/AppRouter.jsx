import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Home } from '../pages/Home/Home'
import { PaginaBarberia } from '../pages/barberias/PaginaBarberia'
import { RutaBarberia } from '../pages/barberias/RutaBarberia'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  {
    path: '/barberias/:slug',
    element: <RutaBarberia />,
    children: [{ index: true, element: <PaginaBarberia /> }],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
