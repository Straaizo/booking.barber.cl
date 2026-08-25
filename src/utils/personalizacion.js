// Tipos de sección configurable que la página pública sabe renderizar — cada
// barbería arma su propia lista (agrega, quita, reordena) desde el panel de
// personalización. Agregar un tipo nuevo acá + su bloque en VistaBarberia.jsx
// es todo lo que hace falta para sumar una opción más. "equipo" (la lista de
// barberos) es una sección más entre las demás a propósito: así se puede
// intercalar libremente con las galerías/imagen-y-texto — antes del trabajo,
// después, en el medio — en vez de vivir fija siempre en el mismo lugar,
// justamente para que no todas las páginas terminen con la misma forma.
export const TIPOS_SECCION = ['galeria', 'imagen_texto', 'equipo', 'testimonios', 'horario']

// Cada foto de una sección de galería es un objeto (url + tamaño + leyenda),
// no un string suelto — permite que la barbería destaque unas fotos más que
// otras en la grilla. `normalizarFoto` acepta también el shape viejo (solo la
// URL como string) para no perder fotos ya guardadas.
function normalizarFoto(foto) {
  if (typeof foto === 'string') return { url: foto, tamano: 'normal', leyenda: '' }
  return { tamano: 'normal', leyenda: '', ...foto }
}

function normalizarTestimonio(testimonio) {
  return { nombre: '', texto: '', estrellas: 5, ...testimonio }
}

function normalizarSeccion(seccion) {
  if (seccion.tipo === 'galeria') {
    // 'grilla' (de siempre) o 'carrusel' (una foto grande a la vez, deslizando).
    // `posicion`/`texto*` solo aplican al carrusel: 'centro' (de siempre, sin
    // texto al lado) o 'izquierda'/'derecha' (el carrusel queda en una
    // columna y aparece un texto acompañante en la columna opuesta — mismo
    // patrón que ya usa "Imagen y texto").
    return {
      titulo: 'Galería',
      estilo: 'grilla',
      posicion: 'centro',
      texto: '',
      texto_cursiva: false,
      texto_subrayado: false,
      // `null` = usa la misma tipografía de títulos del resto del sitio
      // (`fuente_display`) — un valor explícito la independiza.
      texto_fuente: null,
      texto_tamano: 'mediana',
      // Frase destacada al final del texto (ej: la última oración de un
      // eslogan) — siempre subrayada, con tamaño, tipografía y color
      // propios, independientes de los del texto normal (`null` en
      // `texto_resaltado_fuente`/`texto_resaltado_color` = hereda lo del
      // texto normal / usa el color de marca).
      texto_resaltado: '',
      texto_resaltado_color: null,
      texto_resaltado_tamano: 'grande',
      texto_resaltado_fuente: null,
      // Qué tan grande es la foto en sí — independiente de `estilo`/`posicion`.
      imagen_tamano: 'mediana',
      ...seccion,
      imagenes: (seccion.imagenes ?? []).map(normalizarFoto),
    }
  }
  if (seccion.tipo === 'equipo') {
    // 'grilla' (de siempre) o 'carrusel' (un barbero a la vez, deslizando).
    return { titulo: 'Nuestro equipo', estilo: 'grilla', ...seccion }
  }
  if (seccion.tipo === 'imagen_texto') {
    // De qué lado va la imagen en desktop — en mobile siempre queda apilada
    // (imagen arriba, texto abajo) sin importar esto.
    return { posicion_imagen: 'izquierda', ...seccion }
  }
  if (seccion.tipo === 'horario') {
    // El horario en sí se calcula siempre de los `horarios_disponibles`
    // reales (nunca se escribe a mano, ver `resumenHorarioSemanal` en
    // utils/horarios.js) — esta sección solo guarda cómo se ve: título,
    // posición, e imagen opcional del local para darle más credibilidad
    // (mismo patrón que "Imagen y texto"/el carrusel de galería).
    return {
      titulo: 'Horario de atención',
      posicion: 'centro',
      imagen: null,
      imagen_tamano: 'mediana',
      ...seccion,
    }
  }
  if (seccion.tipo === 'testimonios') {
    // 'carrusel' (de siempre, una reseña a la vez) o 'lista' (todas visibles
    // a la vez, en tarjetas — mejor con varias reseñas cargadas). `null` en
    // `fuente`/`color_texto` hereda del sitio; `color_fondo` solo se ve en
    // modo "lista" (el fondo de cada tarjeta) — `null` = blanco, de siempre.
    return {
      titulo: 'Lo que dicen nuestros clientes',
      estilo: 'carrusel',
      tamano: 'mediana',
      fuente: null,
      color_texto: null,
      color_fondo: null,
      ...seccion,
      items: (seccion.items ?? []).map(normalizarTestimonio),
    }
  }
  return seccion
}

