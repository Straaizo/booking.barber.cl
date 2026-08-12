// El input de archivo nativo se muestra distinto en cada navegador y no
// admite estilos propios ("Choose File / No file chosen") — se oculta y en
// su lugar se estiliza el <label> que lo envuelve como un botón secundario
// más, con la misma paleta que ya usa el resto del panel (ej: los botones
// "+ Galería de fotos" de Personalización). Clickear el label en cualquier
// parte abre el selector de archivos — comportamiento nativo del HTML, sin
// JS de por medio.
export function SelectorArchivo({ etiqueta, cargando, accept = 'image/*', multiple = false, onChange, className = '' }) {
  return (
    <label
      className={`versalitas inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border border-gris-calido-200 px-3 py-2 text-xs text-gris-calido-700 transition-colors hover:border-cobre hover:text-cobre-texto ${className}`}
    >
      {cargando ? 'Subiendo…' : etiqueta}
      <input type="file" accept={accept} multiple={multiple} onChange={onChange} className="hidden" />
    </label>
  )
}
