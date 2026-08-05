import { useOutletContext } from 'react-router-dom'
import { AsistenteReserva } from './components/AsistenteReserva'
import { Footer } from '../../components/layout/Footer'

export function PaginaBarberia() {
  const { barberia } = useOutletContext()
  const personalizacion = barberia.personalizacion ?? {}

  return (
    <div className="min-h-screen bg-hueso">
      <header className="border-b border-gris-calido-200 bg-negro-barbero px-5 py-8 text-center text-hueso">
        {barberia.logo_url && (
          <img
            src={barberia.logo_url}
            alt={barberia.nombre}
            className="mx-auto mb-3 h-16 w-16 rounded-full object-cover"
          />
        )}
        <h1 className="text-2xl font-extrabold tracking-tight">{barberia.nombre}</h1>
        {personalizacion.eslogan && (
          <p className="mt-1 text-sm text-gris-calido-200">{personalizacion.eslogan}</p>
        )}
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        {personalizacion.descripcion && (
          <p className="mb-6 text-center text-sm text-gris-calido-700">
            {personalizacion.descripcion}
          </p>
        )}

        <AsistenteReserva barberia={barberia} />
      </main>

      <Footer />
    </div>
  )
}
