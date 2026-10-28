import { useEffect, useState } from 'react'
import { ES_APP_INSTALADA, ES_IOS, activarPush, desactivarPush, pushActivo, soportaPush } from '../../../services/pushService'

const MENSAJES_ERROR = {
  denegado: 'Bloqueaste las notificaciones. Actívalas en los ajustes del navegador para este sitio.',
  cancelado: 'No se activaron. Vuelve a intentarlo y acepta el permiso.',
  error: 'No se pudo completar. Intenta de nuevo.',
}

// Push por dispositivo: se activa en cada celular/PC donde se quiera recibir
// el aviso de reserva nueva.
export function SeccionNotificaciones() {
  const [activo, setActivo] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState(null)
  const soportado = soportaPush()

  useEffect(() => {
    if (!soportado) return
    pushActivo()
      .then(setActivo)
      .catch(() => setActivo(false))
  }, [soportado])

  async function alternar() {
    setProcesando(true)
    setError(null)
    try {
      if (activo) {
        await desactivarPush()
        setActivo(false)
      } else {
        await activarPush()
        setActivo(true)
      }
    } catch (err) {
      setError(MENSAJES_ERROR[err.message] ? err.message : 'error')
    } finally {
      setProcesando(false)
    }
  }

  let descripcion
  if (!soportado) {
    descripcion =
      ES_IOS && !ES_APP_INSTALADA
        ? 'En iPhone primero agrega la app a tu pantalla de inicio (Compartir → Agregar a inicio), ábrela desde ahí y activa las notificaciones.'
        : 'Este navegador no permite notificaciones.'
  } else if (activo) {
    descripcion = 'Este dispositivo recibe un aviso cada vez que entra una reserva nueva.'
  } else {
    descripcion = 'Recibe un aviso en este dispositivo cada vez que entra una reserva nueva.'
  }

  return (
    <section className="rounded-lg border border-gris-calido-200 bg-white p-5">
      <h2 className="versalitas text-xs text-cobre">Notificaciones</h2>
      <p className="mt-1 text-sm text-gris-calido-500">{descripcion}</p>
      {soportado && (
        <button
          type="button"
          onClick={alternar}
          disabled={procesando || activo === null}
          className="mt-3 flex items-center gap-2 rounded-md border border-gris-calido-200 px-4 py-2 text-sm text-negro-barbero transition-colors hover:border-cobre hover:text-cobre-texto disabled:opacity-50"
        >
          {procesando ? 'Procesando…' : activo ? 'Desactivar en este dispositivo' : 'Activar notificaciones'}
        </button>
      )}
      {error && <p className="versalitas mt-2 text-xs text-red-700">{MENSAJES_ERROR[error]}</p>}
    </section>
  )
}
