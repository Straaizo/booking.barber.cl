import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Loader } from '../components/common/Loader'
import { rutaPorRol } from '../utils/roles'
import { HAY_BACKEND_REAL } from '../mocks/datosProvisoriosSuperadmin'
import { nivelDeSesion, primerFactorVerificado } from '../services/mfaService'
import { DesafioMFA } from './DesafioMFA'
import { useModoApp } from '../hooks/useModoApp'

function Verificando() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-hueso">
      <Loader label="Verificando sesión" />
    </div>
  )
}

export function RutaProtegida({ rolesPermitidos }) {
  const { autenticado, perfil, cargando } = useAuth()
  const ubicacion = useLocation()
  // null = todavía sin revisar; true = falta el código; false = ya está (o
  // no aplica — cuenta sin el factor activo).
  const [faltaMFA, setFaltaMFA] = useState(null)
  const [factorId, setFactorId] = useState(null)
  useModoApp()

  useEffect(() => {
    if (!autenticado || !perfil) return
    // Cualquier rol puede activar el factor (ver PanelCuenta); en modo de
    // prueba (sin Auth real contra el que preguntar) no hay nada que revisar.
    if (!HAY_BACKEND_REAL) {
      setFaltaMFA(false)
      return
    }
    let activo = true
    nivelDeSesion()
      .then((nivel) => {
        if (!activo) return
        // `nextLevel` más alto que `currentLevel` es la señal de Supabase de
        // "hay un factor activo y esta sesión todavía no pasó por él".
        if (!nivel || nivel.currentLevel === nivel.nextLevel) {
          setFaltaMFA(false)
          return null
        }
        return primerFactorVerificado().then((factor) => {
          if (!activo) return
          setFactorId(factor?.id ?? null)
          setFaltaMFA(Boolean(factor))
        })
      })
      .catch(() => activo && setFaltaMFA(false))
    return () => {
      activo = false
    }
  }, [autenticado, perfil])

  if (cargando) return <Verificando />

  if (!autenticado) {
    return <Navigate to="/login" state={{ desde: ubicacion.pathname }} replace />
  }

  if (!rolesPermitidos.includes(perfil.rol_id)) {
    return <Navigate to={rutaPorRol(perfil.rol_id)} replace />
  }

  if (faltaMFA === null) return <Verificando />

  if (faltaMFA) {
    return <DesafioMFA factorId={factorId} onVerificado={() => setFaltaMFA(false)} />
  }

  return <Outlet />
}
