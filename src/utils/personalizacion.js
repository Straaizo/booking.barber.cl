// Tipos de sección configurable que la página pública sabe renderizar — cada
// barbería arma su propia lista (agrega, quita, reordena) desde el panel de
// personalización. Agregar un tipo nuevo acá + su bloque en VistaBarberia.jsx
// es todo lo que hace falta para sumar una opción más. "equipo" (la lista de
// barberos) es una sección más entre las demás a propósito: así se puede
// intercalar libremente con las galerías/imagen-y-texto — antes del trabajo,
// después, en el medio — en vez de vivir fija siempre en el mismo lugar,
// justamente para que no todas las páginas terminen con la misma forma.
export const TIPOS_SECCION = ['galeria', 'imagen_texto', 'equipo']

// Cada foto de una sección de galería es un objeto (url + tamaño + leyenda),
// no un string suelto — permite que la barbería destaque unas fotos más que
// otras en la grilla. `normalizarFoto` acepta también el shape viejo (solo la
// URL como string) para no perder fotos ya guardadas.
function normalizarFoto(foto) {
  if (typeof foto === 'string') return { url: foto, tamano: 'normal', leyenda: '' }
  return { tamano: 'normal', leyenda: '', ...foto }
}

function normalizarSeccion(seccion) {
  if (seccion.tipo === 'galeria') {
    return {
      titulo: 'Galería',
      ...seccion,
      imagenes: (seccion.imagenes ?? []).map(normalizarFoto),
    }
  }
  if (seccion.tipo === 'equipo') {
    return { titulo: 'Nuestro equipo', ...seccion }
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
  return {
    color_primario: null,
    color_header: null,
    fuente_display: 'fraunces',
    eslogan: '',
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
