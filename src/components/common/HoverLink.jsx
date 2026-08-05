export function HoverLink({ href, children, className = '', tono = 'laton' }) {
  const colorSubrayado = tono === 'laton' ? 'bg-laton' : 'bg-cobre'

  return (
    <a
      href={href}
      className={`group relative inline-block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-laton ${className}`}
    >
      {children}
      <span
        className={`absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100 ${colorSubrayado}`}
      />
    </a>
  )
}
