import { useParams, Navigate, Outlet } from 'react-router-dom'
import { useBarberiaPorSlug } from './hooks/useBarberiaPorSlug'
import { Loader } from '../../components/common/Loader'

const ESTADO_ACTIVO = 1

export function RutaBarberia() {
  const { slug } = useParams()
  const { data: barberia, isLoading, isError } = useBarberiaPorSlug(slug)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hueso">
        <Loader label="Cargando barbería" />
      </div>
    )
  }

  if (isError || !barberia || barberia.estado_id !== ESTADO_ACTIVO) {
    return <Navigate to="/" replace />
  }

  return <Outlet context={{ barberia }} />
}
