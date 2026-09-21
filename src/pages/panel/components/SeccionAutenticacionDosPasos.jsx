import { useEffect, useState } from 'react'
import { ModalConfirmacion } from '../../../components/panel/ModalConfirmacion'
import { IconoCandado } from '../../../components/panel/IconoCandado'
import { IconoX } from '../../../components/panel/IconoX'
import { CampoCodigoOTP } from '../../../components/common/CampoCodigoOTP'
import {
  listarFactoresTotp,
  empezarInscripcion,
  confirmarCodigo,
  desactivarFactor,
} from '../../../services/mfaService'

function formatoFecha(iso) {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Solo para superadmin (ver el chequeo en PanelCuenta) — cualquier app TOTP
// sirve (Google Authenticator, Microsoft Authenticator, Authy, etc.), no hay
// nada específico de una marca acá: es el mismo estándar para todas. Una vez
// hay al menos un factor activo, RutaProtegida exige el código en cada
// sesión nueva antes de dejar entrar a /admin — acá solo se administran los
// factores en sí (se pueden tener varios, ej: celular + respaldo).
//
// Lista TODOS los factores (verificados y a medio inscribir) — antes solo
// se mostraba/administraba uno solo, así que un factor duplicado o
// abandonado a mitad de camino (la pestaña se cerró antes de confirmar el
// código) quedaba invisible en este panel aunque siguiera existiendo en la
// cuenta.
export function SeccionAutenticacionDosPasos() {
  const [cargando, setCargando] = useState(true)
  const [factores, setFactores] = useState([])
  const [inscripcion, setInscripcion] = useState(null) // { id, totp: { qr_code, secret } } mientras se inscribe
  const [error, setError] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [factorAQuitar, setFactorAQuitar] = useState(null)
  const [intento, setIntento] = useState(0) // cambia para remontar CampoCodigoOTP tras un código incorrecto

  async function recargar() {
    try {
      const lista = await listarFactoresTotp()
      setFactores(lista)
    } catch {
      setError('No pudimos revisar el estado actual.')
    }
  }

  useEffect(() => {
    recargar().finally(() => setCargando(false))
  }, [])

  async function empezar() {
    setError(null)
    setProcesando(true)
    try {
      const datos = await empezarInscripcion()
      setInscripcion(datos)
    } catch (e) {
      setError(e.message || 'No pudimos empezar la activación.')
    } finally {
      setProcesando(false)
    }
  }

  async function confirmar(codigo) {
    setError(null)
    setProcesando(true)
    try {
      await confirmarCodigo(inscripcion.id, codigo)
      setInscripcion(null)
      await recargar()
    } catch {
      setError('Código incorrecto — revisa la hora de tu celular y vuelve a intentar.')
      setIntento((n) => n + 1)
    } finally {
      setProcesando(false)
    }
  }

  // Deja el factor a medio inscribir sin confirmar — no queda activo (no
  // cuenta como factor real hasta que un código lo confirme), pero tampoco
  // hay que dejarlo huérfano ocupando el cupo.
  async function cancelarInscripcion() {
    await desactivarFactor(inscripcion.id).catch(() => {})
    setInscripcion(null)
    setError(null)
  }

  async function confirmarQuitar() {
    setProcesando(true)
    setError(null)
    try {
      await desactivarFactor(factorAQuitar.id)
      setFactorAQuitar(null)
      await recargar()
    } catch (e) {
      setError(e.message || 'No pudimos quitarlo.')
    } finally {
      setProcesando(false)
    }
  }

  const hayVerificados = factores.some((f) => f.status === 'verified')

  return (
    <section className="rounded-lg border border-gris-calido-200 bg-white p-5">
      <h2 className="versalitas text-xs text-cobre">Verificación en dos pasos</h2>
      <p className="mt-1 text-sm text-gris-calido-500">
        Además de tu contraseña, pide un código de 6 dígitos de tu app de autenticación (Google
        Authenticator, Microsoft Authenticator, Authy, la que uses) en cada sesión nueva. En la app
        vas a ver la cuenta como <span className="numeros-tabulares">Booking Barber</span> — el
        correo que aparece debajo es un identificador técnico interno, no uno real.
      </p>

      {cargando ? (
        <p className="mt-3 text-sm text-gris-calido-400">Revisando…</p>
      ) : (
        <>
          {factores.length > 0 && (
            <ul className="mt-4 flex flex-col divide-y divide-gris-calido-100 border-y border-gris-calido-100">
              {factores.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    {f.status === 'verified' ? (
                      <>
                        <IconoCandado className="h-4 w-4 shrink-0 text-verde-barberia" />
                        <span className="text-negro-barbero">Activa desde el {formatoFecha(f.created_at)}</span>
                      </>
                    ) : (
                      <span className="text-gris-calido-500">Sin confirmar — no llegó a activarse</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFactorAQuitar(f)}
                    aria-label="Quitar"
                    className="flex items-center gap-1.5 text-xs text-red-700 underline decoration-red-700/40 hover:decoration-red-700"
                  >
                    <IconoX className="h-3.5 w-3.5" />
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          {inscripcion ? (
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <img
                  src={inscripcion.totp.qr_code}
                  alt="Código QR para activar la verificación en dos pasos"
                  className="h-36 w-36 shrink-0 rounded-md border border-gris-calido-200"
                />
                <div className="text-sm text-gris-calido-700">
                  <p>Escanea el código con tu app de autenticación.</p>
                  <p className="mt-2">¿No puedes escanear? Ingresa esta clave a mano:</p>
                  <p className="numeros-tabulares mt-1 break-all rounded bg-gris-calido-100 px-2 py-1 text-xs text-negro-barbero">
                    {inscripcion.totp.secret}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="versalitas text-xs text-gris-calido-500">Código de la app</span>
                <CampoCodigoOTP key={intento} onCompleto={confirmar} deshabilitado={procesando} />
                {procesando && <span className="versalitas text-xs text-gris-calido-400">Confirmando…</span>}
              </div>

              <button
                type="button"
                onClick={cancelarInscripcion}
                disabled={procesando}
                className="versalitas w-fit text-xs text-gris-calido-500 hover:text-negro-barbero"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={empezar}
              disabled={procesando}
              className="mt-4 flex items-center gap-2 rounded-md border border-gris-calido-200 px-4 py-2 text-sm text-negro-barbero transition-colors hover:border-cobre hover:text-cobre-texto disabled:opacity-60"
            >
              <IconoCandado className="h-4 w-4" />
              {procesando ? 'Un momento…' : hayVerificados ? 'Agregar otro dispositivo' : 'Activar verificación en dos pasos'}
            </button>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <ModalConfirmacion
        abierto={Boolean(factorAQuitar)}
        titulo="Quitar factor de verificación"
        mensaje={
          factorAQuitar?.status === 'verified' && factores.filter((f) => f.status === 'verified').length === 1
            ? 'Es el único activo — tu cuenta quedará protegida solo con la contraseña. ¿Confirmas que quieres quitarlo?'
            : '¿Confirmas que quieres quitarlo?'
        }
        textoConfirmar="Sí, quitar"
        variante="peligro"
        confirmando={procesando}
        onConfirmar={confirmarQuitar}
        onCerrar={() => setFactorAQuitar(null)}
      />
    </section>
  )
}
