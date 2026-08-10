// === LOGIN — VERSIÓN MÓVIL ===
// No es el desktop encogido: el panel de imagen es una franja superior que se
// achica cuando hay un campo con foco (para que el botón nunca quede tapado
// por el teclado virtual), tipografía y espaciados propios para 375-428px, y
// menos elementos animados a la vez que en desktop.
import { useState } from 'react'
import { motion } from 'framer-motion'
import { HoverLink } from '../../../components/common/HoverLink'
import { ImagenCarrusel } from '../shared/ImagenCarrusel'
import { TextoSlogan } from '../shared/TextoSlogan'
import { FormularioAcceso } from '../shared/FormularioAcceso'
import { useCarruselLogin } from '../shared/useCarruselLogin'
import { SLIDES_LOGIN, DURACION_SLIDE_MS, DURACION_TRANSICION_MS } from '../data/slides'

export function LoginMobile() {
  const [campoConFoco, setCampoConFoco] = useState(false)
  const [escribiendo, setEscribiendo] = useState(false)
  const { indiceImagen, indiceTexto, secundariasListas, rotando } = useCarruselLogin(
    SLIDES_LOGIN.length,
    { pausado: escribiendo }
  )
  const slideTexto = SLIDES_LOGIN[indiceTexto]

  return (
    <div className="flex min-h-screen flex-col bg-hueso">
      <div
        className={`relative shrink-0 overflow-hidden bg-negro-barbero transition-[height] duration-300 ease-in-out ${
          campoConFoco ? 'h-16' : 'h-[30vh] max-h-56 min-h-[150px]'
        }`}
      >
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
                  esMovil
                  className="h-full w-full object-cover"
                />
              </motion.div>
            )
          })}
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-negro-barbero/60 via-negro-barbero/45 to-negro-barbero/90" />

        <div className="relative z-10 flex h-full flex-col justify-between px-5 py-4 text-hueso">
          <HoverLink href="/" className="w-fit font-display text-base italic tracking-tight">
            booking<span className="text-cobre-claro">.</span>barber.cl
          </HoverLink>

          {!campoConFoco && (
            <TextoSlogan
              id={slideTexto.id}
              texto={slideTexto.slogan}
              className="max-w-[85%] font-display text-2xl font-light leading-[1.15] tracking-tight"
            />
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 h-px bg-hueso/10">
          {rotando && !campoConFoco && (
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

      <div className={`flex flex-1 flex-col px-6 transition-[padding] duration-300 ${campoConFoco ? 'py-4' : 'py-7'}`}>
        {!campoConFoco && (
          <>
            <span className="versalitas text-xs text-cobre-texto">— Acceso al panel</span>
            <h2 className="font-display mt-1.5 text-2xl font-light tracking-tight text-negro-barbero">
              Ingresar
            </h2>
          </>
        )}
        <FormularioAcceso
          onCambioFoco={setCampoConFoco}
          onEscribiendo={setEscribiendo}
          compacto={campoConFoco}
          className={campoConFoco ? '' : 'mt-6'}
        />
      </div>
    </div>
  )
}
