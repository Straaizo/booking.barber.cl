import { supabase } from './supabaseClient'
import { archivoAImagenComprimida } from '../utils/imagenes'

// Bucket público (logo, fotos de barbero, galería, imágenes de sección) —
// política RLS real en supabase/migrations/20260824000001_storage_imagenes.sql:
// lectura para cualquiera, escritura solo dentro de la carpeta de la propia
// barbería (o cualquiera, para superadmin).
const BUCKET = 'imagenes-barberias'

// Comprime la imagen y la sube a Storage bajo la carpeta de la barbería —
// coincide con la política RLS del bucket, que solo deja escribir dentro de
// la propia carpeta. Devuelve la URL pública final, lista para guardar en la
// fila real (`logo_url`, `foto_url`, `secciones[].imagen`, etc.) — antes acá
// se guardaba la imagen entera como texto (data URL) en esa misma columna;
// ver la nota en `utils/imagenes.js` y la entrada (31) de la bitácora.
export async function subirImagenBarberia(archivo, { barberiaId, ...opciones }) {
  const blob = await archivoAImagenComprimida(archivo, opciones)
  const nombre = `${barberiaId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(nombre, blob, {
    contentType: 'image/jpeg',
    cacheControl: '31536000', // 1 año — cada subida tiene un nombre nuevo, nunca se reescribe
  })
  if (error) throw error
  return supabase.storage.from(BUCKET).getPublicUrl(nombre).data.publicUrl
}

// Borra una imagen anterior por su URL pública, de mejor esfuerzo — se llama
// después de reemplazar o quitar una imagen para no ir dejando archivos
// huérfanos. Si la URL es de otro origen (o un data URL viejo, de antes de
// esta migración) no hace nada: nunca hay que romper el flujo que la llama
// por no poder borrar algo que no le pertenece a este bucket.
export async function borrarImagenBarberia(url) {
  if (!url || !url.includes(`/${BUCKET}/`)) return
  const ruta = url.split(`/${BUCKET}/`)[1]
  if (!ruta) return
  await supabase.storage.from(BUCKET).remove([ruta]).catch(() => {})
}
