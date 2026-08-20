import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useIsMobile } from '../../hooks/useIsMobile'
import { Loader } from '../../components/common/Loader'
import { Button } from '../../components/common/Button'
import { HoverLink } from '../../components/common/HoverLink'
import { ToastGuardado } from '../../components/common/ToastGuardado'
import { SelectorArchivo } from '../../components/common/SelectorArchivo'
import { Interruptor } from '../../components/panel/Interruptor'
import { usePersonalizacionAdmin, useGuardarPersonalizacion } from './hooks/usePersonalizacionAdmin'
import { archivoAImagenComprimida } from '../../utils/imagenes'
import { FUENTES_DISPONIBLES, asegurarFuenteCargada } from '../../utils/fuentes'
import { ordenarEquipo } from '../../utils/personalizacion'
import { puedePersonalizarSecciones } from '../../utils/planes'

// La vista previa usa exactamente el mismo componente que la página pública
// real (`VistaBarberia`, renderizado dentro de un <iframe> — ver
// PreviewBarberia.jsx), con los cambios todavía sin guardar — nunca una
// aproximación aparte que se puede desincronizar de cómo se ve de verdad.
function construirVistaPrevia(barberia, form) {
  return {
    ...barberia,
    logo_url: form.logo_url,
    direccion: form.direccion,
    telefono_whatsapp: form.telefono_whatsapp,
    personalizacion: {
      color_primario: form.color_primario || null,
      color_header: form.color_header || null,
      fuente_display: form.fuente_display,
      eslogan: form.eslogan,
      descripcion: form.descripcion,
      secciones: form.secciones,
      orden_equipo: form.orden_equipo,
      estilo_whatsapp: form.estilo_whatsapp,
      whatsapp_color: form.whatsapp_color || null,
      whatsapp_tamano: form.whatsapp_tamano,
    },
  }
}

function formularioDesdeBarberia(barberia) {
  const p = barberia.personalizacion ?? {}
  return {
    logo_url: barberia.logo_url ?? null,
    direccion: barberia.direccion ?? '',
    telefono_whatsapp: barberia.telefono_whatsapp ?? '',
    color_primario: p.color_primario ?? '',
    color_header: p.color_header ?? '',
    fuente_display: p.fuente_display || 'fraunces',
    eslogan: p.eslogan ?? '',
    descripcion: p.descripcion ?? '',
    secciones: p.secciones ?? [],
    orden_equipo: p.orden_equipo ?? [],
    estilo_whatsapp: p.estilo_whatsapp || 'enlace',
    whatsapp_color: p.whatsapp_color ?? '',
    whatsapp_tamano: p.whatsapp_tamano || 'mediana',
  }
}

function nuevaSeccion(tipo) {
  const id = 'sec-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
  if (tipo === 'galeria') return { id, tipo: 'galeria', titulo: '', imagenes: [] }
  if (tipo === 'equipo') return { id, tipo: 'equipo', titulo: 'Nuestro equipo' }
  return { id, tipo: 'imagen_texto', imagen: null, titulo: '', texto: '' }
}

const ETIQUETA_TIPO_SECCION = { galeria: 'Galería', imagen_texto: 'Imagen y texto', equipo: 'Equipo' }

function resumenSeccion(seccion, cantidadBarberos) {
  if (seccion.tipo === 'galeria') {
    const n = seccion.imagenes?.length ?? 0
    return `${seccion.titulo || 'Sin título'} — ${n} foto${n === 1 ? '' : 's'}`
  }
  if (seccion.tipo === 'equipo') {
    return `${seccion.titulo || 'Nuestro equipo'} — ${cantidadBarberos} barbero${cantidadBarberos === 1 ? '' : 's'}`
  }
  return seccion.titulo || 'Sin título'
}

// Un encabezado numerado por grupo — mismo lenguaje que ya usa el resto del
// sitio ("— 01 / Cómo funciona") — para que cada zona del formulario se lea
// como un bloque separado, no como un solo formulario largo sin quiebres.
function TituloGrupo({ numero, children }) {
  return (
    <div className="flex items-center gap-3 border-b border-cobre/25 pb-2">
      <span className="numeros-tabulares text-xs text-cobre">{numero}</span>
      <h2 className="versalitas text-xs text-gris-calido-700">{children}</h2>
    </div>
  )
}

