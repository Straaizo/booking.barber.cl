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
    <div className="flex items-center justify-between gap-4 border-b border-gris-calido-200 py-4 max-md:gap-3 max-md:px-4 max-md:last:border-b-0">
      <div className="max-md:min-w-0">
        <span className="font-display block text-lg font-light text-negro-barbero max-md:text-xl">{plan.nombre}</span>
        <span className="text-xs text-gris-calido-500 max-md:text-[14px]">Hasta {plan.max_barberos} barberos</span>
        {/* En el celular el aviso va bajo el nombre: al lado del precio no cabe */}
        {estado && (
          <span
            className={`versalitas mt-0.5 block text-[12px] md:hidden ${estado === 'error' ? 'text-red-700' : 'text-verde-barberia'}`}
          >
            {ESTADOS[estado]}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 max-md:shrink-0 max-md:gap-2">
        {estado && (
          <span className={`versalitas hidden text-xs md:inline ${estado === 'error' ? 'text-red-700' : 'text-verde-barberia'}`}>
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
          className="numeros-tabulares w-24 border-b border-gris-calido-200 bg-transparent py-1 text-right text-negro-barbero outline-none transition-colors focus:border-cobre max-md:min-h-11 max-md:w-28 max-md:rounded-xl max-md:border max-md:bg-hueso/60 max-md:px-3 max-md:[appearance:textfield] max-md:[&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-gris-calido-500 max-md:text-[14px]">/mes</span>
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
      <h1 className="font-display text-[28px] font-light leading-tight tracking-tight text-negro-barbero md:text-3xl md:leading-9">
        Precios
      </h1>
      <p className="mt-2 max-w-lg text-sm text-gris-calido-700 max-md:text-[15px] max-md:text-gris-calido-500">
        Solo el precio mensual de cada plan — el nombre y el máximo de barberos no se editan acá.
      </p>

      <div className="mt-8 max-md:mt-6">
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
          <div className="border-t border-gris-calido-200 max-md:overflow-hidden max-md:rounded-2xl max-md:border max-md:bg-white">
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
