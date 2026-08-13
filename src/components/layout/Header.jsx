import { HoverLink } from '../common/HoverLink'

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-6 md:px-10 md:py-8">
      <HoverLink
        href="/"
        className="font-display text-xl font-semibold italic tracking-tight text-negro-barbero"
      >
        booking<span className="text-cobre-texto">.</span>barber.cl
      </HoverLink>
      <HoverLink
        href="#planes"
        className="versalitas text-sm font-medium text-gris-calido-700"
      >
        Planes
      </HoverLink>
    </header>
  )
}
