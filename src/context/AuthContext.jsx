import { createContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { obtenerPerfil, iniciarSesion, cerrarSesion, ErrorLogin } from '../services/authService'
import {
  HAY_BACKEND_REAL,
  ID_BARBERIA_PROVISORIA,
  ID_USUARIO_PROVISORIO,
  ADMIN_PROVISORIO,
  listarBarberosParaSelectorProvisorio,
  perfilProvisorioParaBarbero,
  validarCredencialesProvisorias,
} from '../mocks/datosProvisoriosSuperadmin'
import { ROL_ADMIN } from '../utils/roles'
import { ESTADO_ACTIVO } from '../utils/estados'

export const AuthContext = createContext(null)

// TEMPORAL: sin Supabase real conectado, el login (`/login`) valida usuario+
// contraseña contra los datos provisorios en vez de contra Supabase Auth —
// ver `validarCredencialesProvisorias`. Se autodesactiva sola en cuanto
// HAY_BACKEND_REAL sea true (ver mocks/datosProvisoriosSuperadmin.js).
const PERFIL_PROVISORIO = {
  id: ID_USUARIO_PROVISORIO,
  usuario: ADMIN_PROVISORIO.usuario,
  nombre: 'Demo (modo provisorio)',
  rol_id: ROL_ADMIN,
  barberia_id: ID_BARBERIA_PROVISORIA,
  barbero_id: null,
  barberias: { estado_id: ESTADO_ACTIVO },
}

// La sesión provisoria en sí (quién quedó logueado) sobrevive a un refresh
// guardada acá — separada de "Ver como" (abajo), que es solo una vista previa
// que el DUEÑO puede activar sobre su propia sesión, no un cambio de sesión.
const CLAVE_SESION_PROVISORIA = 'booking_barber_sesion_provisoria_v1'

function leerSesionProvisoriaGuardada() {
  try {
    const crudo = localStorage.getItem(CLAVE_SESION_PROVISORIA)
    return crudo ? JSON.parse(crudo) : null
  } catch {
    return null
  }
}

// "Ver como" solo tiene sentido para el dueño (mirar el panel como lo vería
// tal barbero, sin saber su contraseña) — un barbero que entró con su propio
// usuario no tiene por qué poder mirar el panel de otro.
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
  const [sesionProvisoria, setSesionProvisoria] = useState(() =>
    HAY_BACKEND_REAL ? null : leerSesionProvisoriaGuardada()
  )

  function cambiarVerComo(valor) {
    try {
      localStorage.setItem(CLAVE_VER_COMO, valor)
    } catch {
      /* localStorage no disponible — el selector simplemente no persiste entre refrescos */
    }
    setVerComo(valor)
  }

  function guardarSesionProvisoria(valor) {
    try {
      if (valor) localStorage.setItem(CLAVE_SESION_PROVISORIA, JSON.stringify(valor))
      else localStorage.removeItem(CLAVE_SESION_PROVISORIA)
    } catch {
      /* localStorage no disponible — la sesión simplemente no persiste entre refrescos */
    }
    setSesionProvisoria(valor)
  }

  useEffect(() => {
    if (!HAY_BACKEND_REAL) {
      if (!sesionProvisoria) {
        setSesion(null)
        setPerfil(null)
        setCargando(false)
        return
      }
      setSesion({
        user: { id: sesionProvisoria.tipo === 'dueno' ? ID_USUARIO_PROVISORIO : sesionProvisoria.barberoId },
      })
      if (sesionProvisoria.tipo === 'dueno') {
        const idVista = verComo !== 'dueno' ? verComo : null
        const perfilVista = idVista ? perfilProvisorioParaBarbero(idVista) : null
        setPerfil(perfilVista ?? PERFIL_PROVISORIO)
      } else {
        setPerfil(perfilProvisorioParaBarbero(sesionProvisoria.barberoId))
      }
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
  }, [verComo, sesionProvisoria])

  async function iniciarSesionUsuario(credenciales) {
    if (!HAY_BACKEND_REAL) {
      const resultado = validarCredencialesProvisorias(credenciales.usuario ?? '', credenciales.password ?? '')
      if (!resultado) {
        throw new ErrorLogin('credenciales', 'Usuario o contraseña incorrectos.')
      }
      guardarSesionProvisoria(resultado)
      return
    }
    await iniciarSesion(credenciales)
    // onAuthStateChange se dispara solo y carga el perfil.
  }

  async function cerrarSesionUsuario() {
    if (!HAY_BACKEND_REAL) {
      guardarSesionProvisoria(null)
      return
    }
    await cerrarSesion()
  }

  // "Ver como" es una vista previa que solo el dueño puede activar sobre su
  // propia sesión — un barbero que entró con su propio usuario no lo ve.
  const puedeVerComo = !HAY_BACKEND_REAL && sesionProvisoria?.tipo === 'dueno'

  const valor = {
    sesion,
    perfil,
    cargando,
    errorPerfil,
    autenticado: Boolean(sesion && perfil),
    iniciarSesion: iniciarSesionUsuario,
    cerrarSesion: cerrarSesionUsuario,
    verComo: puedeVerComo ? verComo : null,
    cambiarVerComo: puedeVerComo ? cambiarVerComo : null,
    barberosParaSelector: puedeVerComo ? listarBarberosParaSelectorProvisorio() : [],
  }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
