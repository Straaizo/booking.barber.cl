// Fondo del hero en mobile: fotos reales de barbería, ya redimensionadas y
// comprimidas para fondo (generadas con sharp desde src/assets/inicio/loginN.jpg
// — esos originales quedan solo como fuente, no se compilan al bundle).
export const FONDOS_HERO_MOVIL = [
  {
    id: 'corte',
    webp: '/images/hero-movil/corte.webp',
    jpg: '/images/hero-movil/corte.jpg',
    objectPosition: 'center 40%',
  },
  {
    id: 'herramientas',
    webp: '/images/hero-movil/herramientas.webp',
    jpg: '/images/hero-movil/herramientas.jpg',
    objectPosition: 'center 35%',
  },
  {
    id: 'salon',
    webp: '/images/hero-movil/salon.webp',
    jpg: '/images/hero-movil/salon.jpg',
    objectPosition: 'center 45%',
  },
  {
    id: 'sillon',
    webp: '/images/hero-movil/sillon.webp',
    jpg: '/images/hero-movil/sillon.jpg',
    objectPosition: 'center 40%',
  },
]

export const DURACION_FONDO_MS = 3500
export const DURACION_TRANSICION_FONDO_MS = 1500
