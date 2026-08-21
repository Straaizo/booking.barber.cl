import { useState } from 'react'
import { Loader } from '../../components/common/Loader'
import { HoverLink } from '../../components/common/HoverLink'
import { Button } from '../../components/common/Button'
import { useBarberiasSuperadmin, useCrearBarberia, slugDisponible } from './hooks/useBarberiasSuperadmin'
import { usePlanesSuperadmin } from './hooks/usePlanesSuperadmin'
import { NOMBRE_ESTADO, TONO_ESTADO, ESTADO_ACTIVO } from '../../utils/estados'
import { proximoPago, diasHastaProximoPago } from '../../utils/facturacion'
import { generarSlug, esSlugReservado } from '../../utils/slug'

const BARBERIA_VACIA = { nombre: '', slug: '', plan_id: '' }

// Con cuántos días de anticipación avisar — bastante margen para escribirle
// al dueño antes de que la barbería quede suspendida por falta de pago.
const VENTANA_AVISO_DIAS = 7

function textoDiasHasta(dias) {
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'mañana'
  return `en ${dias} días`
}

function formatoFechaCorta(fecha) {
  return fecha.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

export function PanelSuperadminBarberias() {
  const { data: barberias, isLoading, isError } = useBarberiasSuperadmin()
  const { data: planes } = usePlanesSuperadmin()
  const crearBarberia = useCrearBarberia()

  const [nueva, setNueva] = useState(BARBERIA_VACIA)
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false)
  const [estadoSlug, setEstadoSlug] = useState(null) // 'verificando' | 'disponible' | 'ocupado'
  const [errorEnvio, setErrorEnvio] = useState(null)

  function cambiarNombre(nombre) {
    setNueva((n) => ({ ...n, nombre, slug: slugEditadoManualmente ? n.slug : generarSlug(nombre) }))
    setEstadoSlug(null)
  }

  function cambiarSlug(slug) {
    setSlugEditadoManualmente(true)
    setNueva((n) => ({ ...n, slug: generarSlug(slug) }))
    setEstadoSlug(null)
  }

  async function verificarSlug() {
    if (!nueva.slug) return
    setEstadoSlug('verificando')
    const disponible = await slugDisponible(nueva.slug)
    setEstadoSlug(disponible ? 'disponible' : 'ocupado')
  }

  async function crear(evento) {
    evento.preventDefault()
    setErrorEnvio(null)
    if (!nueva.nombre.trim() || !nueva.slug || !nueva.plan_id) {
      setErrorEnvio('Completa nombre, slug y plan.')
      return
    }
    // Mismo mínimo que exige la base (`barberias_slug_formato`, 000_schema.sql)
    // — se valida acá también para no dejar que un nombre muy corto llegue
    // a mandarse y vuelva con un error crudo de la base.
    if (nueva.slug.length < 3) {
      setErrorEnvio('El slug necesita al menos 3 caracteres — prueba con un nombre un poco más largo.')
      return
    }
    if (esSlugReservado(nueva.slug)) {
      setErrorEnvio('Ese slug está reservado por la app — la página pública nunca sería alcanzable. Elige otro.')
      return
    }
    if (estadoSlug !== 'disponible') {
      const disponible = await slugDisponible(nueva.slug)
      setEstadoSlug(disponible ? 'disponible' : 'ocupado')
      if (!disponible) {
        setErrorEnvio('Ese slug ya está en uso, elige otro.')
        return
      }
    }
    try {
      await crearBarberia.mutateAsync({
        nombre: nueva.nombre.trim(),
        slug: nueva.slug,
        plan_id: Number(nueva.plan_id),
      })
      setNueva(BARBERIA_VACIA)
      setSlugEditadoManualmente(false)
      setEstadoSlug(null)
    } catch {
      setErrorEnvio('No pudimos crear la barbería. Intenta de nuevo.')
    }
  }

  const proximasAPagar = (barberias ?? [])
    .filter((b) => b.estado_id === ESTADO_ACTIVO && b.fecha_activacion)
    .map((b) => ({ ...b, dias: diasHastaProximoPago(b.fecha_activacion) }))
    .filter((b) => b.dias <= VENTANA_AVISO_DIAS)
    .sort((a, b) => a.dias - b.dias)

  return (
    <div>
      <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
        Barberías
      </h1>
      <p className="mt-2 max-w-lg text-sm text-gris-calido-700">
        Todas las barberías registradas en la plataforma.
      </p>

      {proximasAPagar.length > 0 && (
        <div className="mt-6 rounded-lg border border-cobre/30 bg-cobre/5 p-5">
          <span className="versalitas text-xs text-cobre">— Próximos a pagar</span>
          <div className="mt-3 flex flex-col gap-2">
            {proximasAPagar.map((barberia) => (
              <div key={barberia.id} className="flex flex-wrap items-center justify-between gap-3">
                <HoverLink href={`/admin/barberias/${barberia.id}`} className="text-sm">
                  {barberia.nombre}
                </HoverLink>
                <span className="numeros-tabulares versalitas text-xs text-gris-calido-600">
                  {textoDiasHasta(barberia.dias)} ({formatoFechaCorta(proximoPago(barberia.fecha_activacion))})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        {isLoading && (
          <div className="py-12">
            <Loader label="Cargando barberías" />
          </div>
        )}

        {isError && (
          <p role="alert" className="py-8 text-sm text-red-700">
            No pudimos cargar las barberías. Recarga la página o intenta más tarde.
          </p>
        )}

        {barberias && barberias.length === 0 && (
          <p className="py-8 text-sm text-gris-calido-700">
            Aún no hay barberías registradas. Crea la primera abajo.
          </p>
        )}

        {barberias && barberias.length > 0 && (
          <div className="border-t border-gris-calido-200">
            {barberias.map((barberia) => (
              <div
                key={barberia.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-gris-calido-200 py-4"
              >
                <div>
                  <span className="block font-medium text-negro-barbero">{barberia.nombre}</span>
                  <span className="versalitas block text-xs text-gris-calido-500">
                    booking.barber.cl/{barberia.slug} · {barberia.planes?.nombre}
                  </span>
                </div>
                <div className="flex items-center gap-5">
                  <span className={`versalitas text-xs ${TONO_ESTADO[barberia.estado_id]}`}>
                    {NOMBRE_ESTADO[barberia.estado_id]}
                  </span>
                  <HoverLink href={`/admin/barberias/${barberia.id}`} className="text-xs">
                    Ver auditoría →
                  </HoverLink>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 border-t border-cobre/25 pt-6">
        <span className="versalitas text-xs text-cobre">— Nueva barbería</span>
        <form onSubmit={crear} className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2">
              <span className="versalitas text-xs text-gris-calido-500">Nombre</span>
              <input
                type="text"
                name="nombre"
                value={nueva.nombre}
                onChange={(e) => cambiarNombre(e.target.value)}
                placeholder="Barbería El Zorro"
                className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="versalitas text-xs text-gris-calido-500">Slug (URL)</span>
              <input
                type="text"
                name="slug"
                value={nueva.slug}
                onChange={(e) => cambiarSlug(e.target.value)}
                onBlur={verificarSlug}
                placeholder="barberia-el-zorro"
                className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
              />
              {estadoSlug === 'verificando' && (
                <span className="text-xs text-gris-calido-500">Verificando…</span>
              )}
              {estadoSlug === 'disponible' && (
                <span className="text-xs text-verde-barberia">Disponible</span>
              )}
              {estadoSlug === 'ocupado' && (
                <span role="alert" className="text-xs text-red-700">
                  Ese slug ya está en uso
                </span>
              )}
            </label>

            <label className="flex flex-col gap-2">
              <span className="versalitas text-xs text-gris-calido-500">Plan</span>
              <select
                name="plan_id"
                value={nueva.plan_id}
                onChange={(e) => setNueva((n) => ({ ...n, plan_id: e.target.value }))}
                className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
              >
                <option value="">Selecciona un plan</option>
                {planes?.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Button as="button" type="submit" disabled={crearBarberia.isPending} className="w-fit">
            {crearBarberia.isPending ? 'Creando…' : 'Crear barbería'}
          </Button>
        </form>
        {errorEnvio && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {errorEnvio}
          </p>
        )}
        <p className="mt-3 max-w-md text-xs text-gris-calido-500">
          La barbería se crea en estado "Pendiente de activación". Actívala desde su página de
          auditoría cuando esté lista.
        </p>
      </div>
    </div>
  )
}
