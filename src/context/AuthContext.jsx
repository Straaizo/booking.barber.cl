import { createContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { obtenerPerfil, iniciarSesion, cerrarSesion } from '../services/authService'
import {
  HAY_BACKEND_REAL,
  ID_BARBERIA_PROVISORIA,
  ID_USUARIO_PROVISORIO,
  listarBarberosParaSelectorProvisorio,
  perfilProvisorioParaBarbero,
} from '../mocks/datosProvisoriosSuperadmin'
import { ROL_ADMIN } from '../utils/roles'
import { ESTADO_ACTIVO } from '../utils/estados'

export const AuthContext = createContext(null)

// TEMPORAL: sin Supabase real conectado, se entra directo como admin de la
// barbería provisoria — no hay login que resolver todavía. Se autodesactiva
// sola en cuanto HAY_BACKEND_REAL sea true (ver mocks/datosProvisoriosSuperadmin.js).
const PERFIL_PROVISORIO = {
  id: ID_USUARIO_PROVISORIO,
  usuario: 'demo',
  nombre: 'Demo (modo provisorio)',
  rol_id: ROL_ADMIN,
  barberia_id: ID_BARBERIA_PROVISORIA,
  barbero_id: null,
  barberias: { estado_id: ESTADO_ACTIVO },
}

// También TEMPORAL, y solo tiene sentido junto con lo anterior: sin login
// real no hay forma de entrar como barbero para probar su panel — esto le
// da al panel (ver PanelShell.jsx) un selector "Ver como" que alterna entre
// el perfil de dueño de arriba y el de alguno de los barberos ya cargados,
// guardado en localStorage para que sobreviva a un refresh.
const CLAVE_VER_COMO = 'booking_barber_ver_como_v1'

function leerVerComoGuardado() {
  try {
    return localStorage.getItem(CLAVE_VER_COMO) || 'dueno'
  } catch {
    return 'dueno'
  }
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorPerfil, setErrorPerfil] = useState(null)
  const [verComo, setVerComo] = useState(leerVerComoGuardado)

  function cambiarVerComo(valor) {
    try {
      localStorage.setItem(CLAVE_VER_COMO, valor)
    } catch {
      /* localStorage no disponible — el selector simplemente no persiste entre refrescos */
    }
    setVerComo(valor)
  }

  useEffect(() => {
    if (!HAY_BACKEND_REAL) {
      setSesion({ user: { id: ID_USUARIO_PROVISORIO } })
      const perfilBarbero = verComo !== 'dueno' ? perfilProvisorioParaBarbero(verComo) : null
      setPerfil(perfilBarbero ?? PERFIL_PROVISORIO)
      setCargando(false)
      return
    }

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
  }, [verComo])

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
    // Solo tiene sentido sin backend real — con Supabase conectado, el rol
    // lo decide de verdad la sesión, no un selector.
    verComo: !HAY_BACKEND_REAL ? verComo : null,
    cambiarVerComo: !HAY_BACKEND_REAL ? cambiarVerComo : null,
    barberosParaSelector: !HAY_BACKEND_REAL ? listarBarberosParaSelectorProvisorio() : [],
  }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
