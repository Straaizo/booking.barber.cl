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
import { ordenarEquipo } from '../../../utils/personalizacion'
import { puedePersonalizarSecciones } from '../../../utils/planes'

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

// A diferencia del contenido de galería/imagen-y-texto (libre, escrito a
// mano en el panel), el equipo se arma solo a partir de los barberos ya
// cargados en la pestaña "Barberos" — foto y especialidad son opcionales,
// así que un barbero recién agregado (sin foto todavía) igual aparece con su
// inicial, en vez de quedar afuera. Es una sección más entre las demás
// (`seccion.tipo === 'equipo'`, ver el `secciones.map` de VistaBarberia) para
// que cada barbería pueda ubicarla donde quiera — antes o después de sus
// fotos de trabajo, por ejemplo — en vez de vivir fija siempre en el mismo lugar.
function SeccionEquipo({ titulo, barberos, ordenEquipo }) {
  const equipo = ordenarEquipo(barberos, ordenEquipo)
  if (equipo.length === 0) return null

  return (
    <>
      <SectionRule indice="—" texto={titulo || 'Nuestro equipo'} tono="oscuro" />
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

// Chica/mediana/grande en vez de un tamaño único: el pedido explícito fue
// "es demasiado pequeño, poder agrandarlo" — con distintos anchos de pantalla
// y densidades, lo que se ve bien en una no se ve bien en otra.
const TAMANOS_BURBUJA_WHATSAPP = {
  chica: { caja: 'h-12 w-12', icono: 22 },
  mediana: { caja: 'h-14 w-14', icono: 28 },
  grande: { caja: 'h-[4.5rem] w-[4.5rem]', icono: 36 },
}

// Botón circular fijo en la esquina, visible en toda la página — la
// alternativa al enlace de texto del encabezado (`estilo_whatsapp:
// 'burbuja'` en vez de `'enlace'`, mutuamente excluyentes). Por defecto usa
// el color de marca (`color`, ya resuelto por quien llama a partir de
// `whatsapp_color` o `color_primario`) en vez del verde tradicional de
// WhatsApp — sigue siendo reconocible por la forma, la posición fija y el
// ícono, sin salirse de la paleta que cada barbería ya eligió; si de verdad
// quiere ese color puede elegirlo a mano. El aro que se expande y se
// desvanece detrás (`animate-ping`, ya viene con Tailwind) es el efecto de
// "pulso" — el mismo lenguaje visual que ya usan las burbujas de chat de
// cualquier sitio, para que se note que es interactivo sin tener que leer nada.
function BurbujaWhatsApp({ telefono, nombreBarberia, color, tamano }) {
  const { caja, icono } = TAMANOS_BURBUJA_WHATSAPP[tamano] ?? TAMANOS_BURBUJA_WHATSAPP.mediana
  const estiloColor = color ? { backgroundColor: color } : undefined

  return (
    <a
      href={linkWhatsApp(telefono, `Hola, tengo una consulta para ${nombreBarberia}`)}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribir por WhatsApp"
      className={`fixed bottom-5 right-5 z-40 flex items-center justify-center rounded-full text-hueso shadow-lg transition-transform duration-200 hover:scale-105 ${caja} ${color ? '' : 'bg-cobre-oscuro'}`}
      style={estiloColor}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-0 rounded-full opacity-40 animate-ping ${color ? '' : 'bg-cobre-oscuro'}`}
        style={estiloColor}
      />
      <svg
        viewBox="0 0 32 32"
        width={icono}
        height={icono}
        fill="currentColor"
        aria-hidden="true"
        className="relative z-10"
      >
        <path d="M16.04 4C9.4 4 4 9.37 4 16c0 2.4.7 4.63 1.9 6.5L4.4 28l5.7-1.5c1.8 1 3.86 1.5 5.94 1.5 6.63 0 12.04-5.37 12.04-12S22.67 4 16.04 4Zm0 21.9c-1.9 0-3.75-.5-5.35-1.46l-.38-.22-3.4.9.9-3.32-.24-.4A9.83 9.83 0 0 1 6.1 16c0-5.48 4.47-9.9 9.94-9.9 5.47 0 9.94 4.42 9.94 9.9s-4.47 9.9-9.94 9.9Zm5.44-7.42c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.15-.15.35-.4.52-.6.17-.2.23-.35.35-.58.12-.23.06-.43-.04-.6-.1-.17-.62-1.5-.85-2.06-.22-.53-.45-.46-.62-.47h-.53c-.17 0-.45.06-.68.32-.23.26-.9.88-.9 2.14s.93 2.48 1.06 2.65c.13.17 1.83 2.8 4.5 3.82 2.66 1.02 2.66.68 3.14.63.48-.05 1.55-.63 1.77-1.24.22-.6.22-1.12.15-1.24-.07-.13-.27-.2-.57-.35Z" />
      </svg>
    </a>
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
  // Galería, imagen+texto y equipo son una función del plan Equipo hacia
  // arriba (ver PanelPersonalizacion.jsx) — se vuelve a chequear acá, no solo
  // en el panel de edición: si una barbería baja de plan, sus secciones ya
  // guardadas dejan de mostrarse en la página pública de inmediato, sin
  // depender de que alguien vuelva a guardar el formulario.
  const secciones = puedePersonalizarSecciones(barberia.plan_id) ? personalizacion.secciones ?? [] : []
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

        {(barberia.direccion || (barberia.telefono_whatsapp && personalizacion.estilo_whatsapp !== 'burbuja')) && (
          <ScrollReveal delay={0.15}>
            <div className={`relative mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm md:mx-0 md:max-w-none md:justify-start ${claseContacto}`}>
              {barberia.direccion && <span>{barberia.direccion}</span>}
              {barberia.telefono_whatsapp && personalizacion.estilo_whatsapp !== 'burbuja' && (
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

      {secciones.map((seccion) => {
        if (seccion.tipo === 'galeria') {
          return <SeccionGaleria key={seccion.id} seccion={seccion} nombreBarberia={barberia.nombre} />
        }
        if (seccion.tipo === 'imagen_texto') {
          return <SeccionImagenTexto key={seccion.id} seccion={seccion} />
        }
        if (seccion.tipo === 'equipo') {
          return (
            <SeccionEquipo
              key={seccion.id}
              titulo={seccion.titulo}
              barberos={barberia.barberos}
              ordenEquipo={personalizacion.orden_equipo}
            />
          )
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

      {barberia.telefono_whatsapp && personalizacion.estilo_whatsapp === 'burbuja' && (
        <BurbujaWhatsApp
          telefono={barberia.telefono_whatsapp}
          nombreBarberia={barberia.nombre}
          color={personalizacion.whatsapp_color || personalizacion.color_primario}
          tamano={personalizacion.whatsapp_tamano}
        />
      )}
    </div>
  )
}
