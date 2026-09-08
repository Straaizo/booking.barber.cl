import { useState } from 'react'
import { BackButton } from '../../../components/common/BackButton'
import { FilaBarberoServicio } from './FilaBarberoServicio'
import { formatoFechaCorta } from '../../../utils/formatos'

// Reemplaza a los antiguos "Elige un barbero" + "Elige día y hora" (2 pasos
// separados, a ciegas: había que comprometerse con un barbero antes de saber
// si tenía hora). Acá se elige el día primero, y abajo aparece CADA barbero
// que hace este servicio con sus propias horas — se elige por horario, no al
// revés. Cada fila (`FilaBarberoServicio`) pide sus datos por su cuenta, así
// que se cargan todas en paralelo.
function proximosDias(cantidad) {
  const hoy = new Date()
  return Array.from({ length: cantidad }, (_, i) => {
    const fecha = new Date(hoy)
    fecha.setDate(hoy.getDate() + i)
    return fecha
  })
}

export function PasoBarberoHorario({ servicio, barberos, diasMaximosReserva, onSeleccionar, onVolver }) {
  const dias = proximosDias(diasMaximosReserva ?? 14)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(dias[0])

  return (
    <div>
      <BackButton onClick={onVolver} />
      <h2 className="font-display mb-4 mt-3 text-xl font-light tracking-tight text-[var(--pb-texto)] md:text-2xl">
        Elige día y barbero
      </h2>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {dias.map((dia) => {
          const activa = fechaISOIguales(dia, fechaSeleccionada)
          return (
            <button
              key={dia.toISOString()}
              type="button"
              onClick={() => setFechaSeleccionada(dia)}
              className={`versalitas min-h-11 shrink-0 rounded-full border px-4 text-xs capitalize transition-colors duration-200 ${
                activa
                  ? 'border-cobre bg-cobre text-hueso'
                  : 'border-[var(--pb-borde)] text-[var(--pb-texto-secundario)] hover:border-cobre/50'
              }`}
            >
              {formatoFechaCorta(dia)}
            </button>
          )
        })}
      </div>

      {barberos.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--pb-texto-secundario)]">
          Nadie ofrece este servicio por ahora.
        </p>
      ) : (
        <div className="mt-2">
          {barberos.map((barbero) => (
            <FilaBarberoServicio
              key={barbero.id}
              barbero={barbero}
              servicio={servicio}
              fecha={fechaSeleccionada}
              onSeleccionar={onSeleccionar}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function fechaISOIguales(a, b) {
  return a.toDateString() === b.toDateString()
}
