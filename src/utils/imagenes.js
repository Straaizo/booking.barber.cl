// Redimensiona una imagen subida por el usuario a un data URL liviano (JPEG),
// vía un <canvas> fuera de pantalla — nunca agranda, solo achica si excede
// el máximo. Se usa para guardar fotos en `localStorage` (modo provisorio,
// sin Storage real de Supabase todavía) sin agotar su cuota de ~5MB con una
// sola foto de cámara sin comprimir.
export function archivoAImagenComprimida(archivo, { maxAncho = 1200, maxAlto = 1200, calidad = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onerror = () => reject(new Error('No se pudo leer el archivo'))
    lector.onload = () => {
      const imagen = new Image()
      imagen.onerror = () => reject(new Error('No se pudo procesar la imagen'))
      imagen.onload = () => {
        const escala = Math.min(1, maxAncho / imagen.width, maxAlto / imagen.height)
        const ancho = Math.round(imagen.width * escala)
        const alto = Math.round(imagen.height * escala)
        const canvas = document.createElement('canvas')
        canvas.width = ancho
        canvas.height = alto
        canvas.getContext('2d').drawImage(imagen, 0, 0, ancho, alto)
        resolve(canvas.toDataURL('image/jpeg', calidad))
      }
      imagen.src = lector.result
    }
    lector.readAsDataURL(archivo)
  })
}
