// Redimensiona una imagen subida por el usuario a un JPEG liviano vía un
// <canvas> fuera de pantalla — nunca agranda, solo achica si excede el
// máximo. Devuelve un Blob (no un data URL): lo que sigue es subirlo a
// Storage, no guardarlo como texto — ver `subirImagenBarberia` en
// `services/storageImagenes.js`.
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
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo comprimir la imagen'))),
          'image/jpeg',
          calidad
        )
      }
      imagen.src = lector.result
    }
    lector.readAsDataURL(archivo)
  })
}
