import { useEffect, useRef, useState } from 'react'
import { ModalFormulario } from '../../../components/panel/ModalFormulario'

const TAMANO_CIRCULO = 220

// La foto se dibuja más grande que el círculo (el mismo cálculo que hace
// `object-fit: cover` para decidir cuánto excede en cada eje) y se arrastra
// directo con el mouse/dedo dentro del círculo fijo — se ve en vivo
// exactamente el mismo recorte que va a quedar en el resto de la página, en
// vez de mover un número abstracto en una barra. `pan` son los píxeles que la
// imagen está corrida (siempre negativo o cero); `minX`/`minY` son el límite
// de cuánto se puede correr antes de dejar un hueco vacío en el círculo — la
// misma cuenta se usa después, al revés, para convertir el arrastre final a
// los porcentajes de `object-position` que se guardan.
export function ModalPosicionFoto({ abierto, fotoUrl, posicionInicial, onGuardar, onCerrar }) {
  const [dimensiones, setDimensiones] = useState(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const arrastre = useRef(null)

  useEffect(() => {
    if (abierto) setDimensiones(null)
  }, [abierto, fotoUrl])

  // Recién cuando se conocen las dimensiones reales de la foto (tras cargar)
  // se puede calcular dónde arranca el arrastre — a propósito no depende de
  // `posicionInicial` para no pisar un arrastre en curso si el componente
  // padre se vuelve a renderizar mientras tanto.
  useEffect(() => {
    if (!dimensiones) return
    const { anchoEscalado, altoEscalado } = dimensiones
    const minX = TAMANO_CIRCULO - anchoEscalado
    const minY = TAMANO_CIRCULO - altoEscalado
    const { x = 50, y = 50 } = posicionInicial ?? {}
    setPan({ x: (minX * x) / 100, y: (minY * y) / 100 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensiones])

  function alCargarImagen(evento) {
    const { naturalWidth, naturalHeight } = evento.target
    const escala = Math.max(TAMANO_CIRCULO / naturalWidth, TAMANO_CIRCULO / naturalHeight)
    setDimensiones({ anchoEscalado: naturalWidth * escala, altoEscalado: naturalHeight * escala })
  }

  function alEmpezarArrastre(evento) {
    if (!dimensiones) return
    evento.currentTarget.setPointerCapture(evento.pointerId)
    arrastre.current = { clientX: evento.clientX, clientY: evento.clientY, panInicial: pan }
  }

  function alArrastrar(evento) {
    if (!arrastre.current || !dimensiones) return
    const { anchoEscalado, altoEscalado } = dimensiones
    const minX = TAMANO_CIRCULO - anchoEscalado
    const minY = TAMANO_CIRCULO - altoEscalado
    const dx = evento.clientX - arrastre.current.clientX
    const dy = evento.clientY - arrastre.current.clientY
    setPan({
      x: Math.min(0, Math.max(minX, arrastre.current.panInicial.x + dx)),
      y: Math.min(0, Math.max(minY, arrastre.current.panInicial.y + dy)),
    })
  }

  function alSoltarArrastre() {
    arrastre.current = null
  }

  function guardar(evento) {
    evento.preventDefault()
    if (!dimensiones) {
      onCerrar()
      return
    }
    const { anchoEscalado, altoEscalado } = dimensiones
    const minX = TAMANO_CIRCULO - anchoEscalado
    const minY = TAMANO_CIRCULO - altoEscalado
    onGuardar({
      x: minX === 0 ? 50 : Math.round((pan.x / minX) * 100),
      y: minY === 0 ? 50 : Math.round((pan.y / minY) * 100),
    })
    onCerrar()
  }

  return (
    <ModalFormulario abierto={abierto} titulo="Ajustar foto" onCerrar={onCerrar}>
      <form onSubmit={guardar} className="flex flex-col gap-5">
        <p className="text-sm text-gris-calido-600">Arrastrá la foto para centrarla donde quieras.</p>

        <div
          className="relative mx-auto cursor-grab overflow-hidden rounded-full border border-gris-calido-200 bg-gris-calido-100 active:cursor-grabbing"
          style={{ width: TAMANO_CIRCULO, height: TAMANO_CIRCULO, touchAction: 'none' }}
          onPointerDown={alEmpezarArrastre}
          onPointerMove={alArrastrar}
          onPointerUp={alSoltarArrastre}
          onPointerCancel={alSoltarArrastre}
        >
          {fotoUrl && (
            <img
              src={fotoUrl}
              alt=""
              draggable={false}
              onLoad={alCargarImagen}
              className={dimensiones ? 'absolute select-none' : 'absolute inset-0 h-full w-full object-cover'}
              style={
                dimensiones
                  ? {
                      // Tailwind preflight le pone `max-width: 100%` a todo
                      // `<img>` — sin anularlo acá, el navegador recorta el
                      // ancho al del círculo (100% de su contenedor) aunque
                      // el `width` de acá abajo diga otra cosa, y la imagen
                      // queda más chica de lo que debería (deja un hueco
                      // vacío en el círculo en vez de excederlo).
                      maxWidth: 'none',
                      width: dimensiones.anchoEscalado,
                      height: dimensiones.altoEscalado,
                      left: pan.x,
                      top: pan.y,
                    }
                  : undefined
              }
            />
          )}
        </div>

        <button
          type="submit"
          className="rounded-md bg-cobre-oscuro px-4 py-2.5 text-sm font-semibold text-hueso transition-[filter] hover:brightness-110"
        >
          Guardar
        </button>
      </form>
    </ModalFormulario>
  )
}