// Normaliza `personalizacion` a la forma actual, sin importar si viene del
// mock provisorio o de Supabase real — incluye la migración desde el shape
// viejo (`galeria` + `secciones_visibles` sueltos, de antes de que existiera
// `secciones`) para no perder datos ya guardados por alguien que probó una
// versión anterior de esta pantalla.
//
// "equipo" pasó de ser un bloque fijo (siempre debajo del encabezado) a ser
// una sección más, reordenable — así que cualquier barbería que ya tenía
// `secciones` guardadas de antes de este cambio (sin ninguna de tipo
// "equipo" todavía) recibe una al principio de la lista, en la MISMA
// posición visual que ya tenía: nadie pierde su "Nuestro equipo" solo por
// no haber tocado nada en esta pantalla.
export function normalizarPersonalizacion(personalizacion) {
  const p = personalizacion ?? {}
  let secciones = Array.isArray(p.secciones) ? p.secciones : null
  if (!secciones) {
    secciones =
      p.galeria?.length > 0 && p.secciones_visibles?.includes('galeria')
        ? [{ id: 'sec-galeria-migrada', tipo: 'galeria', imagenes: p.galeria }]
        : []
  }
  secciones = secciones.map(normalizarSeccion)
  if (!secciones.some((s) => s.tipo === 'equipo')) {
    secciones = [{ id: 'sec-equipo-migrada', tipo: 'equipo', titulo: 'Nuestro equipo' }, ...secciones]
  }
  // "horario" pasó de ser un bloque fijo (siempre antes de la vidriera de
  // servicios) a ser una sección más — igual criterio que "equipo": nadie
  // pierde su horario visible solo por no haber tocado nada en esta
  // pantalla. Va al FINAL (no al principio, como equipo) para mantener la
  // posición visual que ya tenía, justo antes de servicios/reserva.
  if (!secciones.some((s) => s.tipo === 'horario')) {
    secciones = [...secciones, { id: 'sec-horario-migrada', tipo: 'horario', titulo: 'Horario de atención' }]
  }
  return {
    color_primario: null,
    color_header: null,
    fuente_display: 'fraunces',
    tema: 'claro',
    eslogan: '',
    // `null` = el eslogan usa el contraste automático de siempre según el
    // color del header; un valor explícito lo independiza.
    eslogan_color: null,
    descripcion: '',
    banner_url: null,
    orden_equipo: [],
    // 'enlace': el texto "Escribir por WhatsApp" junto a la dirección, en el
    // encabezado (lo de siempre). 'burbuja': un botón circular flotante fijo
    // en la esquina, visible en toda la página — mutuamente excluyentes, la
    // barbería elige uno de los dos, no ambos a la vez.
    estilo_whatsapp: 'enlace',
    // `null` = usa el color de marca (`color_primario`) — recién si se elige
    // uno explícito se independiza del resto de la identidad.
    whatsapp_color: null,
    whatsapp_tamano: 'mediana',
    // La vidriera de servicios es un dato real (no contenido escrito a
    // mano), pero a diferencia de "horario" no necesita posición/imagen
    // propia todavía — se queda como un toggle simple. `1` = visible.
    mostrar_servicios: 1,
    ...p,
    secciones,
  }
}

// Orden de "Nuestro equipo" en la página pública: `ordenIds` guarda los ids
// de barbero en el orden elegido desde Personalización. Un barbero activo
// que todavía no aparece ahí (recién agregado desde la pestaña Barberos, o
// nunca se tocó el orden) no desaparece — se agrega al final, en el orden en
// que ya venía. Se exporta desde acá (no vive suelta en cada pantalla) para
// que el panel y la página pública ordenen exactamente igual.
export function ordenarEquipo(barberos, ordenIds) {
  const orden = ordenIds ?? []
  const posicion = (id) => {
    const indice = orden.indexOf(id)
    return indice === -1 ? orden.length : indice
  }
  return [...(barberos ?? []).filter((b) => b.activo)].sort(
    (a, b) => posicion(a.id) - posicion(b.id)
  )
}
