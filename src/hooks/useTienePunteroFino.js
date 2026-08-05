import { useEffect, useState } from 'react'

export function useTienePunteroFino() {
  const [tienePunteroFino, setTienePunteroFino] = useState(false)

  useEffect(() => {
    const medio = window.matchMedia('(hover: hover) and (pointer: fine)')
    const actualizar = (evento) => setTienePunteroFino(evento.matches)
    actualizar(medio)
    medio.addEventListener('change', actualizar)
    return () => medio.removeEventListener('change', actualizar)
  }, [])

  return tienePunteroFino
}
