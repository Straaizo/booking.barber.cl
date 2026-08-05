/*
Modelo 3D "Barbers Pole" por Vinny Passmore (https://sketchfab.com/HPrendering)
Fuente: https://sketchfab.com/3d-models/barbers-pole-e5eb506d8d5c4cd5a775028a4a3e1d58
Licencia: CC BY 4.0 (http://creativecommons.org/licenses/by/4.0/) — atribución visible en el footer.
*/
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import modelUrl from '../../assets/models-3d/barbers_pole.glb'

const TARGET_HEIGHT = 2.7
const STATIC_ROTATION_Y = 1.3
const FLOAT_AMPLITUDE = 0.1
const FLOAT_SPEED = 1.8


export function BarberPoleModel() {
  const orbitGroup = useRef()
  const fitGroup = useRef()
  const { nodes, materials, animations } = useGLTF(modelUrl)
  const { actions, names } = useAnimations(animations, fitGroup)

  // Reproduce la animación original del modelo: el cilindro rayado interior
  // girando dentro del vidrio, el efecto clásico del poste de barbero.
  useEffect(() => {
    const action = actions[names[0]]
    action?.reset().play()
  }, [actions, names])

  // La luz superior brilla más de lo que el material PBR muestra por defecto;
  // toneMapped=false evita que el tone mapping le quite el "glow" contra el fondo oscuro.
  useEffect(() => {
    if (materials.Light_Top) {
      materials.Light_Top.emissiveIntensity = 2.4
      materials.Light_Top.toneMapped = false
    }
  }, [materials])

  // El modelo viene con una escala/orientación propia del export original (Blender → Sketchfab).
  // En vez de hardcodear números "mágicos", se centra y escala en tiempo real según su bounding box real.
  useEffect(() => {
    if (!fitGroup.current) return
    fitGroup.current.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(fitGroup.current)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const scale = TARGET_HEIGHT / size.y
    fitGroup.current.scale.setScalar(scale)
    fitGroup.current.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
  }, [])

  // Sin rotación: el poste queda quieto en un ángulo fijo, solo flota suavemente en el eje Y.
  // Se combinan dos senos de distinta frecuencia para que el vaivén se sienta orgánico, no como
  // un metrónomo.
  useFrame((state) => {
    if (!orbitGroup.current) return
    const t = state.clock.elapsedTime
    orbitGroup.current.position.y =
      Math.sin(t * FLOAT_SPEED) * FLOAT_AMPLITUDE +
      Math.sin(t * FLOAT_SPEED * 1.9 + 1) * FLOAT_AMPLITUDE * 0.25
  })

  return (
    <group ref={orbitGroup} rotation={[0, STATIC_ROTATION_Y, 0]}>
      <group ref={fitGroup} dispose={null}>
        <group name="Inner" rotation={[-Math.PI / 2, 0, 0]} scale={100}>
          <mesh geometry={nodes.Inner_Inner_Mat_0.geometry} material={materials.Inner_Mat} />
        </group>
        <group name="Ouiter" rotation={[-Math.PI / 2, 0, 0]} scale={100}>
          <mesh geometry={nodes.Ouiter_Metal12_0.geometry} material={materials.Metal12} />
          <mesh geometry={nodes.Ouiter_Easy_Glass_0.geometry} material={materials.Easy_Glass} />
          <mesh geometry={nodes.Ouiter_Light_Top_0.geometry} material={materials.Light_Top} />
        </group>
      </group>
    </group>
  )
}

useGLTF.preload(modelUrl)