export function PanelPersonalizacion() {
  const { perfil } = useAuth()
  const esMobile = useIsMobile()
  const { data: barberia, isLoading, isError } = usePersonalizacionAdmin(perfil.barberia_id)
  const guardar = useGuardarPersonalizacion(perfil.barberia_id)

  const [form, setForm] = useState(null)
  const [formGuardado, setFormGuardado] = useState(null)
  const [estadoToast, setEstadoToast] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const [seccionAbiertaId, setSeccionAbiertaId] = useState(null)
  // Arranca en "movil" si ya se sabe desde el primer render que el viewport
  // es angosto — evita un parpadeo a "pc" (que fuerza min-width: 768px en el
  // iframe, rompiendo el ancho de la página en un celular real) antes de que
  // el efecto de abajo llegue a corregirlo.
  const [modoVista, setModoVista] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'movil' : 'pc'
  )
  const [alertaMovilCerrada, setAlertaMovilCerrada] = useState(false)
  const iframeRef = useRef(null)

  // En un celular real no tiene sentido ofrecer el modo "PC": el iframe en
  // ese modo fuerza un ancho mínimo de 768px para seguir siendo un layout de
  // escritorio genuino, y eso desborda la pantalla angosta del teléfono,
  // rompiendo el diseño de toda la pantalla de Personalización (no solo el
  // de la vista previa). Por eso en mobile solo existe el modo "Móvil".
  useEffect(() => {
    if (esMobile) setModoVista('movil')
  }, [esMobile])

  useEffect(() => {
    if (barberia) {
      const inicial = formularioDesdeBarberia(barberia)
      setForm(inicial)
      setFormGuardado(JSON.stringify(inicial))
    }
  }, [barberia])

  // Cada cambio en el formulario se manda al iframe de la vista previa por
  // postMessage — el iframe vive en su propia página (PreviewBarberia.jsx),
  // así que no puede leer el estado de este componente directo.
  useEffect(() => {
    if (!form || !barberia) return
    iframeRef.current?.contentWindow?.postMessage(
      { tipo: 'preview-barberia', barberia: construirVistaPrevia(barberia, form) },
      '*'
    )
  }, [form, barberia])

  // El toast se borra solo tras un momento — "guardando" en cambio queda
  // fijo hasta que la mutación de verdad termine, para no cerrarse antes de
  // tiempo si el guardado tarda más de la cuenta.
  useEffect(() => {
    if (estadoToast !== 'ok' && estadoToast !== 'error') return
    const temporizador = setTimeout(() => setEstadoToast(null), 2600)
    return () => clearTimeout(temporizador)
  }, [estadoToast])

  function alCargarIframe() {
    if (form && barberia) {
      iframeRef.current?.contentWindow?.postMessage(
        { tipo: 'preview-barberia', barberia: construirVistaPrevia(barberia, form) },
        '*'
      )
    }
  }

  // Compara contra la última versión guardada — así queda inequívoco cuándo
  // lo que se ve en la vista previa todavía no es lo que ve un cliente real
  // en la página pública (recién se publica al guardar).
  const hayCambiosSinGuardar = form && formGuardado !== null && JSON.stringify(form) !== formGuardado
  const equipoOrdenado = form && barberia ? ordenarEquipo(barberia.barberos, form.orden_equipo) : []
  // Galería, imagen+texto y equipo son una función paga desde el plan Equipo
  // — con plan Solo, esta pantalla no deja agregar ni editar secciones (las
  // que ya existiera de antes de bajar de plan quedan guardadas, solo
  // ocultas de la edición y de la página pública hasta que vuelva a subir).
  const puedeSecciones = barberia ? puedePersonalizarSecciones(barberia.plan_id) : false

  async function subirLogo(evento) {
    const archivo = evento.target.files?.[0]
    if (!archivo) return
    setSubiendo(true)
    try {
      const dataUrl = await archivoAImagenComprimida(archivo, { maxAncho: 400, maxAlto: 400 })
      setForm((f) => ({ ...f, logo_url: dataUrl }))
    } finally {
      setSubiendo(false)
      evento.target.value = ''
    }
  }

  function actualizarSeccion(id, cambios) {
    setForm((f) => ({ ...f, secciones: f.secciones.map((s) => (s.id === id ? { ...s, ...cambios } : s)) }))
  }

  function agregarSeccion(tipo) {
    const seccion = nuevaSeccion(tipo)
    setForm((f) => ({ ...f, secciones: [...f.secciones, seccion] }))
    setSeccionAbiertaId(seccion.id)
  }

  function quitarSeccion(id) {
    setForm((f) => ({ ...f, secciones: f.secciones.filter((s) => s.id !== id) }))
  }

  function moverSeccion(indice, direccion) {
    setForm((f) => {
      const destino = indice + direccion
      if (destino < 0 || destino >= f.secciones.length) return f
      const secciones = [...f.secciones]
      ;[secciones[indice], secciones[destino]] = [secciones[destino], secciones[indice]]
      return { ...f, secciones }
    })
  }

  // El orden guardado (`orden_equipo`) puede no incluir todavía a todos los
  // barberos activos (uno recién agregado desde la pestaña Barberos, o el
  // orden nunca se tocó) — `ordenarEquipo` ya resuelve eso agregándolos al
  // final. Acá se recalcula la lista completa y visible antes de mover, así
  // el resultado del swap siempre queda explícito para todos, no solo para
  // los que ya estaban en la lista guardada.
  function moverBarberoEnEquipo(indice, direccion) {
    setForm((f) => {
      const idsActuales = ordenarEquipo(barberia.barberos, f.orden_equipo).map((b) => b.id)
      const destino = indice + direccion
      if (destino < 0 || destino >= idsActuales.length) return f
      ;[idsActuales[indice], idsActuales[destino]] = [idsActuales[destino], idsActuales[indice]]
      return { ...f, orden_equipo: idsActuales }
    })
  }

  async function agregarImagenesAGaleria(id, evento) {
    const archivos = Array.from(evento.target.files ?? [])
    if (archivos.length === 0) return
    setSubiendo(true)
    try {
      const nuevas = await Promise.all(
        archivos.map(async (archivo) => ({
          url: await archivoAImagenComprimida(archivo, { maxAncho: 1200, maxAlto: 1600 }),
          tamano: 'normal',
          leyenda: '',
        }))
      )
      setForm((f) => ({
        ...f,
        secciones: f.secciones.map((s) =>
          s.id === id ? { ...s, imagenes: [...(s.imagenes ?? []), ...nuevas] } : s
        ),
      }))
    } finally {
      setSubiendo(false)
      evento.target.value = ''
    }
  }

  function moverImagenEnGaleria(idSeccion, indice, direccion) {
    setForm((f) => ({
      ...f,
      secciones: f.secciones.map((s) => {
        if (s.id !== idSeccion) return s
        const destino = indice + direccion
        if (destino < 0 || destino >= s.imagenes.length) return s
        const imagenes = [...s.imagenes]
        ;[imagenes[indice], imagenes[destino]] = [imagenes[destino], imagenes[indice]]
        return { ...s, imagenes }
      }),
    }))
  }

  function quitarImagenDeGaleria(idSeccion, indice) {
    setForm((f) => ({
      ...f,
      secciones: f.secciones.map((s) =>
        s.id === idSeccion ? { ...s, imagenes: s.imagenes.filter((_, i) => i !== indice) } : s
      ),
    }))
  }

  function actualizarFotoEnGaleria(idSeccion, indice, cambios) {
    setForm((f) => ({
      ...f,
      secciones: f.secciones.map((s) =>
        s.id === idSeccion
          ? { ...s, imagenes: s.imagenes.map((foto, i) => (i === indice ? { ...foto, ...cambios } : foto)) }
          : s
      ),
    }))
  }

  async function subirImagenDeSeccion(id, evento) {
    const archivo = evento.target.files?.[0]
    if (!archivo) return
    setSubiendo(true)
    try {
      const dataUrl = await archivoAImagenComprimida(archivo, { maxAncho: 1200, maxAlto: 1200 })
      actualizarSeccion(id, { imagen: dataUrl })
    } finally {
      setSubiendo(false)
      evento.target.value = ''
    }
  }

  async function guardarCambios(evento) {
    evento.preventDefault()
    setEstadoToast('cargando')
    try {
      await guardar.mutateAsync({
        logo_url: form.logo_url,
        direccion: form.direccion,
        telefono_whatsapp: form.telefono_whatsapp,
        color_primario: form.color_primario || null,
        color_header: form.color_header || null,
        fuente_display: form.fuente_display,
        eslogan: form.eslogan,
        descripcion: form.descripcion,
        secciones: form.secciones,
        orden_equipo: form.orden_equipo,
        estilo_whatsapp: form.estilo_whatsapp,
        whatsapp_color: form.whatsapp_color || null,
        whatsapp_tamano: form.whatsapp_tamano,
      })
      setFormGuardado(JSON.stringify(form))
      setEstadoToast('ok')
    } catch {
      setEstadoToast('error')
    }
  }

  if (isLoading || !form) {
    return (
      <div className="py-12">
        <Loader label="Cargando personalización" />
      </div>
    )
  }

  if (isError) {
    return (
      <p role="alert" className="py-8 text-sm text-red-700">
        No pudimos cargar la personalización.
      </p>
    )
  }

  return (
    <div>
      {/* Sangrado completo a propósito, desde el título hasta el formulario:
          todo este bloque necesita más ancho del que deja el contenedor
          angosto del panel (heredado de PanelShell, compartido con el resto
          de las pestañas) — y todo tiene que alinearse al mismo borde
          izquierdo real de la página, título incluido, en vez de que el
          título quede más metido hacia el centro que el formulario de abajo. */}
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen px-6 md:px-10">
        <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
          Personalización
        </h1>
        <p className="mt-2 max-w-lg text-sm text-gris-calido-700">
          Así se ve tu página pública. Cambia lo que quieras a la izquierda — la vista previa de al
          lado se actualiza al instante, con el mismo botón para ver cómo queda en PC o en el
          celular de un cliente, y recién queda pública cuando guardas.{' '}
          <HoverLink href={`/barberias/${barberia.slug}`} target="_blank" rel="noreferrer">
            Ver página pública →
          </HoverLink>
        </p>

        {esMobile && !alertaMovilCerrada && (
          <div className="mt-4 flex items-start justify-between gap-3 rounded-md border border-cobre/40 bg-cobre/10 px-3 py-3 text-xs text-cobre-texto">
            <p>
              Estás viendo esto desde un dispositivo móvil. Te recomendamos usar un computador para
              tener una vista más clara al armar tu página — hay bastante para editar y comparar con
              la vista previa.
            </p>
            <button
              type="button"
              onClick={() => setAlertaMovilCerrada(true)}
              aria-label="Cerrar aviso"
              className="shrink-0 text-cobre-texto/70 hover:text-cobre-texto"
            >
              ✕
            </button>
          </div>
        )}

        {hayCambiosSinGuardar && (
          <p className="mt-4 flex items-center gap-2 rounded-md border border-cobre/40 bg-cobre/10 px-3 py-2 text-xs text-cobre-texto">
            <span aria-hidden="true">●</span> Tenés cambios sin guardar — la página pública todavía
            muestra la versión anterior.
          </p>
        )}

        {/* En pantallas chicas (debajo de `lg`) el grid cae a una sola
            columna — formulario y luego vista previa, como antes. */}
        <form onSubmit={guardarCambios} className="mt-8">
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[480px_minmax(0,1fr)] lg:items-start">
          {/* Columna izquierda: formulario */}
          <div className="flex max-w-lg flex-col gap-12 lg:max-w-none">
          <section className="flex flex-col gap-6">
            <TituloGrupo numero="01">Identidad</TituloGrupo>

            <div className="flex flex-col gap-2">
              <span className="versalitas text-xs text-gris-calido-500">Logo</span>
              <div className="flex items-center gap-4">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gris-calido-200 text-xs text-gris-calido-400">
                    Sin logo
                  </span>
                )}
                <SelectorArchivo etiqueta="Seleccionar imagen" cargando={subiendo} onChange={subirLogo} />
                {form.logo_url && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, logo_url: null }))}
                    className="text-xs text-gris-calido-500 underline-offset-2 hover:text-red-700 hover:underline"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <label className="flex flex-col gap-2">
                <span className="versalitas text-xs text-gris-calido-500">Color de marca</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="color_primario"
                    value={form.color_primario || '#a85c32'}
                    onChange={(e) => setForm((f) => ({ ...f, color_primario: e.target.value }))}
                    className="h-11 w-14 cursor-pointer border border-gris-calido-200 bg-transparent"
                  />
                  {form.color_primario && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color_primario: '' }))}
                      aria-label="Quitar color de marca"
                      className="text-xs text-gris-calido-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="versalitas text-xs text-gris-calido-500">Color del header</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="color_header"
                    value={form.color_header || '#1c1b19'}
                    onChange={(e) => setForm((f) => ({ ...f, color_header: e.target.value }))}
                    className="h-11 w-14 cursor-pointer border border-gris-calido-200 bg-transparent"
                  />
                  {form.color_header && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color_header: '' }))}
                      aria-label="Quitar color del header"
                      className="text-xs text-gris-calido-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <span className="text-xs text-gris-calido-500">El texto se ajusta solo para seguir siendo legible.</span>
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="versalitas text-xs text-gris-calido-500">Tipografía de títulos</span>
              <select
                name="fuente_display"
                value={form.fuente_display}
                onChange={(e) => {
                  const clave = e.target.value
                  asegurarFuenteCargada(clave)
                  setForm((f) => ({ ...f, fuente_display: clave }))
                }}
                className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
              >
                {FUENTES_DISPONIBLES.map((f) => (
                  <option key={f.clave} value={f.clave}>
                    {f.etiqueta}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="flex flex-col gap-6">
            <TituloGrupo numero="02">Textos y contacto</TituloGrupo>

            <label className="flex flex-col gap-2">
              <span className="versalitas text-xs text-gris-calido-500">Eslogan</span>
              <input
                type="text"
                name="eslogan"
                value={form.eslogan}
                onChange={(e) => setForm((f) => ({ ...f, eslogan: e.target.value }))}
                placeholder="Corte de barrio, oficio de siempre"
                className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="versalitas text-xs text-gris-calido-500">Descripción</span>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                rows={3}
                placeholder="Contale a tus clientes qué hace especial a tu barbería."
                className="border-b border-gris-calido-200 bg-transparent py-2 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="versalitas text-xs text-gris-calido-500">Dirección</span>
              <input
                type="text"
                name="direccion"
                value={form.direccion}
                onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                placeholder="Av. Irarrázaval 2140, Ñuñoa"
                className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="versalitas text-xs text-gris-calido-500">Teléfono de WhatsApp</span>
              <input
                type="tel"
                name="telefono_whatsapp"
                value={form.telefono_whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, telefono_whatsapp: e.target.value }))}
                placeholder="+56 9 1111 2222"
                className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
              />
            </label>

            <div className="flex flex-col gap-2">
              <span className="versalitas text-xs text-gris-calido-500">Cómo mostrar el WhatsApp</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, estilo_whatsapp: 'enlace' }))}
                  className={`versalitas rounded-md border px-3 py-2 text-xs transition-colors ${
                    form.estilo_whatsapp === 'enlace'
                      ? 'border-cobre text-cobre-texto'
                      : 'border-gris-calido-200 text-gris-calido-500'
                  }`}
                >
                  Enlace en el header
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, estilo_whatsapp: 'burbuja' }))}
                  className={`versalitas rounded-md border px-3 py-2 text-xs transition-colors ${
                    form.estilo_whatsapp === 'burbuja'
                      ? 'border-cobre text-cobre-texto'
                      : 'border-gris-calido-200 text-gris-calido-500'
                  }`}
                >
                  Burbuja flotante
                </button>
              </div>
              <span className="text-xs text-gris-calido-500">
                {form.estilo_whatsapp === 'burbuja'
                  ? 'Un botón circular fijo en la esquina, visible en toda la página.'
                  : 'El texto "Escribir por WhatsApp" junto a la dirección, en el encabezado.'}
              </span>
            </div>

            {form.estilo_whatsapp === 'burbuja' && (
              <div className="flex flex-col gap-4 rounded-lg border border-gris-calido-200 p-4">
                <label className="flex flex-col gap-2">
                  <span className="versalitas text-xs text-gris-calido-500">Color de la burbuja</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="whatsapp_color"
                      value={form.whatsapp_color || '#a85c32'}
                      onChange={(e) => setForm((f) => ({ ...f, whatsapp_color: e.target.value }))}
                      className="h-11 w-14 cursor-pointer border border-gris-calido-200 bg-transparent"
                    />
                    {form.whatsapp_color && (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, whatsapp_color: '' }))}
                        aria-label="Quitar color de la burbuja de WhatsApp"
                        className="text-xs text-gris-calido-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-gris-calido-500">
                    Sin elegir, usa el color de marca (arriba, en Identidad).
                  </span>
                </label>

                <div className="flex flex-col gap-2">
                  <span className="versalitas text-xs text-gris-calido-500">Tamaño</span>
                  <div className="flex gap-2">
                    {[
                      ['chica', 'Chica'],
                      ['mediana', 'Mediana'],
                      ['grande', 'Grande'],
                    ].map(([valor, etiqueta]) => (
                      <button
                        key={valor}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, whatsapp_tamano: valor }))}
                        className={`versalitas rounded-md border px-3 py-2 text-xs transition-colors ${
                          form.whatsapp_tamano === valor
                            ? 'border-cobre text-cobre-texto'
                            : 'border-gris-calido-200 text-gris-calido-500'
                        }`}
                      >
                        {etiqueta}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <TituloGrupo numero="03">Secciones de la página</TituloGrupo>

            {!puedeSecciones ? (
              <div className="rounded-lg border border-dashed border-cobre/40 bg-cobre/5 p-5">
                <p className="text-sm text-gris-calido-700">
                  Las secciones extra (galería de fotos, imagen y texto, y tu equipo de barberos) están
                  disponibles desde el plan <strong>Equipo</strong>. Si ya tenías secciones armadas de
                  antes, siguen guardadas — vuelven a aparecer apenas subas de plan.
                </p>
                <p className="mt-2 text-xs text-gris-calido-500">
                  Habla con el administrador de la plataforma para mejorar tu plan.
                </p>
              </div>
            ) : (
              <>
                <p className="-mt-2 text-xs text-gris-calido-500">
                  Click en una sección para abrirla y editarla — el orden de la lista es el orden real en
                  tu página, entre el encabezado y el formulario de reserva. Incluye galerías, bloques de
                  imagen y texto, y tu equipo de barberos — todo se puede reordenar entre sí, por ejemplo
                  para mostrar el equipo antes o después de las fotos del trabajo.
                </p>

                {form.secciones.map((seccion, indice) => {
              const abierta = seccionAbiertaId === seccion.id
              return (
                <div
                  key={seccion.id}
                  className={`overflow-hidden rounded-lg border transition-colors ${abierta ? 'border-cobre' : 'border-gris-calido-200'}`}
                >
                  <div className="flex items-center justify-between gap-2 p-3">
                    <button
                      type="button"
                      onClick={() => setSeccionAbiertaId(abierta ? null : seccion.id)}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      <span className="text-xs text-gris-calido-400">{abierta ? '▾' : '▸'}</span>
                      <span className="versalitas shrink-0 text-xs text-gris-calido-500">
                        {ETIQUETA_TIPO_SECCION[seccion.tipo]}
                      </span>
                      <span className="truncate text-sm text-negro-barbero">
                        {resumenSeccion(seccion, equipoOrdenado.length)}
                      </span>
                    </button>
                    <div className="flex shrink-0 gap-2 text-xs text-gris-calido-500">
                      <button
                        type="button"
                        onClick={() => moverSeccion(indice, -1)}
                        disabled={indice === 0}
                        aria-label="Subir esta sección"
                        className="disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moverSeccion(indice, 1)}
                        disabled={indice === form.secciones.length - 1}
                        aria-label="Bajar esta sección"
                        className="disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button type="button" onClick={() => quitarSeccion(seccion.id)} className="hover:text-red-700">
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {abierta && (
                    <div className="border-t border-gris-calido-200 bg-hueso/60 p-4">
                      {seccion.tipo === 'galeria' && (
                        <div className="flex flex-col gap-4">
                          <input
                            type="text"
                            name="seccion_titulo"
                            value={seccion.titulo}
                            onChange={(e) => actualizarSeccion(seccion.id, { titulo: e.target.value })}
                            placeholder="Título de la sección — ej: Nuestro trabajo"
                            className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
                          />

                          <div className="flex flex-wrap gap-3">
                            {(seccion.imagenes ?? []).map((foto, i) => (
                              <div key={i} className="flex w-40 flex-col gap-2 rounded border border-gris-calido-200 bg-white p-2">
                                <img src={foto.url} alt={`Foto ${i + 1}`} className="h-24 w-full rounded object-cover" />
                                <input
                                  type="text"
                                  name="foto_leyenda"
                                  value={foto.leyenda}
                                  onChange={(e) => actualizarFotoEnGaleria(seccion.id, i, { leyenda: e.target.value })}
                                  placeholder="Leyenda"
                                  className="min-h-8 border-b border-gris-calido-200 bg-transparent py-1 text-xs text-negro-barbero outline-none transition-colors focus:border-cobre"
                                />
                                <div className="flex items-center gap-2 text-xs text-gris-calido-500">
                                  <Interruptor
                                    activo={foto.tamano === 'grande'}
                                    etiqueta={`Destacar foto ${i + 1}`}
                                    onCambiar={(valor) =>
                                      actualizarFotoEnGaleria(seccion.id, i, { tamano: valor ? 'grande' : 'normal' })
                                    }
                                  />
                                  Destacar
                                </div>
                                <div className="flex items-center justify-between text-xs text-gris-calido-500">
                                  <button
                                    type="button"
                                    onClick={() => moverImagenEnGaleria(seccion.id, i, -1)}
                                    disabled={i === 0}
                                    aria-label={`Mover foto ${i + 1} antes`}
                                    className="disabled:opacity-30"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moverImagenEnGaleria(seccion.id, i, 1)}
                                    disabled={i === seccion.imagenes.length - 1}
                                    aria-label={`Mover foto ${i + 1} después`}
                                    className="disabled:opacity-30"
                                  >
                                    ↓
                                  </button>
                                  <button type="button" onClick={() => quitarImagenDeGaleria(seccion.id, i)} className="hover:text-red-700">
                                    Quitar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <SelectorArchivo
                            etiqueta="Agregar fotos"
                            cargando={subiendo}
                            multiple
                            onChange={(e) => agregarImagenesAGaleria(seccion.id, e)}
                          />
                        </div>
                      )}

                      {seccion.tipo === 'imagen_texto' && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            {seccion.imagen ? (
                              <img src={seccion.imagen} alt="" className="h-14 w-14 rounded object-cover" />
                            ) : (
                              <span className="flex h-14 w-14 items-center justify-center rounded border border-gris-calido-200 text-xs text-gris-calido-400">
                                Sin foto
                              </span>
                            )}
                            <SelectorArchivo
                              etiqueta="Seleccionar imagen"
                              cargando={subiendo}
                              onChange={(e) => subirImagenDeSeccion(seccion.id, e)}
                            />
                          </div>
                          <input
                            type="text"
                            name="seccion_titulo"
                            value={seccion.titulo}
                            onChange={(e) => actualizarSeccion(seccion.id, { titulo: e.target.value })}
                            placeholder="Título — ej: Nuestro espacio"
                            className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
                          />
                          <textarea
                            name="seccion_texto"
                            value={seccion.texto}
                            onChange={(e) => actualizarSeccion(seccion.id, { texto: e.target.value })}
                            rows={2}
                            placeholder="Texto que acompaña a la imagen"
                            className="border-b border-gris-calido-200 bg-transparent py-2 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
                          />
                        </div>
                      )}

                      {seccion.tipo === 'equipo' && (
                        <div className="flex flex-col gap-4">
                          <input
                            type="text"
                            name="seccion_titulo"
                            value={seccion.titulo}
                            onChange={(e) => actualizarSeccion(seccion.id, { titulo: e.target.value })}
                            placeholder="Título de la sección — ej: Nuestro equipo"
                            className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
                          />
                          <p className="text-xs text-gris-calido-500">
                            Este es el orden en que aparecen. Para agregar, quitar o editar la foto y la
                            especialidad de un barbero, ve a la pestaña "Barberos".
                          </p>
                          {equipoOrdenado.length === 0 ? (
                            <p className="text-sm text-gris-calido-500">Todavía no tienes barberos activos.</p>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {equipoOrdenado.map((barbero, i) => (
                                <div
                                  key={barbero.id}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-gris-calido-200 bg-white px-3 py-2"
                                >
                                  <div className="flex items-center gap-3">
                                    {barbero.foto_url ? (
                                      <img src={barbero.foto_url} alt={barbero.nombre} className="h-9 w-9 rounded-full object-cover" />
                                    ) : (
                                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gris-calido-200 text-xs text-gris-calido-400">
                                        {barbero.nombre.trim().charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                    <span className="text-sm text-negro-barbero">{barbero.nombre}</span>
                                  </div>
                                  <div className="flex gap-2 text-xs text-gris-calido-500">
                                    <button
                                      type="button"
                                      onClick={() => moverBarberoEnEquipo(i, -1)}
                                      disabled={i === 0}
                                      aria-label={`Mover a ${barbero.nombre} antes en el equipo`}
                                      className="disabled:opacity-30"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moverBarberoEnEquipo(i, 1)}
                                      disabled={i === equipoOrdenado.length - 1}
                                      aria-label={`Mover a ${barbero.nombre} después en el equipo`}
                                      className="disabled:opacity-30"
                                    >
                                      ↓
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => agregarSeccion('galeria')}
                className="versalitas rounded-md border border-gris-calido-200 px-3 py-2 text-xs text-gris-calido-700 hover:border-cobre hover:text-cobre-texto"
              >
                + Galería de fotos
              </button>
              <button
                type="button"
                onClick={() => agregarSeccion('imagen_texto')}
                className="versalitas rounded-md border border-gris-calido-200 px-3 py-2 text-xs text-gris-calido-700 hover:border-cobre hover:text-cobre-texto"
              >
                + Imagen y texto
              </button>
              {/* Normalmente ya existe una (se agrega sola la primera vez que
                  se carga esta pantalla) — este botón solo hace falta si se
                  la borró a propósito y se quiere volver a mostrar el equipo. */}
              {!form.secciones.some((s) => s.tipo === 'equipo') && (
                <button
                  type="button"
                  onClick={() => agregarSeccion('equipo')}
                  className="versalitas rounded-md border border-gris-calido-200 px-3 py-2 text-xs text-gris-calido-700 hover:border-cobre hover:text-cobre-texto"
                >
                  + Nuestro equipo
                </button>
              )}
            </div>
              </>
            )}
          </section>

          {/* El botón queda al final del formulario a propósito — se edita,
              se mira la vista previa (que está siempre visible al lado, sin
              scrollear) y solo ahí tiene sentido decidir guardar. */}
          <div className="flex flex-col gap-3">
            <Button as="button" type="submit" disabled={guardar.isPending || subiendo} className="w-fit">
              {guardar.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
          </div>

          {/* Columna derecha: vista previa — "sticky" para que no haya que
              scrollear entre editar y mirar el resultado: mientras el
              formulario de la izquierda se desplaza, esta columna queda fija
              en pantalla (a partir de `lg`; en pantallas más chicas cae
              debajo del formulario, como una sección más). */}
          <div className="lg:sticky lg:top-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="versalitas text-xs text-gris-calido-700">— Vista previa</span>
              {/* En un celular real solo existe el modo Móvil — no tiene
                  sentido ofrecer "PC" (fuerza un ancho mínimo de 768px que
                  desborda la pantalla) ni mostrar un botón para alternar
                  a algo que va a romper el diseño de la página. */}
              {!esMobile && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModoVista('pc')}
                    className={`versalitas rounded-md border px-3 py-1.5 text-xs transition-colors ${
                      modoVista === 'pc' ? 'border-cobre text-cobre-texto' : 'border-gris-calido-200 text-gris-calido-500'
                    }`}
                  >
                    PC
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoVista('movil')}
                    className={`versalitas rounded-md border px-3 py-1.5 text-xs transition-colors ${
                      modoVista === 'movil' ? 'border-cobre text-cobre-texto' : 'border-gris-calido-200 text-gris-calido-500'
                    }`}
                  >
                    Móvil
                  </button>
                </div>
              )}
            </div>

            {/* En modo PC el iframe se estira con `w-full` para aprovechar
                todo el ancho que la columna tenga disponible (ahora que la
                columna ya no está limitada por un `max-w` central) — con un
                piso de 768px (`min-w`) para que sigan activándose los `md:`
                de Tailwind y sea un layout de escritorio genuino incluso si
                la ventana es angosta; en ese caso extremo, esta caja
                scrollea horizontalmente en vez de mentir con un layout
                mobile dentro de "PC". El "marco de teléfono" de 390px fijo
                en modo Móvil solo tiene sentido cuando hay espacio de sobra
                alrededor (viendo esto desde una pantalla grande) — en un
                celular real ese ancho fijo no entra en el espacio ya angosto
                de la propia pantalla y desborda la página; ahí el iframe
                simplemente ocupa el ancho disponible (`w-full`), sin marco.
                La ALTURA es fija (80% del alto de la ventana) y el <iframe>
                scrollea por dentro si el contenido es más alto — a propósito
                nomás: es lo mismo que pasa en un navegador real (una ventana
                de tamaño fijo, con scroll interno), y es lo único que hace
                que elementos con posición fija de verdad (como la burbuja de
                WhatsApp) queden pegados al borde de ESTA ventana en vez de
                aparecer perdidos al final de todo el contenido. Por eso no
                hay ningún `overflow` puesto en esta caja de afuera — el único
                scroll tiene que ser el del <iframe>, nunca dos superpuestos. */}
            <div className="overflow-hidden rounded-lg border border-gris-calido-200 bg-white">
              <div className={modoVista === 'movil' && !esMobile ? 'mx-auto w-[390px] py-4' : ''}>
                <iframe
                  ref={iframeRef}
                  src="/_preview-barberia"
                  title="Vista previa de la página pública"
                  onLoad={alCargarIframe}
                  className={`h-[80vh] border-0 bg-hueso ${
                    modoVista === 'movil'
                      ? esMobile
                        ? 'w-full'
                        : 'w-[390px] rounded-lg shadow-lg'
                      : 'w-full min-w-[768px]'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
        </form>
      </div>

      <ToastGuardado estado={estadoToast} />
    </div>
  )
}
