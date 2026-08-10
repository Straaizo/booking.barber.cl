// Sabe renderizar tanto el placeholder actual (`slide.placeholder`, un solo
// archivo) como una foto real ya reemplazada (`slide.fuentes`, con variantes
// webp/jpg y mobile/desktop) — cuando se reemplacen los placeholders por
// fotografía real en `data/slides.js`, este componente no cambia.
export function ImagenCarrusel({ slide, prioritaria, esMovil, className }) {
  const objectPosition = esMovil ? slide.objectPositionMovil : slide.objectPosition

  const propsComunes = {
    alt: slide.alt,
    className,
    style: { objectPosition },
    loading: 'eager',
    // React 18 no reconoce `fetchPriority` en camelCase (recién en React 19);
    // en minúscula pasa directo como atributo HTML, que es lo que el
    // navegador necesita para priorizar la descarga igual.
    fetchpriority: prioritaria ? 'high' : 'auto',
    decoding: prioritaria ? 'sync' : 'async',
    draggable: false,
  }

  if (slide.fuentes) {
    const { webp, jpg, webpMovil, jpgMovil } = slide.fuentes
    return (
      <picture>
        <source srcSet={esMovil ? webpMovil ?? webp : webp} type="image/webp" />
        <img src={esMovil ? jpgMovil ?? jpg : jpg} {...propsComunes} />
      </picture>
    )
  }

  return <img src={slide.placeholder} {...propsComunes} />
}
