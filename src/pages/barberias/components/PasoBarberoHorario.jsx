import { useState } from 'react'
import { BackButton } from '../../../components/common/BackButton'
import { FilaBarberoServicio } from './FilaBarberoServicio'
import { formatoFechaCorta } from '../../../utils/formatos'
import { hoyEnSantiago, horaMinutoEnSantiago } from '../../../utils/horaLocal'

// Reemplaza a los antiguos "Elige un barbero" + "Elige día y hora" (2 pasos
// separados, a ciegas: había que comprometerse con un barbero antes de saber
// si tenía hora). Acá se elige el día primero, y abajo aparece CADA barbero
// que hace este servicio con sus propias horas — se elige por horario, no al
// revés. Cada fila (`FilaBarberoServicio`) pide sus datos por su cuenta, así
// que se cargan todas en paralelo.
//
// Arranca de `hoyEnSantiago()` (no `new Date()`): el "hoy" del negocio es
// siempre el de Chile, sin importar el huso configurado en el celular de
// quien está reservando.
function proximosDias(cantidad, desde = 0) {
  const hoy = hoyEnSantiago()
  return Array.from({ length: cantidad }, (_, i) => {
    const fecha = new Date(hoy)
    fecha.setDate(hoy.getDate() + desde + i)
    return fecha
  })
}

// Pasada la hora de cierre de hoy (el cierre más tardío entre los barberos
// que atienden hoy), el día deja de ofrecerse. Si hoy nadie tiene horario
// semanal se deja como estaba: puede haber una excepción abierta.
function yaCerroHoy(barberos) {
  try {
    const diaSemana = hoyEnSantiago().getDay()
    const cierres = barberos
      .flatMap((b) => b.horarios_disponibles ?? [])
      .filter((h) => h.activo && h.dia_semana === diaSemana)
      .map((h) => {
        const [hora, minuto] = h.hora_fin.split(':').map(Number)
        return hora * 60 + minuto
      })
    if (cierres.length === 0) return false
    const { hora, minuto } = horaMinutoEnSantiago(new Date())
    return hora * 60 + minuto >= Math.max(...cierres)
  } catch {
    return false
  }
}

export function PasoBarberoHorario({ servicio, barberos, diasMaximosReserva, onSeleccionar, onVolver }) {
  // Sin hoy se corre un día la ventana, para seguir mostrando la misma
  // cantidad (el servidor cuenta los días desde este momento, no desde hoy 00:00).
  const dias = proximosDias(diasMaximosReserva ?? 14, yaCerroHoy(barberos) ? 1 : 0)
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
