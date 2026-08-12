import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { useTienePunteroFino } from '../../hooks/useTienePunteroFino'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { CursorFlecha } from './CursorFlecha'
import { CursorManoIndice } from './CursorManoIndice'

const TIPOS_CAMPO_TEXTO_EXCLUIDOS = ['checkbox', 'radio', 'range', 'button', 'submit', 'reset']

// Cada tipo de elemento tiene su propia forma, calcada de los cursores
// clásicos del sistema pero con la paleta del sitio: default = la flecha de
// toda la vida (CursorFlecha); botón/link = la mano del cursor "pointer"
// (CursorManoIndice); campo de texto = una barra vertical angosta, como un
// caret de texto. Flecha y mano comparten tamaño de contenedor y colores
// (hueso + negro-barbero) — son la misma familia de cursor, no dos estilos
// distintos.
function detectarTipo(elemento) {
  if (!elemento) return 'default'
  if (elemento.closest('[data-cursor="boton"]')) return 'boton'

  const campo = elemento.closest('input, textarea')
  if (campo) {
    return TIPOS_CAMPO_TEXTO_EXCLUIDOS.includes(campo.type) ? 'boton' : 'texto'
  }

  if (elemento.closest('button, [role="button"], [data-cursor-hover]')) return 'boton'
  if (elemento.closest('a')) return 'enlace'
  return 'default'
}

const CONFIG_BARRA_TEXTO = { width: 3, height: 30, borderRadius: 2, backgroundColor: 'rgba(168,92,50,0.8)', borderColor: 'rgba(168,92,50,0)', borderWidth: 0 }
const COLOR_CURSOR = '#ffe6ca'

// Cursor propio: sigue al mouse en la misma posición real, sin inercia ni
// resorte — cualquier suavizado de posición se siente como latencia, y la
// pauta explícita acá es cero delay, tan fluido como el cursor nativo del
// sistema (que tampoco tiene). `x`/`y` son motion values de Framer Motion:
// se actualizan por fuera del ciclo de render de React, aplicando el
// transform directo en cada frame — no hay de por medio ningún setState ni
// resorte que sume latencia. Solo se monta con puntero fino (mouse/trackpad)
// y sin prefers-reduced-motion — en touch o con movimiento reducido, el
// navegador usa el cursor nativo sin costo extra (nunca se oculta sin
// reemplazo: la detección es por capacidad de puntero, no por ancho de pantalla).
export function Cursor() {
  const tienePunteroFino = useTienePunteroFino()
  const prefiereReducido = usePrefersReducedMotion()
  const [tipo, setTipo] = useState('default')
  const [visible, setVisible] = useState(false)
  // Un iframe (como la vista previa de Personalización) es un documento
  // aparte: el mouse dentro de él no dispara `pointermove` en esta ventana,
  // así que este cursor se congelaría en el borde por donde entró. La
  // entrada/salida de un `<iframe>` sí dispara `pointerover`/`pointerout`
  // normales en el padre (son eventos de borde del elemento, no de
  // movimiento continuo) — con eso alcanza para ocultar este cursor mientras
  // el mouse esté ahí adentro, sin necesitar saber nada de esa ruta. Un
  // `ref` (no un estado) porque es un flag que solo lee el propio handler de
  // `pointermove`, sin que nada necesite volver a renderizar por su cambio.
  const sobreIframe = useRef(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)

  const activo = tienePunteroFino && !prefiereReducido

  // El aviso al iframe de que se acaba de ir el mouse (más abajo) es la
  // mitad que le faltaba a esto: `pointerleave` en la ventana del iframe
  // (para que SU PROPIO cursor se oculte solo) no siempre llega de forma
  // confiable al cruzar directo de vuelta al documento padre — sin ese
  // aviso, el cursor de adentro del iframe podía quedar prendido, encimado
  // con el de este documento, que se vuelve a mostrar apenas el mouse sale.
  // No hace falta el aviso contrario ("volviste a entrar"): el propio
  // `pointermove` real dentro del iframe ya lo revela solo.
  useEffect(() => {
    function alAvisoDeVisibilidad(evento) {
      if (evento.data?.tipo === 'cursor-propio-fuera-de-vista') setVisible(false)
    }
    window.addEventListener('message', alAvisoDeVisibilidad)
    return () => window.removeEventListener('message', alAvisoDeVisibilidad)
  }, [])

  useEffect(() => {
    if (!activo) return

    document.body.classList.add('tiene-cursor-propio')

    function moverPuntero(evento) {
      if (sobreIframe.current) return
      x.set(evento.clientX)
      y.set(evento.clientY)
      if (!visible) setVisible(true)
      setTipo(detectarTipo(evento.target))
    }

    function alEntrarAUnElemento(evento) {
      if (evento.target.tagName === 'IFRAME') {
        sobreIframe.current = true
        setVisible(false)
      }
    }

    function alSalirDeUnElemento(evento) {
      if (evento.target.tagName === 'IFRAME') {
        sobreIframe.current = false
        evento.target.contentWindow?.postMessage({ tipo: 'cursor-propio-fuera-de-vista' }, '*')
      }
    }

    function ocultar() {
      setVisible(false)
    }

    window.addEventListener('pointermove', moverPuntero)
    window.addEventListener('pointerleave', ocultar)
    window.addEventListener('pointerover', alEntrarAUnElemento)
    window.addEventListener('pointerout', alSalirDeUnElemento)
    return () => {
      document.body.classList.remove('tiene-cursor-propio')
      window.removeEventListener('pointermove', moverPuntero)
      window.removeEventListener('pointerleave', ocultar)
      window.removeEventListener('pointerover', alEntrarAUnElemento)
      window.removeEventListener('pointerout', alSalirDeUnElemento)
    }
  }, [activo, x, y, visible])

  if (!activo) return null

  const esMano = tipo === 'boton' || tipo === 'enlace'

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[100] border border-solid"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
        animate={{ ...CONFIG_BARRA_TEXTO, opacity: visible && tipo === 'texto' ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[100] w-[12px]"
        style={{ x, y, translateX: '-2%', translateY: '-3%' }}
        animate={{ opacity: visible && tipo === 'default' ? 1 : 0 }}
        transition={{ duration: 0.12 }}
      >
        <CursorFlecha color={COLOR_CURSOR} />
      </motion.div>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[100] w-[19px]"
        style={{ x, y, translateX: '-31%', translateY: '0%' }}
        animate={{ opacity: visible && esMano ? 1 : 0, scale: tipo === 'boton' ? 1.15 : 1 }}
        transition={{ duration: 0.12 }}
      >
        <CursorManoIndice color={COLOR_CURSOR} />
      </motion.div>
    </>
  )
}
