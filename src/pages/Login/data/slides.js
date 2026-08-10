// Pares imagen + slogan del carrusel del login. Editar acá, nunca en el JSX.
//
// Mientras no exista fotografía real de barberías clientes, `placeholder` es
// una composición abstracta de luz/color (sin rostros, sin objetos literales)
// que evoca la escena descrita en el comentario de cada slide.
//
// Para reemplazar por una foto real: cambiar `placeholder` (string) por
// `fuentes` (objeto) con esta forma —`ImagenCarrusel.jsx` ya sabe usar
// cualquiera de las dos formas, no hay que tocar ningún componente:
//
//   fuentes: {
//     webp: '/images/login/silla.webp',
//     jpg: '/images/login/silla.jpg',
//     webpMovil: '/images/login/silla-movil.webp',
//     jpgMovil: '/images/login/silla-movil.jpg',
//   }
//
// Especificaciones para la foto real: orientación vertical (o recorte
// vertical ya encuadrado), ~1400×2000px mínimo, WebP con fallback JPG, sin
// rostros identificables — planos de detalle del oficio (herramientas,
// texturas, manos, luz sobre superficies).
export const SLIDES_LOGIN = [
  {
    id: 'silla',
    // Foto real: fila de sillones clásicos, luz cálida de lámparas colgantes.
    fuentes: {
      webp: '/images/login/silla.webp',
      jpg: '/images/login/silla.jpg',
      webpMovil: '/images/login/silla-movil.webp',
      jpgMovil: '/images/login/silla-movil.jpg',
    },
    objectPosition: 'center 35%',
    objectPositionMovil: 'center 70%',
    alt: 'Fila de sillones de barbería clásicos, iluminados con lámparas colgantes',
    slogan: 'Tu día, ordenado antes de empezar.',
  },
  {
    id: 'tijera',
    // Foto real: manos del barbero con máquina, plano cerrado, cliente de espalda.
    fuentes: {
      webp: '/images/login/tijera.webp',
      jpg: '/images/login/tijera.jpg',
      webpMovil: '/images/login/tijera-movil.webp',
      jpgMovil: '/images/login/tijera-movil.jpg',
    },
    objectPosition: 'center 45%',
    objectPositionMovil: 'center 25%',
    alt: 'Primer plano de las manos de un barbero trabajando con una máquina',
    slogan: 'Tú al oficio. Nosotros a la agenda.',
  },
  {
    id: 'herramientas',
    // Foto real: máquinas y peines sobre un mesón de madera.
    fuentes: {
      webp: '/images/login/herramientas.webp',
      jpg: '/images/login/herramientas.jpg',
      webpMovil: '/images/login/herramientas-movil.webp',
      jpgMovil: '/images/login/herramientas-movil.jpg',
    },
    objectPosition: 'center 40%',
    objectPositionMovil: 'center 40%',
    alt: 'Herramientas de barbería ordenadas sobre un mesón de madera',
    slogan: 'Tu mesón en orden. Tu agenda también.',
  },
  {
    id: 'listo',
    // Foto real: toalla lista sobre el sillón, textura de cuero croc, luz cálida.
    fuentes: {
      webp: '/images/login/listo.webp',
      jpg: '/images/login/listo.jpg',
      webpMovil: '/images/login/listo-movil.webp',
      jpgMovil: '/images/login/listo-movil.jpg',
    },
    objectPosition: 'center 45%',
    objectPositionMovil: 'center 55%',
    alt: 'Toalla lista sobre un sillón de barbería, textura de cuero',
    slogan: 'Todo listo para el próximo turno.',
  },
]

// Duración de cada slide y de la transición — un solo lugar para ajustar el
// ritmo de todo el carrusel.
export const DURACION_SLIDE_MS = 4000
export const DURACION_TRANSICION_MS = 1200
export const DESFASE_TEXTO_MS = 500
