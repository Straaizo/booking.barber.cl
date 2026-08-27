import { Header } from '../../components/layout/Header'
import { Footer } from '../../components/layout/Footer'
import { Hero } from './components/Hero'
import { LiveDemo } from './components/LiveDemo'
import { Benefits } from './components/Benefits'
import { TeamPanels } from './components/TeamPanels'
import { Novedades } from './components/Novedades'
import { Pricing } from './components/Pricing'
import { FounderSpots } from './components/FounderSpots'
import { FAQ } from './components/FAQ'

export function Home() {
  return (
    <div className="min-h-screen bg-hueso">
      {/* Header + Hero en un mismo flex-col de altura mínima 100vh: así el
          hero (flex-1) ocupa exactamente lo que sobra debajo del header, sin
          que entre los dos superen la pantalla y empujen la flecha de scroll
          fuera de vista — en vez de un cálculo de píxeles frágil (la altura
          del header cambia entre mobile/desktop). */}
      <div className="flex min-h-screen flex-col">
        <Header />
        <Hero />
      </div>
      {/* Las dudas de "confianza" (¿instalo algo? ¿qué pasa si dejo de
          pagar?) van apenas se empieza a bajar la página, antes incluso de
          la demo — la mayoría de quienes visitan la landing no la recorren
          entera, así que conviene resolverlas de inmediato en vez de
          dejarlas al final. */}
      <FAQ />
      <LiveDemo />
      <Benefits />
      <TeamPanels />
      <Novedades />
      <Pricing />
      <FounderSpots />
      <Footer showModelCredit />
    </div>
  )
}
