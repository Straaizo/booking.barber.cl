import { createContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { obtenerPerfil, iniciarSesion, cerrarSesion } from '../services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorPerfil, setErrorPerfil] = useState(null)

  useEffect(() => {
    let activo = true

    async function cargarPerfil(sesionActual) {
      if (!sesionActual) {
        if (activo) {
          setPerfil(null)
          setSesion(null)
          setCargando(false)
        }
        return
      }
      try {
        const perfilCargado = await obtenerPerfil(sesionActual.user.id)
        if (!activo) return
        setSesion(sesionActual)
        setPerfil(perfilCargado)
        setErrorPerfil(null)
      } catch (error) {
        if (!activo) return
        // La sesión de Supabase Auth existe pero no hay fila en `usuarios`
        // (o RLS la bloquea) — no se puede resolver un rol, se trata como
        // sesión inválida para no dejar a nadie en un estado indefinido.
        setErrorPerfil(error)
        setSesion(null)
        setPerfil(null)
      } finally {
        if (activo) setCargando(false)
      }
    }

    supabase.auth.getSession().then(({ data }) => cargarPerfil(data.session))

    const { data: suscripcion } = supabase.auth.onAuthStateChange((_evento, sesionActual) => {
      setCargando(true)
      cargarPerfil(sesionActual)
    })

    return () => {
      activo = false
      suscripcion.subscription.unsubscribe()
    }
  }, [])

  async function iniciarSesionUsuario(credenciales) {
    await iniciarSesion(credenciales)
    // onAuthStateChange se dispara solo y carga el perfil.
  }

  async function cerrarSesionUsuario() {
    await cerrarSesion()
  }

  const valor = {
    sesion,
    perfil,
    cargando,
    errorPerfil,
    autenticado: Boolean(sesion && perfil),
    iniciarSesion: iniciarSesionUsuario,
    cerrarSesion: cerrarSesionUsuario,
  }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
