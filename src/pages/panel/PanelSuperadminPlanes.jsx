import { useEffect, useState } from 'react'
import { Loader } from '../../components/common/Loader'
import { usePlanesSuperadmin, useActualizarPrecioPlan } from './hooks/usePlanesSuperadmin'

const ESTADOS = {
  guardando: 'Guardando…',
  guardado: 'Guardado',
  error: 'No se pudo guardar',
}

function FilaPrecio({ plan, onGuardar }) {
  const [valor, setValor] = useState(String(plan.precio_clp))
  const [estado, setEstado] = useState(null)

  useEffect(() => {
    if (estado !== 'guardado') return
    const temporizador = setTimeout(() => setEstado(null), 1800)
    return () => clearTimeout(temporizador)
  }, [estado])

  async function guardar() {
    const precio = Number(valor)
    if (!Number.isFinite(precio) || precio < 0 || precio === plan.precio_clp) return
    setEstado('guardando')
    try {
      await onGuardar(precio)
      setEstado('guardado')
    } catch {
      setEstado('error')
      setValor(String(plan.precio_clp))
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-gris-calido-200 py-4">
      <div>
        <span className="font-display block text-lg font-light text-negro-barbero">{plan.nombre}</span>
        <span className="text-xs text-gris-calido-500">Hasta {plan.max_barberos} barberos</span>
      </div>
      <div className="flex items-center gap-3">
        {estado && (
          <span className={`versalitas text-xs ${estado === 'error' ? 'text-red-700' : 'text-verde-barberia'}`}>
            {ESTADOS[estado]}
          </span>
        )}
        <span className="text-gris-calido-500">$</span>
        <input
          type="number"
          min="0"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onBlur={guardar}
          className="numeros-tabulares w-24 border-b border-gris-calido-200 bg-transparent py-1 text-right text-negro-barbero outline-none transition-colors focus:border-cobre"
        />
        <span className="text-xs text-gris-calido-500">/mes</span>
      </div>
    </div>
  )
}

// Solo precio: el pricing público de la home (Pricing.jsx) está hardcodeado
// (no lee esta tabla — no hay alta automatizada de barberías todavía), así
// que no tiene sentido ofrecer acá crear planes nuevos ni editar nombre o
// máximo de barberos — eso sí es una decisión de producto, no un número que
// cambie seguido. El precio de cada plan existente queda editable para
// referencia interna (a mano al conversar con una barbería nueva por
// WhatsApp) y porque sigue siendo el que se usa al asignarle un plan a una
// barbería en el panel de Barberías.
export function PanelSuperadminPlanes() {
  const { data: planes, isLoading, isError } = usePlanesSuperadmin()
  const actualizarPrecio = useActualizarPrecioPlan()

  return (
    <div>
      <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
        Precios
      </h1>
      <p className="mt-2 max-w-lg text-sm text-gris-calido-700">
        Solo el precio mensual de cada plan — el nombre y el máximo de barberos no se editan acá.
      </p>

      <div className="mt-8">
        {isLoading && (
          <div className="py-12">
            <Loader label="Cargando planes" />
          </div>
        )}

        {isError && (
          <p role="alert" className="py-8 text-sm text-red-700">
            No pudimos cargar los planes. Recarga la página o intenta más tarde.
          </p>
        )}

        {planes && planes.length > 0 && (
          <div className="border-t border-gris-calido-200">
            {planes.map((plan) => (
              <FilaPrecio
                key={plan.id}
                plan={plan}
                onGuardar={(precio_clp) => actualizarPrecio.mutateAsync({ id: plan.id, precio_clp })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
