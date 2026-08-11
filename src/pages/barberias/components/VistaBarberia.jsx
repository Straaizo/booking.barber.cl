import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Footer } from '../../../components/layout/Footer'
import { HoverLink } from '../../../components/common/HoverLink'
import { SectionRule } from '../../../components/common/SectionRule'
import { TextReveal } from '../../../components/animations/TextReveal'
import { ScrollReveal } from '../../../components/animations/ScrollReveal'
import { AsistenteReserva } from '../components/AsistenteReserva'
import { LightboxGaleria } from '../components/LightboxGaleria'
import { oscurecerHex, esColorClaro } from '../../../utils/color'
import { linkWhatsApp } from '../../../utils/formatos'
import { asegurarFuenteCargada, pilaFuente } from '../../../utils/fuentes'

// Grilla editorial, no una fila de fotos del mismo tamaño: las fotos
// marcadas "grande" ocupan el doble de espacio (2 columnas × 2 filas), como
// una portada entre el resto — el orden que la barbería elige en el panel es
// directamente el orden de lectura de la grilla. Cada foto es clicable y
// abre en grande (`LightboxGaleria`), con navegación por teclado.
function SeccionGaleria({ seccion, nombreBarberia }) {
  const [fotoAbierta, setFotoAbierta] = useState(null)
  const imagenes = seccion.imagenes ?? []
  if (imagenes.length === 0) return null

  return (
    <>
      <SectionRule indice="—" texto={seccion.titulo || 'Galería'} tono="oscuro" />
      <div className="grid grid-cols-2 gap-3 auto-rows-[140px] px-6 py-6 md:grid-cols-4 md:auto-rows-[180px] md:gap-4 md:px-10">
        {imagenes.map((foto, indice) => (
          <button
            key={indice}
            type="button"
            onClick={() => setFotoAbierta(indice)}
            className={`group relative overflow-hidden rounded-lg ${foto.tamano === 'grande' ? 'col-span-2 row-span-2' : ''}`}
          >
            <img
              src={foto.url}
              alt={foto.leyenda || `${nombreBarberia} — foto ${indice + 1}`}
              className="h-full w-full object-cover transition-transform duration-500 ease-entrada group-hover:scale-105"
            />
            {foto.leyenda && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-negro-barbero/85 to-transparent px-3 py-2 text-left text-xs text-hueso opacity-0 transition-opacity group-hover:opacity-100">
                {foto.leyenda}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {fotoAbierta !== null && (
          <LightboxGaleria
            imagenes={imagenes}
            indice={fotoAbierta}
            onCerrar={() => setFotoAbierta(null)}
            onCambiarIndice={setFotoAbierta}
            nombreBarberia={nombreBarberia}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// A diferencia de las secciones de galería/imagen-y-texto (contenido libre,
// configurable), el equipo se arma solo a partir de los barberos ya cargados
// en la pestaña "Barberos" del panel — foto y especialidad son opcionales,
// así que un barbero recién agregado (sin foto todavía) igual aparece con su
// inicial, en vez de quedar afuera.
function SeccionEquipo({ barberos }) {
  const equipo = (barberos ?? []).filter((b) => b.activo)
  if (equipo.length === 0) return null

  return (
    <>
      <SectionRule indice="—" texto="Nuestro equipo" tono="oscuro" />
      <div className="grid grid-cols-2 gap-6 px-6 py-8 md:grid-cols-3 md:gap-8 md:px-10 lg:grid-cols-4">
        {equipo.map((barbero) => (
          <div key={barbero.id} className="flex flex-col items-center gap-3 text-center">
            {barbero.foto_url ? (
              <img
                src={barbero.foto_url}
                alt={barbero.nombre}
                className="h-24 w-24 rounded-full object-cover md:h-28 md:w-28"
              />
            ) : (
              <span className="font-display flex h-24 w-24 items-center justify-center rounded-full border border-cobre/40 text-2xl italic text-cobre md:h-28 md:w-28">
                {barbero.nombre.trim().charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <p className="text-sm font-medium text-negro-barbero">{barbero.nombre}</p>
              {barbero.especialidad && (
                <p className="mt-1 text-xs text-gris-calido-500">{barbero.especialidad}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function SeccionImagenTexto({ seccion }) {
  if (!seccion.imagen && !seccion.titulo && !seccion.texto) return null
  return (
    <>
      <SectionRule indice="—" texto={seccion.titulo || 'Nuestro espacio'} tono="oscuro" />
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-10 md:max-w-3xl md:flex-row md:items-center md:gap-10 md:px-10">
        {seccion.imagen && (
          <img
            src={seccion.imagen}
            alt={seccion.titulo || ''}
            className="w-full rounded-lg object-cover md:w-1/2"
          />
        )}
        {seccion.texto && (
          <p className="text-sm leading-relaxed text-gris-calido-700 md:text-base">{seccion.texto}</p>
        )}
      </div>
    </>
  )
}

// El render real de la página pública de una barbería, separado de
// `PaginaBarberia.jsx` (que solo lo conecta a los datos de la ruta) para que
// la vista previa en vivo del panel de personalización use exactamente este
// mismo componente — nunca una aproximación aparte que se puede desincronizar
// de cómo se ve la página real.
export function VistaBarberia({ barberia }) {
  const personalizacion = barberia.personalizacion ?? {}
  const inicial = barberia.nombre.trim().charAt(0).toUpperCase()
  const secciones = personalizacion.secciones ?? []
  const fuenteElegida = personalizacion.fuente_display || 'fraunces'

  useEffect(() => {
    asegurarFuenteCargada(fuenteElegida)
  }, [fuenteElegida])

  const estiloMarca = {
    ...(personalizacion.color_primario && {
      '--color-cobre': personalizacion.color_primario,
      '--color-cobre-oscuro': oscurecerHex(personalizacion.color_primario),
    }),
    '--font-display': pilaFuente(fuenteElegida),
  }

  // Si eligió un color de header claro, el texto (pensado para el
  // negro-barbero por defecto) pasa a tonos oscuros — sin esto, un header
  // blanco con letras blancas quedaría ilegible.
  const headerClaro = personalizacion.color_header ? esColorClaro(personalizacion.color_header) : false
  const claseTexto = headerClaro ? 'text-negro-barbero' : 'text-hueso'
  const claseEslogan = headerClaro ? 'text-cobre-texto' : 'text-cobre-claro'
  const claseContacto = headerClaro ? 'text-gris-calido-700' : 'text-gris-calido-200'

  return (
    <div className="min-h-screen bg-hueso" style={estiloMarca}>
      <header
        className={`relative overflow-hidden px-6 pb-12 pt-10 md:px-10 md:pb-16 md:pt-14 ${claseTexto} ${personalizacion.color_header ? '' : 'bg-negro-barbero'}`}
        style={personalizacion.color_header ? { backgroundColor: personalizacion.color_header } : undefined}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-cobre) 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto flex max-w-lg flex-col items-center text-center md:max-w-none md:flex-row md:items-center md:gap-6 md:text-left">
          {barberia.logo_url ? (
            <img
              src={barberia.logo_url}
              alt={barberia.nombre}
              className="h-20 w-20 shrink-0 rounded-full border border-cobre/40 object-cover"
            />
          ) : (
            <span className="font-display flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-cobre/40 text-3xl italic text-cobre">
              {inicial}
            </span>
          )}

          <div className="mt-5 md:mt-0">
            <TextReveal
              texto={barberia.nombre}
              as="h1"
              className="font-display text-3xl font-light leading-tight tracking-tight md:text-5xl"
            />
            {personalizacion.eslogan && (
              <ScrollReveal delay={0.1}>
                <p className={`versalitas mt-2 text-sm ${claseEslogan}`}>{personalizacion.eslogan}</p>
              </ScrollReveal>
            )}
          </div>
        </div>

        {(barberia.direccion || barberia.telefono_whatsapp) && (
          <ScrollReveal delay={0.15}>
            <div className={`relative mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm md:mx-0 md:max-w-none md:justify-start ${claseContacto}`}>
              {barberia.direccion && <span>{barberia.direccion}</span>}
              {barberia.telefono_whatsapp && (
                <HoverLink
                  href={linkWhatsApp(
                    barberia.telefono_whatsapp,
                    `Hola, tengo una consulta para ${barberia.nombre}`
                  )}
                  tono="cobre"
                >
                  Escribir por WhatsApp
                </HoverLink>
              )}
            </div>
          </ScrollReveal>
        )}
      </header>

      <SeccionEquipo barberos={barberia.barberos} />

      {secciones.map((seccion) => {
        if (seccion.tipo === 'galeria') {
          return <SeccionGaleria key={seccion.id} seccion={seccion} nombreBarberia={barberia.nombre} />
        }
        if (seccion.tipo === 'imagen_texto') {
          return <SeccionImagenTexto key={seccion.id} seccion={seccion} />
        }
        return null
      })}

      <SectionRule indice="—" texto="Reserva tu hora" tono="oscuro" />

      <main className="mx-auto max-w-lg px-6 py-10 md:py-14">
        {personalizacion.descripcion && (
          <ScrollReveal>
            <p className="mb-8 text-center text-sm leading-relaxed text-gris-calido-700 md:text-base">
              {personalizacion.descripcion}
            </p>
          </ScrollReveal>
        )}

        <AsistenteReserva barberia={barberia} />
      </main>

      <Footer variante="minimal" />
    </div>
  )
}
