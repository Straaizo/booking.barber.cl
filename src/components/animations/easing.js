// Firma de movimiento del sitio — mismas curvas y duraciones en todas las
// animaciones (home, página de barbería, paneles). No usar cubic-bezier ni
// duraciones sueltas fuera de este archivo.
export const EASE_ENTRADA = [0.16, 1, 0.3, 1]
export const EASE_SALIDA = [0.7, 0, 0.84, 0]
export const EASE_REBOTE = [0.34, 1.56, 0.64, 1]

export const DURACION_MICRO = 0.2 // hover, tap, toggles pequeños
export const DURACION_BASE = 0.6 // reveals de texto/párrafos
export const DURACION_LENTA = 0.9 // entradas grandes (hero, titulares extensos)

export const STAGGER_TEXTO = 0.045 // entre palabras de un titular
export const STAGGER_LISTA = 0.09 // entre filas/tarjetas de una lista
