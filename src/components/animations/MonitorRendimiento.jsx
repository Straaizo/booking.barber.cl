import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const VENTANA_MEDICION_S = 2 // cuánto tiempo se mide antes de decidir
const CALENTAMIENTO_S = 0.2 // se ignoran los primeros ms (compilación de shaders, etc.)

// Vive dentro del <Canvas>. Mide el frame rate real durante los primeros
// segundos y avisa una sola vez si el promedio queda bajo el umbral — así el
// fallback a la ilustración estática se decide con un dato real del equipo
// del visitante, no con una suposición de "mobile = siempre débil".
export function MonitorRendimiento({ umbralFps = 50, onRendimientoBajo }) {
  const cuadros = useRef(0)
  const tiempoTranscurrido = useRef(0)
  const yaDecidido = useRef(false)

  useFrame((_, delta) => {
    if (yaDecidido.current) return

    tiempoTranscurrido.current += delta
    if (tiempoTranscurrido.current < CALENTAMIENTO_S) return

    cuadros.current += 1
    const tiempoMedido = tiempoTranscurrido.current - CALENTAMIENTO_S

    if (tiempoMedido >= VENTANA_MEDICION_S) {
      yaDecidido.current = true
      const fpsPromedio = cuadros.current / tiempoMedido
      if (fpsPromedio < umbralFps) {
        onRendimientoBajo?.(fpsPromedio)
      }
    }
  })

  return null
}
