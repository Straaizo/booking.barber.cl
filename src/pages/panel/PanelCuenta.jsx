import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { ModalFormulario } from '../../components/panel/ModalFormulario'
import { cambiarPasswordPropia } from '../../services/authService'

const LARGO_MINIMO_PASSWORD = 8

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
        <span className="versalitas text-xs text-gris-calido-500">Nueva contraseña</span>
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
        className="mt-1 rounded-md bg-cobre-oscuro px-4 py-2.5 text-sm font-semibold text-hueso transition-[filter] hover:brightness-110 disabled:opacity-70"
      >
        {estado === 'guardando' ? 'Guardando…' : 'Guardar'}
      </button>
      {estado && (
        <span className={`versalitas text-xs ${estado === 'error' || estado === 'debil' ? 'text-red-700' : 'text-verde-barberia'}`}>
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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero">Configuración</h1>
        <p className="mt-1 text-sm text-gris-calido-500">Los ajustes de tu propia cuenta — nadie más los ve.</p>
      </div>

      <section className="rounded-lg border border-gris-calido-200 bg-white p-5">
        <h2 className="versalitas text-xs text-cobre">Datos de la cuenta</h2>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-gris-calido-500">Nombre</dt>
            <dd className="text-negro-barbero">{perfil?.nombre}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gris-calido-500">Usuario</dt>
            <dd className="text-negro-barbero">{perfil?.usuario}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-gris-calido-200 bg-white p-5">
        <h2 className="versalitas text-xs text-cobre">Contraseña</h2>
        <p className="mt-1 text-sm text-gris-calido-500">Cámbiala cuando quieras, sin avisarle a nadie.</p>
        <button
          type="button"
          onClick={() => setModalPasswordAbierto(true)}
          className="mt-3 rounded-md border border-gris-calido-200 px-4 py-2 text-sm text-negro-barbero transition-colors hover:border-cobre hover:text-cobre-texto"
        >
          Cambiar contraseña
        </button>
      </section>

      {vincularGoogle && (
        <section className="rounded-lg border border-gris-calido-200 bg-white p-5">
          <h2 className="versalitas text-xs text-cobre">Inicio de sesión con Google</h2>
          <p className="mt-1 text-sm text-gris-calido-500">
            {googleVinculado
              ? 'Ya podés entrar con tu cuenta de Google, además de tu usuario y contraseña.'
              : 'Vinculá tu cuenta de Google para poder entrar con ella, sin dejar de usar tu usuario y contraseña.'}
          </p>
          <button
            type="button"
            onClick={alVincularGoogle}
            disabled={googleVinculado}
            className="mt-3 rounded-md border border-gris-calido-200 px-4 py-2 text-sm text-negro-barbero transition-colors hover:border-cobre hover:text-cobre-texto disabled:opacity-50"
          >
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
