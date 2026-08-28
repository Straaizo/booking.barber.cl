// Marco de celular dibujado en CSS — no una foto de stock de iPhone.
// El alto es un PISO (min-h), no un techo: mantiene la proporción de celular
// real aunque el contenido sea corto (ej. solo 2 filas de "Elige un barbero"),
// pero si algún día una pantalla necesita más espacio que ese piso, crece —
// nunca vuelve a recortarse contra un techo fijo como pasaba antes.
export function PhoneMockup({ children }) {
  return (
    <div className="relative mx-auto w-64 rounded-[2.5rem] border-[6px] border-negro-barbero bg-negro-barbero p-2 shadow-xl md:w-72">
      <div className="absolute left-1/2 top-3 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-black/50" />
      {/* flex, no bloque simple: un hijo con altura porcentual (100%) no se
          estira contra un padre cuyo alto viene solo de min-h — con flex sí,
          el motor de flexbox reparte el espacio libre respetando el piso. */}
      <div className="relative flex min-h-[28rem] flex-col overflow-hidden rounded-[2rem] bg-hueso md:min-h-[31rem]">
        {children}
      </div>
    </div>
  )
}
