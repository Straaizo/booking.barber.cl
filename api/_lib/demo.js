// Copia mínima e independiente de `src/config/demo.js` (solo los 4 campos
// que necesita la previsualización) — a propósito NO se importa ese archivo
// desde acá: mantiene esta función serverless sin acoplarse al bundle de la
// SPA, así un cambio ahí nunca puede romper el build de `api/`. Si el
// nombre/eslogan de la barbería demo cambia algún día, hay que actualizar
// los dos lugares.
export const BARBERIA_DEMO = {
  slug: 'demo',
  nombre: 'Barbería El Andén',
  eslogan: 'Tradición porteña, cortes de siempre',
  direccion: 'Av. Providencia 1234, Providencia',
  logo_url: null,
}
