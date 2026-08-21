import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Footer } from '../../../components/layout/Footer'
import { HoverLink } from '../../../components/common/HoverLink'
import { SectionRule } from '../../../components/common/SectionRule'
import { TextReveal } from '../../../components/animations/TextReveal'
import { ScrollReveal } from '../../../components/animations/ScrollReveal'
import { AsistenteReserva } from '../components/AsistenteReserva'
import { LightboxGaleria } from '../components/LightboxGaleria'
import { oscurecerHex, esColorClaro } from '../../../utils/color'
import { linkWhatsApp, linkGoogleMaps, formatoCLP, ofertaVigente } from '../../../utils/formatos'
import { asegurarFuenteCargada, pilaFuente } from '../../../utils/fuentes'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { ordenarEquipo } from '../../../utils/personalizacion'
import { puedePersonalizarSecciones } from '../../../utils/planes'
import { resumenHorarioSemanal } from '../../../utils/horarios'

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
      {seccion.estilo === 'carrusel' ? (
        <CarruselGaleria
          imagenes={imagenes}
          nombreBarberia={nombreBarberia}
          onAbrir={setFotoAbierta}
          posicion={seccion.posicion}
          texto={seccion.texto}
          textoCursiva={seccion.texto_cursiva}
          textoSubrayado={seccion.texto_subrayado}
          textoFuente={seccion.texto_fuente}
          textoTamano={seccion.texto_tamano}
          textoResaltado={seccion.texto_resaltado}
          textoResaltadoColor={seccion.texto_resaltado_color}
          textoResaltadoTamano={seccion.texto_resaltado_tamano}
          textoResaltadoFuente={seccion.texto_resaltado_fuente}
          imagenTamano={seccion.imagen_tamano}
        />
      ) : (
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
      )}

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

// Tamaños del texto acompañante del carrusel — techo intencional en
// "enorme" (36px en desktop): más grande que eso, compartiendo columna con
// una foto en un layout de ~40% de ancho, empieza a cortar mal las líneas.
const TAMANOS_TEXTO_CARRUSEL = {
  chica: 'text-base md:text-lg',
  mediana: 'text-lg md:text-xl',
  grande: 'text-2xl md:text-3xl',
  enorme: 'text-3xl md:text-4xl',
}
// Alternativa a la grilla: una foto grande a la vez, deslizando — mismo
// lenguaje visual que el carrusel de equipo (flechas + puntos, autoplay
// cada 5s). Clickear la foto abre el mismo lightbox que la grilla, no una
// vista aparte. `posicion` decide el layout: 'centro' (de siempre, una foto
// moderada y centrada, sin texto al lado) o 'izquierda'/'derecha' — ahí el
// carrusel pasa a ocupar una columna y aparece `texto` en la columna
// opuesta (mismo patrón que "Imagen y texto"), con cursiva/subrayado/
// tamaño/tipografía propios para dejarlo más como un eslogan que como un
// párrafo plano. `textoFuente`/`textoResaltadoFuente` en `null` heredan la
// tipografía del sitio (o del texto normal, en el caso de la resaltada) —
// la frase destacada tiene su propio tamaño/tipografía/color, no derivados
// del texto normal, para que se pueda tratar como un elemento aparte.
// Ancho de la columna de la foto cuando comparte fila con texto — 'grande'
// se quedó como el 3/5 de siempre; con texto e imagen ya no se ve
// "gigante" al lado de una columna angosta de texto (el reclamo real era
// que "grande" quedaba como único tamaño posible, sin opción de achicarlo).
const ANCHOS_CARRUSEL_CON_TEXTO = { chica: 'md:w-2/5', mediana: 'md:w-1/2', grande: 'md:w-3/5' }
// Sin texto (posición "centro"), el ancho es un `max-w` sobre toda la fila.
const ANCHOS_CARRUSEL_CENTRO = { chica: 'max-w-xl', mediana: 'max-w-3xl', grande: 'max-w-5xl' }
// Techo de altura para la foto con texto al lado — sin esto, en una
// pantalla angosta y alta (la mayoría de los monitores normales) la foto
// más el encabezado ya llenaban el alto completo de la pantalla apenas
// entrabas, sin ninguna señal de que había más contenido debajo.
const ALTURAS_CARRUSEL_CON_TEXTO = { chica: 'max-h-[340px]', mediana: 'max-h-[440px]', grande: 'max-h-[540px]' }
// Mismo techo para "Centro" (sin texto al lado) — ahí el ancho ya limita la
// altura vía `aspect-[16/10]`, pero en "Grande" (max-w-5xl = 1024px) igual
// puede pasar los 600px de alto, que sumado al encabezado ya es casi toda
// una pantalla de escritorio común.
const ALTURAS_CARRUSEL_CENTRO = { chica: 'max-h-[380px]', mediana: 'max-h-[460px]', grande: 'max-h-[560px]' }

