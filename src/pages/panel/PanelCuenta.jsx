import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { ModalFormulario } from '../../components/panel/ModalFormulario'
import { IconoLlave } from '../../components/panel/IconoLlave'
import { IconoGoogle } from '../../components/common/IconoGoogle'
import { cambiarPasswordPropia } from '../../services/authService'
import { SeccionAutenticacionDosPasos } from './components/SeccionAutenticacionDosPasos'
import { SeccionNotificaciones } from './components/SeccionNotificaciones'
import { HAY_BACKEND_REAL } from '../../mocks/datosProvisoriosSuperadmin'
import { ROL_SUPERADMIN } from '../../utils/roles'

const LARGO_MINIMO_PASSWORD = 8

// En el celular cada sección se arma como un grupo de Ajustes de iOS:
// etiqueta afuera, filas grandes adentro de una tarjeta y la nota abajo. En
// PC (md+) las clases `max-md:` no aplican y todo queda como siempre.
const CLASE_SECCION =
  'rounded-lg border border-gris-calido-200 bg-white p-5 max-md:flex max-md:flex-col max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:p-0'
const CLASE_TITULO_SECCION =
  'versalitas text-xs text-cobre max-md:mb-2 max-md:px-1 max-md:font-sans! max-md:text-[13px] max-md:tracking-[0.06em] max-md:text-gris-calido-500'
const CLASE_NOTA_SECCION =
  'mt-1 text-sm text-gris-calido-500 max-md:order-last max-md:mt-2 max-md:px-1 max-md:text-[13px] max-md:leading-snug'
const CLASE_FILA_ACCION =
  'mt-3 flex items-center gap-2 rounded-md border border-gris-calido-200 px-4 py-2 text-sm text-negro-barbero transition-colors hover:border-cobre hover:text-cobre-texto disabled:opacity-50 max-md:mt-0 max-md:min-h-14 max-md:w-full max-md:gap-3 max-md:rounded-2xl max-md:bg-white max-md:text-left max-md:text-base max-md:active:bg-gris-calido-100'

const ESTADOS_PASSWORD = {
  guardando: 'Guardando…',
  guardado: 'Contraseña actualizada',
  error: 'No se pudo guardar',
  debil: `Mínimo ${LARGO_MINIMO_PASSWORD} caracteres`,
}

