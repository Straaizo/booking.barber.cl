import { Link } from 'react-router-dom'

export function HoverLink({ href, children, className = '', tono = 'laton' }) {
  const colorSubrayado = tono === 'laton' ? 'bg-laton' : 'bg-cobre'
  // Rutas internas (empiezan con "/") navegan por React Router sin recargar
  // la página; anclas de hash ("#planes") y URLs externas siguen siendo <a>.
  const EsInterno = href.startsWith('/') ? Link : 'a'
  const propHref = href.startsWith('/') ? { to: href } : { href }

  return (
    <EsInterno
      {...propHref}
      className={`group relative inline-block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-laton ${className}`}
    >
      {children}
      <span
        className={`absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 ease-entrada group-hover:scale-x-100 group-focus-visible:scale-x-100 ${colorSubrayado}`}
      />
    </EsInterno>
  )
}
