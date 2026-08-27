import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SectionRule } from '../../../components/common/SectionRule'
import { ScrollReveal } from '../../../components/animations/ScrollReveal'
import { useNovedadesPublicas } from '../hooks/useNovedadesPublicas'

// `fecha` llega como "AAAA-MM-DD" (columna `date` de Postgres) — nunca
// `new Date(fechaISO)` directo: eso la interpreta en UTC y en Chile
// (UTC-3/-4) puede mostrar el mes anterior cerca de fin de mes. Se arma la
// fecha en hora local a mano, mismo criterio que `utils/horaLocal.js`.
function formatoMesAno(fechaISO) {
  const [anio, mes] = fechaISO.split('-').map(Number)
  return new Date(anio, mes - 1, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
}

// Carrusel de una tarjeta a la vez — mismo lenguaje visual que los
// carruseles de testimonios/equipo de la página pública de cada barbería
// (autoplay + flechas + puntos), para que esta sección no se sienta como un
// componente aparte del resto del sitio.
export function Novedades() {
  const { data: novedades, isLoading, isError } = useNovedadesPublicas()
  const [indice, setIndice] = useState(0)
  const [direccion, setDireccion] = useState(1)

  const lista = novedades ?? []

  useEffect(() => {
    if (lista.length < 2) return
    const temporizador = setInterval(() => {
      setDireccion(1)
      setIndice((i) => (i + 1) % lista.length)
    }, 6000)
    return () => clearInterval(temporizador)
  }, [lista.length])

  // Sin datos, con error, o cargando: no tiene sentido reservar espacio para
  // una sección vacía en el landing — mejor que no exista a que se vea rota.
  if (isLoading || isError || lista.length === 0) return null

  function ir(nuevoIndice, dir) {
    setDireccion(dir)
    setIndice(nuevoIndice)
  }

  const novedad = lista[indice]

  return (
    <section className="bg-gris-calido-100 px-6 py-20 md:px-10 md:py-28">
      <SectionRule indice="— 04" texto="Seguimos construyendo" tono="oscuro" />

      <div className="mt-14 flex flex-col items-center">
        <ScrollReveal>
          <p className="max-w-xl text-center font-display text-2xl font-light leading-tight tracking-tight md:text-4xl">
            Esto no quedó congelado el día que lo lanzamos.
          </p>
        </ScrollReveal>

        <div className="mt-10 w-full max-w-xl">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={novedad.id}
              initial={{ opacity: 0, x: direccion > 0 ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direccion > 0 ? -40 : 40 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="rounded-xl border border-gris-calido-200 bg-white p-8 text-center md:p-10"
            >
              <div className="flex items-center justify-center gap-3">
                {novedad.etiqueta && (
                  <span className="versalitas rounded-full bg-cobre/10 px-3 py-1 text-xs text-cobre-texto">
                    {novedad.etiqueta}
                  </span>
                )}
                <span className="versalitas text-xs text-gris-calido-500">
                  {formatoMesAno(novedad.fecha)}
                </span>
              </div>
              <p className="font-display mt-4 text-xl font-normal tracking-tight text-negro-barbero md:text-2xl">
                {novedad.titulo}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-gris-calido-700 md:text-base">
                {novedad.descripcion}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {lista.length > 1 && (
          <div className="mt-6 flex items-center gap-5">
            <button
              type="button"
              onClick={() => ir((indice - 1 + lista.length) % lista.length, -1)}
              aria-label="Novedad anterior"
              className="text-lg text-gris-calido-400 transition-colors hover:text-cobre-texto"
            >
              ‹
            </button>
            <div className="flex gap-2">
              {lista.map((n, i) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => ir(i, i > indice ? 1 : -1)}
                  aria-label={`Ver novedad ${i + 1}`}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === indice ? 'bg-cobre' : 'bg-gris-calido-200'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => ir((indice + 1) % lista.length, 1)}
              aria-label="Novedad siguiente"
              className="text-lg text-gris-calido-400 transition-colors hover:text-cobre-texto"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