// Formulario propio (no `CambiarPassword` — esa se usa para cambiar la
// contraseña de OTRA cuenta y ya vive dentro de sus propios modales, ver
// ModalEditarCuenta/PanelBarberos — anidar un modal dentro de otro no tiene
// sentido) para que el cambio de la contraseña PROPIA se abra en su propia
// card difuminada, en vez de expandirse inline en la página.
function FormularioCambiarPassword({ onGuardado }) {
  const [password, setPassword] = useState('')
  const [estado, setEstado] = useState(null)

  async function guardar(evento) {
    evento.preventDefault()
    const limpia = password.trim()
    if (!limpia) return
    if (limpia.length < LARGO_MINIMO_PASSWORD) {
      setEstado('debil')
      return
    }
    setEstado('guardando')
    try {
      await cambiarPasswordPropia(limpia)
      setEstado('guardado')
      setTimeout(onGuardado, 900)
    } catch {
      setEstado('error')
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-3">
      <label className="flex flex-col gap-2">
        <span className="versalitas text-xs text-gris-calido-500 max-md:text-[13px]">Nueva contraseña</span>
        <input
          type="text"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-base text-negro-barbero outline-none transition-colors focus:border-cobre"
        />
      </label>
      <button
        type="submit"
        disabled={estado === 'guardando'}
        className="mt-1 rounded-md bg-cobre-oscuro px-4 py-2.5 text-sm font-semibold text-hueso transition-[filter] hover:brightness-110 disabled:opacity-70 max-md:min-h-12 max-md:rounded-xl max-md:text-base"
      >
        {estado === 'guardando' ? 'Guardando…' : 'Guardar'}
      </button>
      {estado && (
        <span className={`versalitas text-xs max-md:text-[13px] ${estado === 'error' || estado === 'debil' ? 'text-red-700' : 'text-verde-barberia'}`}>
          {ESTADOS_PASSWORD[estado]}
        </span>
      )}
    </form>
  )
}

// Todo lo que la propia persona logueada puede configurar de SU cuenta —
// separado de PanelBarberos/PanelSuperadminBarberiaDetalle, que manejan la
// cuenta de OTROS. Una sola página, reusada por los 3 paneles (barbero,
// dueño, superadmin) vía sus propias rutas — el contenido es el mismo para
// cualquier rol.
export function PanelCuenta() {
  const { perfil, vincularGoogle, googleVinculado } = useAuth()
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false)

  async function alVincularGoogle() {
    try {
      await vincularGoogle()
    } catch {
      /* Igual que en PanelShell: si Supabase rechaza el intento, el
         navegador nunca llega a redirigir a Google — no hay nada que avisar. */
    }
  }

  return (
    <div className="flex flex-col gap-7 md:gap-8">
      <div>
        <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero max-md:text-[28px] max-md:leading-tight">Configuración</h1>
        <p className="mt-1 text-sm text-gris-calido-500 max-md:text-[15px]">Los ajustes de tu propia cuenta — nadie más los ve.</p>
      </div>

      <section className={CLASE_SECCION}>
        <h2 className={CLASE_TITULO_SECCION}>Datos de la cuenta</h2>
        <dl className="mt-3 flex flex-col gap-2 text-sm max-md:mt-0 max-md:gap-0 max-md:divide-y max-md:divide-gris-calido-100 max-md:rounded-2xl max-md:border max-md:border-gris-calido-200 max-md:bg-white max-md:text-base">
          <div className="flex gap-2 max-md:min-h-14 max-md:items-center max-md:justify-between max-md:gap-4 max-md:px-4">
            <dt className="text-gris-calido-500 max-md:shrink-0">Nombre</dt>
            <dd className="text-negro-barbero max-md:min-w-0 max-md:truncate max-md:text-right">{perfil?.nombre}</dd>
          </div>
          <div className="flex gap-2 max-md:min-h-14 max-md:items-center max-md:justify-between max-md:gap-4 max-md:px-4">
            <dt className="text-gris-calido-500 max-md:shrink-0">Usuario</dt>
            <dd className="text-negro-barbero max-md:min-w-0 max-md:truncate max-md:text-right">{perfil?.usuario}</dd>
          </div>
        </dl>
      </section>

      <section className={CLASE_SECCION}>
        <h2 className={CLASE_TITULO_SECCION}>Contraseña</h2>
        <p className={CLASE_NOTA_SECCION}>Cámbiala cuando quieras, sin avisarle a nadie.</p>
        <button
          type="button"
          onClick={() => setModalPasswordAbierto(true)}
          className={`${CLASE_FILA_ACCION} max-md:border-gris-calido-200`}
        >
          <IconoLlave className="h-4 w-4 max-md:h-5 max-md:w-5 max-md:text-cobre-texto" />
          Cambiar contraseña
          <span aria-hidden="true" className="ml-auto text-2xl leading-none text-gris-calido-400 md:hidden">
            ›
          </span>
        </button>
      </section>

      {/* Opcional para todos los roles: quien lo activa queda obligado a
          pasar por el código en cada sesión (lo exige la base, ver
          `mi_perfil()`). No tiene sentido en modo de prueba — no hay backend
          de Auth real contra el que inscribir un factor. */}
      {HAY_BACKEND_REAL && perfil && <SeccionAutenticacionDosPasos />}

      {/* Superadmin no recibe reservas — solo barbero y dueño. */}
      {HAY_BACKEND_REAL && perfil && perfil.rol_id !== ROL_SUPERADMIN && <SeccionNotificaciones />}

      {vincularGoogle && (
        <section className={CLASE_SECCION}>
          <h2 className={CLASE_TITULO_SECCION}>Inicio de sesión con Google</h2>
          <p className={CLASE_NOTA_SECCION}>
            {googleVinculado
              ? 'Ya puedes entrar con tu cuenta de Google, además de tu usuario y contraseña.'
              : 'Vincula tu cuenta de Google para poder entrar con ella, sin dejar de usar tu usuario y contraseña.'}
          </p>
          <button
            type="button"
            onClick={alVincularGoogle}
            disabled={googleVinculado}
            className={CLASE_FILA_ACCION}
          >
            <IconoGoogle className="h-4 w-4 max-md:h-5 max-md:w-5" />
            {googleVinculado ? 'Google vinculado' : 'Vincular con Google'}
          </button>
        </section>
      )}

      <ModalFormulario
        abierto={modalPasswordAbierto}
        titulo="Cambiar contraseña"
        onCerrar={() => setModalPasswordAbierto(false)}
      >
        <FormularioCambiarPassword onGuardado={() => setModalPasswordAbierto(false)} />
      </ModalFormulario>
    </div>
  )
}
