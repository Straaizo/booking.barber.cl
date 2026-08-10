import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { cerrarSesion, verificarBarberiaActiva } from '../../../services/authService'

// Toda la lógica de autenticación del login vive acá — una sola vez, la usan
// tanto la composición desktop como la mobile. La UI solo llama `enviar` y
// lee `enviando`/`error`.
export function useLogin() {
  const { iniciarSesion, perfil, autenticado } = useAuth()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null) // { tipo, mensaje } | null
  const intentoPropioRef = useRef(false)

  const enviar = useCallback(
    async (datos) => {
      if (intentoPropioRef.current) return // doble click/Enter no dispara dos veces
      intentoPropioRef.current = true
      setEnviando(true)
      setError(null)
      try {
        await iniciarSesion(datos)
        // onAuthStateChange carga el perfil solo; el efecto de abajo lo revisa
        // en cuanto esté disponible.
      } catch (err) {
        setError({ tipo: err.tipo ?? 'desconocido', mensaje: err.message })
        setEnviando(false)
        intentoPropioRef.current = false
      }
    },
    [iniciarSesion]
  )

  useEffect(() => {
    if (!intentoPropioRef.current || !autenticado || !perfil) return

    const errorBarberia = verificarBarberiaActiva(perfil)
    if (errorBarberia) {
      cerrarSesion()
      setError({ tipo: errorBarberia.tipo, mensaje: errorBarberia.message })
    }
    // Si no hay error, se deja pasar — el componente que use este hook debe
    // tener su propio efecto de redirección basado en `autenticado`/`perfil`
    // (ya existe en AuthContext/rutaPorRol).
    setEnviando(false)
    intentoPropioRef.current = false
  }, [autenticado, perfil])

  return { enviar, enviando, error }
}
