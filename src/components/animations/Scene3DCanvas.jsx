import { Canvas } from '@react-three/fiber'
import { BarberPoleModel } from './BarberPoleModel'

export default function Scene3DCanvas() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.3, 6.2], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
    >
      {/* Ambiente bajo a propósito: la escena vive del contraste key/rim, no de luz plana */}
      <ambientLight intensity={0.35} />
      {/* Key cálida, como una lámpara de barbería sobre el poste */}
      <directionalLight position={[3, 4.5, 3.5]} intensity={2} color="#ffd9a8" castShadow />
      {/* Rim cobre desde atrás: separa el poste del fondo oscuro con un borde encendido */}
      <directionalLight position={[-2.5, 1.5, -4]} intensity={1.1} color="#c9793f" />
      {/* Relleno frío tenue para que el lado en sombra no se pierda del todo */}
      <pointLight position={[-1, -0.5, 3]} intensity={0.25} color="#5b6b78" />
      <BarberPoleModel />
    </Canvas>
  )
}
