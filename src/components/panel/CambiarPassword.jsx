import { useEffect, useState } from 'react'

const ESTADOS_PASSWORD = {
  guardando: 'Guardando…',
  guardado: 'Contraseña actualizada',
  error: 'No se pudo guardar',
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
    if (!password.trim()) return
    setEstado('guardando')
    try {
      await onGuardar(password.trim())
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
        className="versalitas text-xs text-gris-calido-500 transition-colors hover:text-cobre-texto"
      >
        Cambiar contraseña
      </button>
    )
  }

  return (
    <form onSubmit={guardar} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        name="password_nueva"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Nueva contraseña"
        className="min-h-9 w-40 border-b border-gris-calido-200 bg-transparent py-1 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
      />
      <button
        type="submit"
        disabled={estado === 'guardando'}
        className="versalitas text-xs text-cobre-texto transition-colors hover:text-cobre disabled:opacity-50"
      >
        Guardar
      </button>
      <button
        type="button"
        onClick={() => {
          setAbierto(false)
          setPassword('')
        }}
        className="versalitas text-xs text-gris-calido-500 transition-colors hover:text-negro-barbero"
      >
        Cancelar
      </button>
      {estado && (
        <span className={`versalitas text-xs ${estado === 'error' ? 'text-red-700' : 'text-verde-barberia'}`}>
          {ESTADOS_PASSWORD[estado]}
        </span>
      )}
    </form>
  )
}
