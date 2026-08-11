// Tipos de sección configurable que la página pública sabe renderizar — cada
// barbería arma su propia lista (agrega, quita, reordena) desde el panel de
// personalización. Agregar un tipo nuevo acá + su bloque en VistaBarberia.jsx
// es todo lo que hace falta para sumar una opción más.
export const TIPOS_SECCION = ['galeria', 'imagen_texto']

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
  return seccion
}

// Normaliza `personalizacion` a la forma actual, sin importar si viene del
// mock provisorio o de Supabase real — incluye la migración desde el shape
// viejo (`galeria` + `secciones_visibles` sueltos, de antes de que existiera
// `secciones`) para no perder datos ya guardados por alguien que probó una
// versión anterior de esta pantalla.
export function normalizarPersonalizacion(personalizacion) {
  const p = personalizacion ?? {}
  let secciones = Array.isArray(p.secciones) ? p.secciones : null
  if (!secciones) {
    secciones =
      p.galeria?.length > 0 && p.secciones_visibles?.includes('galeria')
        ? [{ id: 'sec-galeria-migrada', tipo: 'galeria', imagenes: p.galeria }]
        : []
  }
  return {
    color_primario: null,
    color_header: null,
    fuente_display: 'fraunces',
    eslogan: '',
    descripcion: '',
    banner_url: null,
    ...p,
    secciones: secciones.map(normalizarSeccion),
  }
}
