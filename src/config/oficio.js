// Fila del marquee "el oficio" en la home. Mientras no haya fotografía real de
// barberías clientes, se muestran texturas/ilustraciones de detalle (sin
// rostros) en vez de fotos de stock. Cuando una barbería cliente autorice sus
// fotos, agrega { id, etiqueta, imagenUrl } — si `imagenUrl` está presente el
// componente Marquee la usa directamente en vez del placeholder ilustrado.
export const ITEMS_OFICIO = [
  { id: 'navaja', etiqueta: 'Navaja recta', imagenUrl: null },
  { id: 'peine', etiqueta: 'Peine de carey', imagenUrl: null },
  { id: 'sillon', etiqueta: 'Sillón de cuero', imagenUrl: null },
  { id: 'tijera', etiqueta: 'Tijera de acero', imagenUrl: null },
  { id: 'brocha', etiqueta: 'Brocha de afeitar', imagenUrl: null },
  { id: 'espejo', etiqueta: 'Espejo de barbería', imagenUrl: null },
]
