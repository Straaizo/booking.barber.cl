import { Header } from '../../components/layout/Header'
import { Footer } from '../../components/layout/Footer'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { LiveDemo } from './components/LiveDemo'
import { Benefits } from './components/Benefits'
import { Marquee } from './components/Marquee'
import { CalculadoraCitasPerdidas } from './components/CalculadoraCitasPerdidas'
import { PanelPreview } from './components/PanelPreview'
import { NotebookVsApp } from './components/NotebookVsApp'
import { Pricing } from './components/Pricing'
import { FounderSpots } from './components/FounderSpots'
import { FAQ } from './components/FAQ'

export function Home() {
  return (
    <div className="min-h-screen bg-hueso">
      <Header />
      <Hero />
      <HowItWorks />
      <LiveDemo />
      <Benefits />
      <Marquee />
      <CalculadoraCitasPerdidas />
      <PanelPreview />
      <NotebookVsApp />
      <Pricing />
      <FounderSpots />
      <FAQ />
      <Footer showModelCredit />
    </div>
  )
}
