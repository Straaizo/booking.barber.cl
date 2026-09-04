import { createContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { obtenerPerfil, iniciarSesion, cerrarSesion, vincularGoogle, ErrorLogin } from '../services/authService'
import { eliminarCuentaHuerfanaPropia } from '../services/usuariosService'
import {
  HAY_BACKEND_REAL,
  SUPERADMIN_PROVISORIO,
  listarBarberosParaSelectorProvisorio,
  perfilProvisorioParaBarbero,
  perfilProvisorioParaDueno,
  validarCredencialesProvisorias,
} from '../mocks/datosProvisoriosSuperadmin'
import { ROL_SUPERADMIN } from '../utils/roles'

// Perfil fijo del superadmin en modo de prueba — no vive en ninguna
// barbería (no tiene barberia_id/barbero_id), a diferencia del resto de las
// cuentas provisorias.
const PERFIL_SUPERADMIN_PROVISORIO = {
  id: 'prov-usuario-superadmin',
  usuario: SUPERADMIN_PROVISORIO.usuario,
  nombre: 'Superadmin (modo provisorio)',
  rol_id: ROL_SUPERADMIN,
  barberia_id: null,
  barbero_id: null,
}

export const AuthContext = createContext(null)

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
    if (window.location.pathname === '/_preview-barberia') {
      // Esta ruta vive en un <iframe> aparte (ver PreviewBarberia.jsx) y no
      // usa autenticación en absoluto — pero al cargar ahí dentro, esta app
      // se vuelve a montar completa en su propio documento, incluido este
      // provider. Como comparte origen (y por lo tanto `localStorage`) con
      // la pestaña real, se creaba una segunda sesión de Supabase Auth en
      // paralelo compitiendo por refrescar el mismo token — eso disparaba
      // eventos de auth espurios en la pestaña real, causando el parpadeo de
      // "Verificando sesión" solo en Personalización (única pantalla con
      // este iframe montado). Acá simplemente no se inicializa sesión real.
      setCargando(false)
      return
    }
    if (!HAY_BACKEND_REAL) {
      if (!sesionProvisoria) {
        setSesion(null)
        setPerfil(null)
        setCargando(false)
        return
      }
      if (sesionProvisoria.tipo === 'superadmin') {
        setSesion({ user: { id: PERFIL_SUPERADMIN_PROVISORIO.id } })
        setPerfil(PERFIL_SUPERADMIN_PROVISORIO)
        setCargando(false)
        return
      }

      setSesion({
        user: {
          id:
            sesionProvisoria.tipo === 'dueno'
              ? 'prov-usuario-dueno-' + sesionProvisoria.barberiaId
              : sesionProvisoria.barberoId,
        },
      })
      if (sesionProvisoria.tipo === 'dueno') {
        const idVista = verComo !== 'dueno' ? verComo : null
        const perfilVista = idVista ? perfilProvisorioParaBarbero(idVista) : null
        setPerfil(perfilVista ?? perfilProvisorioParaDueno(sesionProvisoria.barberiaId))
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
        // Si esa sesión venía de un login con Google (no de "vincular", sino
        // de entrar directo por primera vez con una cuenta que nadie ató
        // todavía a un usuario real), se marca aparte para mostrar un
        // mensaje específico en vez del genérico de credenciales.
        const esGoogleSinVincular = sesionActual.user.app_metadata?.provider === 'google'
        setErrorPerfil({ ...error, esGoogleSinVincular })
        setSesion(null)
        setPerfil(null)
        // Si viene de un login con Google sin vincular, Supabase ya creó una
        // identidad real en `auth.users` para esa persona ANTES de que acá
        // se la pueda rechazar — sin borrarla, cualquiera que pruebe el botón
        // de Google sin tener ninguna cuenta real deja una fila permanente.
        // Tiene que llamarse ANTES de `signOut()`: la Edge Function identifica
        // a quien borra por su propio JWT, que deja de servir apenas se cierra
        // la sesión.
        // `await` acá es obligatorio, no cosmético: sin esperar, `signOut()`
        // de la línea de abajo corre en paralelo y puede limpiar la sesión
        // ANTES de que esta llamada llegue a armar su header de
        // autenticación — la Edge Function la rechaza con 401 y el `catch`
        // la traga en silencio, dejando la cuenta huérfana igual.
        if (esGoogleSinVincular) await eliminarCuentaHuerfanaPropia().catch(() => {})
        // La sesión de Supabase Auth queda huérfana (autenticada, sin perfil
        // de la app) si no se cierra acá — de lo contrario, el próximo
        // `getSession()` la vuelve a traer y repite el mismo fallo en
        // silencio en cada carga, sin que la persona pueda hacer nada.
        supabase.auth.signOut()
      } finally {
        if (activo) setCargando(false)
      }
    }

    supabase.auth.getSession().then(({ data }) => cargarPerfil(data.session))

    const { data: suscripcion } = supabase.auth.onAuthStateChange((evento, sesionActual) => {
      // Supabase re-dispara este evento (TOKEN_REFRESHED/INITIAL_SESSION) cada
      // vez que la pestaña recupera el foco, aunque sea el mismo usuario —
      // si mostráramos el loader de pantalla completa en cada uno de estos,
      // la app "parpadea" en Verificando sesión con solo cambiar de pestaña.
      // Solo se re-verifica el perfil ante un cambio real de sesión.
      if (evento === 'TOKEN_REFRESHED' || evento === 'INITIAL_SESSION') {
        setSesion(sesionActual)
        return
      }
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

  // `identities` viene incluido en el user de Supabase Auth — lo usa
  // PanelShell para saber si ya se vinculó Google o hay que ofrecer hacerlo.
  const googleVinculado = Boolean(
    sesion?.user?.identities?.some((identidad) => identidad.provider === 'google')
  )

  const valor = {
    sesion,
    perfil,
    cargando,
    errorPerfil,
    limpiarErrorPerfil: () => setErrorPerfil(null),
    autenticado: Boolean(sesion && perfil),
    iniciarSesion: iniciarSesionUsuario,
    cerrarSesion: cerrarSesionUsuario,
    vincularGoogle: HAY_BACKEND_REAL ? vincularGoogle : null,
    googleVinculado,
    verComo: puedeVerComo ? verComo : null,
    cambiarVerComo: puedeVerComo ? cambiarVerComo : null,
    barberosParaSelector: puedeVerComo ? listarBarberosParaSelectorProvisorio(sesionProvisoria.barberiaId) : [],
  }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
