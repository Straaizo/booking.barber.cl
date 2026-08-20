import { Header } from '../../components/layout/Header'
import { Footer } from '../../components/layout/Footer'
import { Hero } from './components/Hero'
import { LiveDemo } from './components/LiveDemo'
import { Benefits } from './components/Benefits'
import { TeamPanels } from './components/TeamPanels'
import { NotebookVsApp } from './components/NotebookVsApp'
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
      <LiveDemo />
      <Benefits />
      <TeamPanels />
      <NotebookVsApp />
      <Pricing />
      <FounderSpots />
      <FAQ />
      <Footer showModelCredit />
    </div>
  )
}
