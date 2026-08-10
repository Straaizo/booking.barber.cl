// === LOGIN — VERSIÓN DESKTOP ===
// Panel izquierdo: carrusel de imágenes a sangrado con crossfade + slogan
// enmascarado. Panel derecho: formulario. La lógica de ambos (carrusel y
// autenticación) vive en shared/ — acá solo se decide cómo se ve en desktop.
import { useState } from 'react'
import { motion } from 'framer-motion'
import { HoverLink } from '../../../components/common/HoverLink'
import { ImagenCarrusel } from '../shared/ImagenCarrusel'
import { TextoSlogan } from '../shared/TextoSlogan'
import { FormularioAcceso } from '../shared/FormularioAcceso'
import { useCarruselLogin } from '../shared/useCarruselLogin'
import { SLIDES_LOGIN, DURACION_SLIDE_MS, DURACION_TRANSICION_MS } from '../data/slides'

export function LoginDesktop() {
  const [escribiendo, setEscribiendo] = useState(false)
  const { indiceImagen, indiceTexto, secundariasListas, rotando } = useCarruselLogin(
    SLIDES_LOGIN.length,
    { pausado: escribiendo }
  )
  const slideTexto = SLIDES_LOGIN[indiceTexto]

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative overflow-hidden bg-negro-barbero">
        <div className="absolute inset-0">
          {SLIDES_LOGIN.map((slide, indice) => {
            if (indice !== 0 && !secundariasListas) return null
            return (
              <motion.div
                key={slide.id}
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: indiceImagen === indice ? 1 : 0 }}
                transition={{ duration: DURACION_TRANSICION_MS / 1000, ease: 'easeInOut' }}
              >
                <ImagenCarrusel
                  slide={slide}
                  prioritaria={indice === 0}
                  esMovil={false}
                  className="h-full w-full object-cover"
                />
              </motion.div>
            )
          })}
        </div>

        {/* Overlay parejo: el texto nunca depende de qué imagen esté visible
            para seguir siendo legible, en ningún frame de la transición. */}
        <div className="absolute inset-0 bg-gradient-to-t from-negro-barbero/95 via-negro-barbero/60 to-negro-barbero/35" />

        <div className="relative z-10 flex h-full min-h-screen flex-col justify-between px-10 py-12 text-hueso md:px-14 md:py-16">
          <HoverLink href="/" className="w-fit font-display text-lg italic tracking-tight">
            booking<span className="text-cobre-claro">.</span>barber.cl
          </HoverLink>

          <TextoSlogan
            id={slideTexto.id}
            texto={slideTexto.slogan}
            className="max-w-md font-display text-4xl font-light leading-[1.1] tracking-tight md:text-5xl"
          />

          <p className="versalitas text-xs text-gris-calido-300">Un proyecto de Emia Studios</p>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 h-px bg-hueso/10">
          {rotando && (
            <motion.div
              key={indiceImagen}
              className="h-full bg-cobre-claro/50"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: DURACION_SLIDE_MS / 1000, ease: 'linear' }}
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-center bg-hueso px-6 py-14 md:px-14">
        <div className="w-full max-w-sm">
          <span className="versalitas text-xs text-cobre-texto">— Acceso al panel</span>
          <h2 className="font-display mt-2 text-3xl font-light tracking-tight text-negro-barbero">
            Ingresar
          </h2>
          <FormularioAcceso onEscribiendo={setEscribiendo} className="mt-9" />
        </div>
      </div>
    </div>
  )
}
