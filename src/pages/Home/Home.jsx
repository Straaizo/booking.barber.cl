import { Header } from '../../components/layout/Header'
import { Footer } from '../../components/layout/Footer'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { Benefits } from './components/Benefits'
import { Pricing } from './components/Pricing'

export function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-hueso">
      <Header />
      <Hero />
      <HowItWorks />
      <Benefits />
      <Pricing />
      <Footer showModelCredit />
    </div>
  )
}