function CarruselGaleria({
  imagenes,
  nombreBarberia,
  onAbrir,
  posicion,
  texto,
  textoCursiva,
  textoSubrayado,
  textoFuente,
  textoTamano,
  textoResaltado,
  textoResaltadoColor,
  textoResaltadoTamano,
  textoResaltadoFuente,
  imagenTamano,
}) {
  const [indice, setIndice] = useState(0)
  const [direccion, setDireccion] = useState(1)
  const conTexto = posicion !== 'centro' && Boolean(texto)

  useEffect(() => {
    if (textoFuente) asegurarFuenteCargada(textoFuente)
    if (textoResaltadoFuente) asegurarFuenteCargada(textoResaltadoFuente)
  }, [textoFuente, textoResaltadoFuente])

  useEffect(() => {
    if (imagenes.length < 2) return
    const temporizador = setInterval(() => {
      setDireccion(1)
      setIndice((i) => (i + 1) % imagenes.length)
    }, 5000)
    return () => clearInterval(temporizador)
  }, [imagenes.length])

  function ir(nuevoIndice, dir) {
    setDireccion(dir)
    setIndice(nuevoIndice)
  }

  const foto = imagenes[indice]

  const anchoImagen = conTexto
    ? (ANCHOS_CARRUSEL_CON_TEXTO[imagenTamano] ?? ANCHOS_CARRUSEL_CON_TEXTO.mediana)
    : (ANCHOS_CARRUSEL_CENTRO[imagenTamano] ?? ANCHOS_CARRUSEL_CENTRO.mediana)

  const imagenYControles = (
    <div className={`flex w-full flex-col items-center gap-4 ${anchoImagen}`}>
      <button
        type="button"
        onClick={() => onAbrir(indice)}
        aria-label={`Ver foto ${indice + 1} en grande`}
        className={`relative w-full overflow-hidden rounded-lg ${
          conTexto
            ? `aspect-[4/3] ${ALTURAS_CARRUSEL_CON_TEXTO[imagenTamano] ?? ALTURAS_CARRUSEL_CON_TEXTO.mediana}`
            : `aspect-[16/10] ${ALTURAS_CARRUSEL_CENTRO[imagenTamano] ?? ALTURAS_CARRUSEL_CENTRO.mediana}`
        }`}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={indice}
            src={foto.url}
            alt={foto.leyenda || `${nombreBarberia} — foto ${indice + 1}`}
            initial={{ opacity: 0, x: direccion > 0 ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direccion > 0 ? -60 : 60 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
        {foto.leyenda && (
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-negro-barbero/85 to-transparent px-3 py-2 text-left text-xs text-hueso">
            {foto.leyenda}
          </span>
        )}
      </button>

      {imagenes.length > 1 && (
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => ir((indice - 1 + imagenes.length) % imagenes.length, -1)}
            aria-label="Foto anterior"
            className="text-lg text-gris-calido-400 transition-colors hover:text-cobre-texto"
          >
            ‹
          </button>
          <div className="flex gap-2">
            {imagenes.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => ir(i, i > indice ? 1 : -1)}
                aria-label={`Ver foto ${i + 1}`}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === indice ? 'bg-cobre' : 'bg-gris-calido-300'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => ir((indice + 1) % imagenes.length, 1)}
            aria-label="Foto siguiente"
            className="text-lg text-gris-calido-400 transition-colors hover:text-cobre-texto"
          >
            ›
          </button>
        </div>
      )}
    </div>
  )

  if (!conTexto) {
    return <div className="flex flex-col items-center gap-4 px-6 py-6 md:px-10">{imagenYControles}</div>
  }

  return (
    <div
      className={`flex flex-col gap-8 px-6 py-10 md:items-center md:gap-10 md:px-10 ${
        posicion === 'derecha' ? 'md:flex-row-reverse' : 'md:flex-row'
      }`}
    >
      {imagenYControles}
      <p
        className={`min-w-0 flex-1 break-words leading-relaxed text-negro-barbero ${
          textoFuente ? '' : 'font-display'
        } ${TAMANOS_TEXTO_CARRUSEL[textoTamano] ?? TAMANOS_TEXTO_CARRUSEL.mediana} ${
          textoCursiva ? 'italic' : ''
        } ${textoSubrayado ? 'underline' : ''}`}
        style={textoFuente ? { fontFamily: pilaFuente(textoFuente) } : undefined}
      >
        {texto}
        {textoResaltado && (
          <>
            {' '}
            <span
              className={`underline ${
                TAMANOS_TEXTO_CARRUSEL[textoResaltadoTamano] ?? TAMANOS_TEXTO_CARRUSEL.grande
              }`}
              style={{
                color: textoResaltadoColor || 'var(--color-cobre)',
                fontFamily: textoResaltadoFuente ? pilaFuente(textoResaltadoFuente) : undefined,
              }}
            >
              {textoResaltado}
            </span>
          </>
        )}
      </p>
    </div>
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
function SeccionEquipo({ titulo, barberos, ordenEquipo, estilo }) {
  const equipo = ordenarEquipo(barberos, ordenEquipo)
  if (equipo.length === 0) return null

  if (estilo === 'carrusel') {
    return <CarruselEquipo titulo={titulo} equipo={equipo} />
  }

  return (
    <>
      <SectionRule indice="—" texto={titulo || 'Nuestro equipo'} tono="oscuro" />
      {/* `flex-wrap` + centrado, no `grid` de columnas fijas — con pocos
          barberos (1 o 2) una grilla de 3-4 columnas los deja pegados a un
          costado con un vacío enorme al lado; así siempre quedan
          centrados, sea 1 o 12, y se acomodan solos en varias filas cuando
          hace falta. */}
      <div className="flex flex-wrap justify-center gap-x-10 gap-y-8 px-6 py-8 md:px-10">
        {equipo.map((barbero) => (
          <div key={barbero.id} className="flex w-24 flex-col items-center gap-3 text-center md:w-28">
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

// Un barbero a la vez, deslizando al siguiente — la alternativa a la grilla
// para equipos donde cada persona merece su propio momento en vez de
// competir por atención con el resto. Autoplay cada 4.5s (se reinicia solo
// al desmontar/montar, no hace falta pausarlo al interactuar: el click en
// una flecha o un punto ya deja al usuario exactamente donde eligió ir).
function CarruselEquipo({ titulo, equipo }) {
  const [indice, setIndice] = useState(0)
  const [direccion, setDireccion] = useState(1)

  useEffect(() => {
    if (equipo.length < 2) return
    const temporizador = setInterval(() => {
      setDireccion(1)
      setIndice((i) => (i + 1) % equipo.length)
    }, 4500)
    return () => clearInterval(temporizador)
  }, [equipo.length])

  function ir(nuevoIndice, dir) {
    setDireccion(dir)
    setIndice(nuevoIndice)
  }

  const barbero = equipo[indice]

  return (
    <>
      <SectionRule indice="—" texto={titulo || 'Nuestro equipo'} tono="oscuro" />
      <div className="mx-auto flex max-w-sm flex-col items-center gap-6 px-6 py-10">
        <div className="relative h-64 w-64 overflow-hidden">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={barbero.id}
              initial={{ x: direccion > 0 ? 60 : -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direccion > 0 ? -60 : 60, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="absolute inset-0 flex flex-col items-center gap-3 text-center"
            >
              {barbero.foto_url ? (
                <img
                  src={barbero.foto_url}
                  alt={barbero.nombre}
                  className="h-40 w-40 rounded-full object-cover"
                />
              ) : (
                <span className="font-display flex h-40 w-40 items-center justify-center rounded-full border border-cobre/40 text-4xl italic text-cobre">
                  {barbero.nombre.trim().charAt(0).toUpperCase()}
                </span>
              )}
              <div>
                <p className="text-base font-medium text-negro-barbero">{barbero.nombre}</p>
                {barbero.especialidad && (
                  <p className="mt-1 text-sm text-gris-calido-500">{barbero.especialidad}</p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {equipo.length > 1 && (
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => ir((indice - 1 + equipo.length) % equipo.length, -1)}
              aria-label="Barbero anterior"
              className="text-lg text-gris-calido-400 transition-colors hover:text-cobre-texto"
            >
              ‹
            </button>
            <div className="flex gap-2">
              {equipo.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => ir(i, i > indice ? 1 : -1)}
                  aria-label={`Ver a ${b.nombre}`}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === indice ? 'bg-cobre' : 'bg-gris-calido-300'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => ir((indice + 1) % equipo.length, 1)}
              aria-label="Barbero siguiente"
              className="text-lg text-gris-calido-400 transition-colors hover:text-cobre-texto"
            >
              ›
            </button>
          </div>
        )}
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
  const imagenADerecha = seccion.posicion_imagen === 'derecha'
  return (
    <>
      <SectionRule indice="—" texto={seccion.titulo || 'Nuestro espacio'} tono="oscuro" />
      <div
        className={`flex flex-col gap-6 px-6 py-10 md:items-center md:gap-10 md:px-10 ${
          imagenADerecha ? 'md:flex-row-reverse' : 'md:flex-row'
        }`}
      >
        {seccion.imagen && (
          <img
            src={seccion.imagen}
            alt={seccion.titulo || ''}
            className="aspect-[4/3] w-full rounded-lg object-cover md:w-3/5"
          />
        )}
        {seccion.texto && (
          <p className="min-w-0 flex-1 break-words text-sm leading-relaxed text-gris-calido-700 md:text-base">
            {seccion.texto}
          </p>
        )}
      </div>
    </>
  )
}

// Señal de que hay más contenido debajo del encabezado — sin esto, en
// pantallas de altura normal el encabezado (más una sección grande justo
// después) puede llenar el alto completo apenas se entra a la página, sin
// ninguna pista de que hay más para ver. `prefers-reduced-motion` la deja
// quieta en vez de rebotando, pero sigue ahí como referencia visual.
function IndicadorScroll({ claseTexto }) {
  const prefiereReducido = usePrefersReducedMotion()
  return (
    <motion.div
      aria-hidden="true"
      className={`absolute bottom-4 left-1/2 -translate-x-1/2 opacity-60 ${claseTexto}`}
      animate={prefiereReducido ? undefined : { y: [0, 6, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.div>
  )
}

function Estrellas({ cantidad }) {
  return (
    <div aria-hidden="true" className="flex gap-0.5 text-cobre">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < cantidad ? 'opacity-100' : 'opacity-20'}>
          ★
        </span>
      ))}
    </div>
  )
}

// Una reseña grande a la vez, en vez de una grilla de tarjetas — así cada
// testimonio se lee completo (sin truncar) y se siente como una cita
// destacada, no como relleno. Sin verificación de terceros todavía (no hay
// integración con Google/Meta reviews) — lo escribe la barbería a mano desde
// el panel, igual que el resto del contenido de esta pantalla.
// Techo en "enorme" por el mismo motivo que el texto del carrusel de
// galería: una cita ya es larga de por sí, más grande que esto empieza a
// obligar a demasiadas líneas en mobile.
const TAMANOS_TESTIMONIO = {
  chica: 'text-base md:text-lg',
  mediana: 'text-lg md:text-xl',
  grande: 'text-xl md:text-2xl',
  enorme: 'text-2xl md:text-3xl',
}

function SeccionTestimonios({ titulo, items, estilo, tamano, fuente, colorTexto, colorFondo }) {
  useEffect(() => {
    if (fuente) asegurarFuenteCargada(fuente)
  }, [fuente])

  if (items.length === 0) return null

  const estiloTexto = {
    color: colorTexto || undefined,
    fontFamily: fuente ? pilaFuente(fuente) : undefined,
  }

  return (
    <>
      <SectionRule indice="—" texto={titulo || 'Lo que dicen nuestros clientes'} tono="oscuro" />
      {estilo === 'lista' ? (
        <ListaTestimonios items={items} tamano={tamano} estiloTexto={estiloTexto} colorFondo={colorFondo} />
      ) : (
        <CarruselTestimonios items={items} tamano={tamano} estiloTexto={estiloTexto} />
      )}
    </>
  )
}

// El formato de siempre: una reseña grande a la vez, para que se lea
// completa sin truncar — se siente como una cita destacada, no como
// relleno. Mejor para pocas reseñas (1-3) donde cada una merece su momento.
function CarruselTestimonios({ items, tamano, estiloTexto }) {
  const [indice, setIndice] = useState(0)
  const [direccion, setDireccion] = useState(1)

  useEffect(() => {
    if (items.length < 2) return
    const temporizador = setInterval(() => {
      setDireccion(1)
      setIndice((i) => (i + 1) % items.length)
    }, 6000)
    return () => clearInterval(temporizador)
  }, [items.length])

  function ir(nuevoIndice, dir) {
    setDireccion(dir)
    setIndice(nuevoIndice)
  }

  const testimonio = items[indice]

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-10 text-center md:px-10">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={indice}
          initial={{ opacity: 0, x: direccion > 0 ? 40 : -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direccion > 0 ? -40 : 40 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-4"
        >
          <Estrellas cantidad={testimonio.estrellas} />
          <p
            className={`font-light italic leading-relaxed ${
              estiloTexto.fontFamily ? '' : 'font-display'
            } ${estiloTexto.color ? '' : 'text-negro-barbero'} ${
              TAMANOS_TESTIMONIO[tamano] ?? TAMANOS_TESTIMONIO.mediana
            }`}
            style={estiloTexto}
          >
            “{testimonio.texto}”
          </p>
          {testimonio.nombre && (
            <p className="versalitas text-xs text-gris-calido-500">{testimonio.nombre}</p>
          )}
        </motion.div>
      </AnimatePresence>

      {items.length > 1 && (
        <div className="flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => ir(i, i > indice ? 1 : -1)}
              aria-label={`Ver testimonio ${i + 1}`}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === indice ? 'bg-cobre' : 'bg-gris-calido-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Alternativa en lista/cuadrícula horizontal: todas las reseñas visibles a
// la vez, cada una en su propia tarjeta — mejor cuando hay varias (4+) y no
// tiene sentido hacer esperar al autoplay para verlas todas. Patrón de
// tarjetas independientes, el más común en sitios de servicios reales.
function ListaTestimonios({ items, tamano, estiloTexto, colorFondo }) {
  return (
    <div className="grid grid-cols-1 gap-6 px-6 py-10 md:grid-cols-2 md:px-10 lg:grid-cols-3">
      {items.map((testimonio) => (
        <div
          key={testimonio.id}
          className="flex flex-col gap-3 rounded-lg border border-gris-calido-200 bg-white p-5"
          style={{ backgroundColor: colorFondo || undefined }}
        >
          <Estrellas cantidad={testimonio.estrellas} />
          <p
            className={`flex-1 font-light italic leading-relaxed ${
              estiloTexto.fontFamily ? '' : 'font-display'
            } ${estiloTexto.color ? '' : 'text-negro-barbero'} ${
              TAMANOS_TESTIMONIO[tamano] ?? TAMANOS_TESTIMONIO.mediana
            }`}
            style={estiloTexto}
          >
            “{testimonio.texto}”
          </p>
          {testimonio.nombre && (
            <p className="versalitas text-xs text-gris-calido-500">{testimonio.nombre}</p>
          )}
        </div>
      ))}
    </div>
  )
}

// Horario de atención del local completo (no de un barbero puntual) — se
// calcula solo a partir de los `horarios_disponibles` de los barberos
// activos, nunca se escribe a mano, para que nunca se desincronice de los
// horarios reales que ya administra cada barbero. No depende del plan (es
// información básica del negocio, no una sección decorativa) ni se puede
// reordenar — vive siempre justo antes de la vidriera de servicios.
// Tabla real (encabezado + filas), no una lista clickeable que imita el
// paso del asistente de reserva — el pedido explícito fue que se sintiera
// como el menú/tabla de precios de un negocio real, no como "lo mismo que
// ya vi al reservar" repetido dos veces con el mismo look. El encabezado
// usa el color de marca de siempre (`bg-cobre/10`, ya tiñe la variable CSS
// `--color-cobre` que fija `color_primario`) — sin un color propio aparte.
function EncabezadoTabla({ columnas }) {
  return (
    <div className="grid gap-4 rounded-t-md bg-cobre/10 px-4 py-2" style={{ gridTemplateColumns: columnas.plantilla }}>
      {columnas.etiquetas.map((etiqueta, i) => (
        <span
          key={etiqueta}
          className={`versalitas text-xs text-gris-calido-600 ${i > 0 ? 'text-right' : ''}`}
        >
          {etiqueta}
        </span>
      ))}
    </div>
  )
}

function SeccionHorario({ barberos }) {
  const horarios = (barberos ?? [])
    .filter((b) => b.activo)
    .flatMap((b) => b.horarios_disponibles ?? [])
  const resumen = resumenHorarioSemanal(horarios)
  if (resumen.length === 0) return null

  return (
    <>
      <SectionRule indice="—" texto="Horario de atención" tono="oscuro" />
      <div className="mx-auto max-w-md overflow-hidden rounded-md border border-gris-calido-200 px-6 py-8 md:px-10">
        <EncabezadoTabla columnas={{ plantilla: '1fr auto', etiquetas: ['Día', 'Horario'] }} />
        {resumen.map((linea, i) => (
          <div
            key={linea.etiqueta}
            className={`numeros-tabulares grid grid-cols-[1fr_auto] gap-4 px-4 py-3 text-sm text-gris-calido-700 md:text-base ${
              i % 2 === 1 ? 'bg-gris-calido-100/50' : ''
            }`}
          >
            <span>{linea.etiqueta}</span>
            <span className="text-right font-medium text-negro-barbero">{linea.horario}</span>
          </div>
        ))}
      </div>
    </>
  )
}

// El menú de precios de siempre en cualquier negocio de servicios — tabla
// con encabezado, no una lista clickeable que imita el paso del asistente
// (eso generaba la sensación de "ya vi esto" apenas se llegaba a reservar).
// Un solo link al final ("Reservar tu hora →"), no uno por fila.
function SeccionServicios({ servicios }) {
  const activos = (servicios ?? []).filter((s) => s.activo)
  if (activos.length === 0) return null

  return (
    <>
      <SectionRule indice="—" texto="Servicios y precios" tono="oscuro" />
      <div className="mx-auto max-w-lg px-6 py-8 md:px-10">
        <div className="overflow-hidden rounded-md border border-gris-calido-200">
          <EncabezadoTabla
            columnas={{ plantilla: '1fr auto auto', etiquetas: ['Servicio', 'Duración', 'Precio'] }}
          />
          {activos.map((servicio, i) => {
            const enOferta = ofertaVigente(servicio)
            return (
              <div
                key={servicio.id}
                className={`numeros-tabulares grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 ${
                  i % 2 === 1 ? 'bg-gris-calido-100/50' : ''
                }`}
              >
                <span className="font-display truncate text-base font-normal text-negro-barbero md:text-lg">
                  {servicio.nombre}
                </span>
                <span className="text-right text-xs text-gris-calido-500 md:text-sm">
                  {servicio.duracion_minutos} min
                </span>
                <span className="text-right">
                  {enOferta ? (
                    <>
                      <span className="block text-xs text-gris-calido-400 line-through">
                        {formatoCLP(servicio.precio_clp)}
                      </span>
                      <span className="block text-base font-semibold text-cobre-texto">
                        {formatoCLP(servicio.precio_oferta)}
                      </span>
                    </>
                  ) : (
                    <span className="block text-base font-semibold text-negro-barbero">
                      {formatoCLP(servicio.precio_clp)}
                    </span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
        <HoverLink href="#reservar" tono="cobre" className="mt-6 inline-block text-sm font-medium">
          Reservar tu hora →
        </HoverLink>
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
  // La vista previa en vivo del panel (ver PreviewBarberia.jsx) renderiza
  // este mismo componente dentro de un <iframe> en la ruta `/_preview-barberia`
  // — la marca de agua de la plataforma no tiene sentido ahí, solo en la
  // página pública real.
  const esVistaPrevia = typeof window !== 'undefined' && window.location.pathname === '/_preview-barberia'

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

        {!esVistaPrevia && (
          // `HoverLink` ya trae `relative` incorporado (lo necesita para su
          // propio subrayado animado) — por eso el posicionamiento fijo va
          // en este `<div>` que lo envuelve, no en el propio `HoverLink`:
          // poner `absolute` ahí compite con su `relative` interno y, según
          // el orden en que Tailwind emite esas dos clases en su hoja de
          // estilos, `relative` puede ganar la pelea de cascada — dejando
          // esto en el flujo normal (arriba a la izquierda) en vez de fijo
          // en la esquina.
          <div className={`absolute right-6 top-6 md:right-10 md:top-8 ${claseTexto}`}>
            <HoverLink href="/" className="font-display text-sm italic tracking-tight opacity-70">
              booking<span className="text-cobre-texto">.</span>barber.cl
            </HoverLink>
          </div>
        )}

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
                <p
                  className={`versalitas mt-2 text-sm ${personalizacion.eslogan_color ? '' : claseEslogan}`}
                  style={personalizacion.eslogan_color ? { color: personalizacion.eslogan_color } : undefined}
                >
                  {personalizacion.eslogan}
                </p>
              </ScrollReveal>
            )}
          </div>
        </div>

        {(barberia.direccion || (barberia.telefono_whatsapp && personalizacion.estilo_whatsapp !== 'burbuja')) && (
          <ScrollReveal delay={0.15}>
            <div className={`relative mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm md:mx-0 md:max-w-none md:justify-start ${claseContacto}`}>
              {barberia.direccion && <span>{barberia.direccion}</span>}
              {barberia.direccion && (
                <HoverLink
                  href={linkGoogleMaps(barberia.direccion)}
                  target="_blank"
                  rel="noreferrer"
                  tono="cobre"
                >
                  Ver en el mapa
                </HoverLink>
              )}
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

        <IndicadorScroll claseTexto={claseTexto} />
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
              estilo={seccion.estilo}
            />
          )
        }
        if (seccion.tipo === 'testimonios') {
          return (
            <SeccionTestimonios
              key={seccion.id}
              titulo={seccion.titulo}
              items={seccion.items ?? []}
              estilo={seccion.estilo}
              tamano={seccion.tamano}
              fuente={seccion.fuente}
              colorTexto={seccion.color_texto}
              colorFondo={seccion.color_fondo}
            />
          )
        }
        return null
      })}

      {Boolean(personalizacion.mostrar_horario) && <SeccionHorario barberos={barberia.barberos} />}
      {Boolean(personalizacion.mostrar_servicios) && <SeccionServicios servicios={barberia.servicios} />}

      <SectionRule indice="—" texto="Reserva tu hora" tono="oscuro" />

      <main id="reservar" className="mx-auto max-w-lg px-6 py-10 md:py-14">
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
