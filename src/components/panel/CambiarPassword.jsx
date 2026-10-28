import { useEffect, useState } from 'react'
import { IconoLlave } from './IconoLlave'

// Mismo mínimo que valida la Edge Function `gestionar-usuario` (fuente de
// verdad real) — repetido acá solo para avisar antes de gastar una llamada
// al servidor, nunca como el único lugar que lo exige.
const LARGO_MINIMO_PASSWORD = 8

const ESTADOS_PASSWORD = {
  guardando: 'Guardando…',
  guardado: 'Contraseña actualizada',
  error: 'No se pudo guardar',
  debil: `Mínimo ${LARGO_MINIMO_PASSWORD} caracteres`,
}

// Control para cambiar la contraseña de una cuenta ya existente — el dueño
// (o superadmin) la escribe él mismo, nunca una generada al azar: tiene que
// poder ser algo que la persona use de inmediato, sin depender de que
// alguien le dicte una cadena rara. Colapsado por defecto para no ensuciar
// la tarjeta.
export function CambiarPassword({ onGuardar }) {
  const [abierto, setAbierto] = useState(false)
  const [password, setPassword] = useState('')
  const [estado, setEstado] = useState(null)

  useEffect(() => {
    if (estado !== 'guardado') return
    const temporizador = setTimeout(() => {
      setEstado(null)
      setAbierto(false)
    }, 1500)
    return () => clearTimeout(temporizador)
  }, [estado])

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
      await onGuardar(limpia)
      setEstado('guardado')
      setPassword('')
    } catch {
      setEstado('error')
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1.5 text-xs text-gris-calido-500 transition-colors hover:text-cobre-texto md:font-semibold md:uppercase md:tracking-[0.07em] max-md:min-h-11 max-md:grow max-md:basis-[40%] max-md:justify-center max-md:gap-2 max-md:rounded-xl max-md:border max-md:border-gris-calido-200 max-md:text-[15px] max-md:text-negro-barbero max-md:active:bg-gris-calido-100"
      >
        <IconoLlave className="h-3.5 w-3.5 max-md:h-4 max-md:w-4 max-md:text-gris-calido-500" />
        <span className="md:hidden">Contraseña</span>
        <span className="max-md:hidden">Cambiar contraseña</span>
      </button>
    )
  }

  return (
    <form onSubmit={guardar} className="flex flex-wrap items-center gap-2 max-md:w-full max-md:basis-full">
      <input
        type="text"
        name="password_nueva"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Nueva contraseña"
        className="min-h-9 w-40 border-b border-gris-calido-200 bg-transparent py-1 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre max-md:min-h-12 max-md:w-full max-md:rounded-xl max-md:border max-md:bg-hueso/60 max-md:px-3.5"
      />
      <button
        type="submit"
        disabled={estado === 'guardando'}
        className="text-xs text-cobre-texto transition-colors hover:text-cobre disabled:opacity-50 md:font-semibold md:uppercase md:tracking-[0.07em] max-md:min-h-11 max-md:grow max-md:basis-[40%] max-md:rounded-xl max-md:bg-cobre-oscuro max-md:text-[15px] max-md:font-semibold max-md:text-hueso"
      >
        Guardar
      </button>
      <button
        type="button"
        onClick={() => {
          setAbierto(false)
          setPassword('')
        }}
        className="text-xs text-gris-calido-500 transition-colors hover:text-negro-barbero md:font-semibold md:uppercase md:tracking-[0.07em] max-md:min-h-11 max-md:grow max-md:basis-[40%] max-md:rounded-xl max-md:border max-md:border-gris-calido-200 max-md:text-[15px] max-md:text-negro-barbero"
      >
        Cancelar
      </button>
      {estado && (
        <span className={`versalitas text-xs max-md:w-full max-md:text-[13px] ${estado === 'error' || estado === 'debil' ? 'text-red-700' : 'text-verde-barberia'}`}>
          {ESTADOS_PASSWORD[estado]}
        </span>
      )}
    </form>
  )
}
