import { useMemo, useState } from 'react'
import { Loader } from '../../components/common/Loader'
import { HoverLink } from '../../components/common/HoverLink'
import { Button } from '../../components/common/Button'
import { ModalFormulario } from '../../components/panel/ModalFormulario'
import { IconoBuscar } from '../../components/panel/IconoBuscar'
import { useBarberiasSuperadmin, useCrearBarberia, slugDisponible } from './hooks/useBarberiasSuperadmin'
import { usePlanesSuperadmin } from './hooks/usePlanesSuperadmin'
import {
  ESTADO_ACTIVO,
  ESTADO_INACTIVO,
  ESTADO_SUSPENDIDO_PAGO,
  ESTADO_PENDIENTE_ACTIVACION,
} from '../../utils/estados'
import { proximoPago, diasHastaProximoPago } from '../../utils/facturacion'
import { generarSlug, esSlugReservado } from '../../utils/slug'

const BARBERIA_VACIA = { nombre: '', slug: '', plan_id: '' }

// Con cuántos días de anticipación avisar — bastante margen para escribirle
// al dueño antes de que la barbería quede suspendida por falta de pago.
const VENTANA_AVISO_DIAS = 7

// Pastilla con fondo (no solo texto de color, como antes) — con 2 barberías
// se leía igual, pero apenas la lista crece a un vistazo rápido un color de
// fondo se distingue mucho más rápido que un texto que hay que leer entero.
const ESTILO_ESTADO = {
  [ESTADO_ACTIVO]: 'bg-verde-barberia/10 text-verde-barberia',
  [ESTADO_INACTIVO]: 'bg-gris-calido-100 text-gris-calido-500',
  [ESTADO_SUSPENDIDO_PAGO]: 'bg-red-50 text-red-700',
  [ESTADO_PENDIENTE_ACTIVACION]: 'bg-cobre/10 text-cobre-texto',
}

// Versión corta de `NOMBRE_ESTADO` solo para la pastilla — en una columna
// angosta, "Suspendido por pago"/"Pendiente de activación" se cortan a dos
// líneas dentro de la forma ovalada y quedan apretados. El nombre completo
// se sigue viendo tal cual en la página de auditoría de cada barbería.
const NOMBRE_ESTADO_CORTO = {
  [ESTADO_ACTIVO]: 'Activo',
  [ESTADO_INACTIVO]: 'Inactivo',
  [ESTADO_SUSPENDIDO_PAGO]: 'Suspendido',
  [ESTADO_PENDIENTE_ACTIVACION]: 'Pendiente',
}

const FILTROS_ESTADO = [
  { id: 'todas', etiqueta: 'Todas' },
  { id: ESTADO_ACTIVO, etiqueta: 'Activas' },
  { id: ESTADO_PENDIENTE_ACTIVACION, etiqueta: 'Pendientes' },
  { id: ESTADO_SUSPENDIDO_PAGO, etiqueta: 'Suspendidas' },
  { id: ESTADO_INACTIVO, etiqueta: 'Inactivas' },
]

function textoDiasHasta(dias) {
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'mañana'
  return `en ${dias} días`
}

function formatoFechaCorta(fecha) {
  return fecha.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

function PildoraEstado({ estadoId }) {
  return (
    <span
      className={`versalitas inline-flex w-fit items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] ${ESTILO_ESTADO[estadoId]}`}
    >
      {NOMBRE_ESTADO_CORTO[estadoId]}
    </span>
  )
}

// Un número + su etiqueta — da una lectura de la plataforma completa de un
// vistazo (cuántas activas, cuántas pendientes de revisar) sin tener que
// contar filas a mano apenas la lista deja de ser 2 o 3 barberías.
function Estadistica({ etiqueta, valor, activa, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-[6.5rem] flex-col items-start gap-1 rounded-lg border px-4 py-3 text-left transition-colors ${
        activa ? 'border-cobre bg-cobre/5' : 'border-gris-calido-200 hover:border-cobre/40'
      }`}
    >
      <span className="numeros-tabulares text-xl font-medium text-negro-barbero">{valor}</span>
      <span className="versalitas text-[10px] text-gris-calido-500">{etiqueta}</span>
    </button>
  )
}

// Fila como grilla de columnas explícitas en desktop (con su propio
// encabezado, como una tabla de verdad) y apiladas en mobile — antes cada
// fila era un `flex-wrap` suelto sin ninguna columna real, así que plan,
// estado y la fecha de pago no quedaban alineados entre una barbería y la
// siguiente, y con muchas filas se perdía la lectura vertical rápida.
// La última columna (acciones) tiene que ser un ancho FIJO, no `auto`: con
// `auto`, su tamaño depende de si esa celda tiene contenido o no — vacía en
// el encabezado, con el texto real de "Ver auditoría →" en cada fila — así
// que la columna elástica del nombre terminaba absorbiendo esa diferencia y
// todo el resto de las columnas quedaba corrido entre el encabezado y las
// filas (confirmado midiendo posiciones reales con Playwright, no a ojo).
const COLUMNAS_GRID = 'grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-[1fr_7rem_9rem_8rem_7rem] md:items-center'

function FilaBarberia({ barberia }) {
  const proximo =
    barberia.estado_id === ESTADO_ACTIVO && barberia.fecha_activacion
      ? proximoPago(barberia.fecha_activacion)
      : null

  return (
    <div className={`${COLUMNAS_GRID} border-b border-gris-calido-200 py-4`}>
      <div className="col-span-2 min-w-0 md:col-span-1">
        <span className="block truncate font-medium text-negro-barbero">{barberia.nombre}</span>
        <span className="versalitas block truncate text-xs text-gris-calido-500">
          bookingbarber.cl/{barberia.slug}
        </span>
      </div>
      <span className="truncate text-sm text-gris-calido-700">{barberia.planes?.nombre ?? '—'}</span>
      <PildoraEstado estadoId={barberia.estado_id} />
      <span className="numeros-tabulares text-xs text-gris-calido-500">
        {proximo ? formatoFechaCorta(proximo) : '—'}
      </span>
      <HoverLink
        href={`/admin/barberias/${barberia.id}`}
        className="col-span-2 justify-self-start text-sm font-medium md:col-span-1 md:justify-self-end"
      >
        Ver auditoría →
      </HoverLink>
    </div>
  )
}

export function PanelSuperadminBarberias() {
  const { data: barberias, isLoading, isError } = useBarberiasSuperadmin()
  const { data: planes } = usePlanesSuperadmin()
  const crearBarberia = useCrearBarberia()

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [modalNuevaAbierto, setModalNuevaAbierto] = useState(false)

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

  function cerrarModalNueva() {
    setModalNuevaAbierto(false)
    setNueva(BARBERIA_VACIA)
    setSlugEditadoManualmente(false)
    setEstadoSlug(null)
    setErrorEnvio(null)
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
      cerrarModalNueva()
    } catch {
      setErrorEnvio('No pudimos crear la barbería. Intenta de nuevo.')
    }
  }

  const proximasAPagar = (barberias ?? [])
    .filter((b) => b.estado_id === ESTADO_ACTIVO && b.fecha_activacion)
    .map((b) => ({ ...b, dias: diasHastaProximoPago(b.fecha_activacion) }))
    .filter((b) => b.dias <= VENTANA_AVISO_DIAS)
    .sort((a, b) => a.dias - b.dias)

  const conteos = useMemo(() => {
    const base = {
      total: barberias?.length ?? 0,
      [ESTADO_ACTIVO]: 0,
      [ESTADO_PENDIENTE_ACTIVACION]: 0,
      [ESTADO_SUSPENDIDO_PAGO]: 0,
      [ESTADO_INACTIVO]: 0,
    }
    for (const b of barberias ?? []) base[b.estado_id] = (base[b.estado_id] ?? 0) + 1
    return base
  }, [barberias])

  const barberiasFiltradas = useMemo(() => {
    if (!barberias) return []
    const termino = busqueda.trim().toLowerCase()
    return barberias.filter((b) => {
      if (filtroEstado !== 'todas' && b.estado_id !== filtroEstado) return false
      if (termino && !b.nombre.toLowerCase().includes(termino) && !b.slug.toLowerCase().includes(termino)) {
        return false
      }
      return true
    })
  }, [barberias, busqueda, filtroEstado])

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
            Barberías
          </h1>
          <p className="mt-2 max-w-lg text-sm text-gris-calido-700">
            Todas las barberías registradas en la plataforma
            {barberias ? ` — ${barberias.length}` : ''}.
          </p>
        </div>
        <Button as="button" type="button" onClick={() => setModalNuevaAbierto(true)} className="w-fit">
          + Nueva barbería
        </Button>
      </div>

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

      {barberias && barberias.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Estadistica etiqueta="Total" valor={conteos.total} activa={filtroEstado === 'todas'} onClick={() => setFiltroEstado('todas')} />
          <Estadistica
            etiqueta="Activas"
            valor={conteos[ESTADO_ACTIVO]}
            activa={filtroEstado === ESTADO_ACTIVO}
            onClick={() => setFiltroEstado(ESTADO_ACTIVO)}
          />
          <Estadistica
            etiqueta="Pendientes"
            valor={conteos[ESTADO_PENDIENTE_ACTIVACION]}
            activa={filtroEstado === ESTADO_PENDIENTE_ACTIVACION}
            onClick={() => setFiltroEstado(ESTADO_PENDIENTE_ACTIVACION)}
          />
          <Estadistica
            etiqueta="Suspendidas"
            valor={conteos[ESTADO_SUSPENDIDO_PAGO]}
            activa={filtroEstado === ESTADO_SUSPENDIDO_PAGO}
            onClick={() => setFiltroEstado(ESTADO_SUSPENDIDO_PAGO)}
          />
          <Estadistica
            etiqueta="Inactivas"
            valor={conteos[ESTADO_INACTIVO]}
            activa={filtroEstado === ESTADO_INACTIVO}
            onClick={() => setFiltroEstado(ESTADO_INACTIVO)}
          />
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
            Aún no hay barberías registradas. Crea la primera con el botón de arriba.
          </p>
        )}

        {barberias && barberias.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <label className="relative flex min-w-[14rem] flex-1 items-center">
                <IconoBuscar className="pointer-events-none absolute left-0 h-4 w-4 text-gris-calido-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o slug…"
                  className="min-h-11 w-full border-b border-gris-calido-200 bg-transparent py-2 pl-6 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {FILTROS_ESTADO.map((filtro) => (
                  <button
                    key={filtro.id}
                    type="button"
                    onClick={() => setFiltroEstado(filtro.id)}
                    className={`versalitas rounded-full px-3 py-1.5 text-[10px] transition-colors ${
                      filtroEstado === filtro.id
                        ? 'bg-cobre text-hueso'
                        : 'bg-gris-calido-100 text-gris-calido-600 hover:bg-cobre/10'
                    }`}
                  >
                    {filtro.etiqueta}
                  </button>
                ))}
              </div>
            </div>

            {barberiasFiltradas.length === 0 ? (
              <p className="py-10 text-center text-sm text-gris-calido-500">
                Ninguna barbería coincide con esa búsqueda o filtro.
              </p>
            ) : (
              <div className="mt-4">
                <div className={`${COLUMNAS_GRID} hidden border-b border-gris-calido-200 pb-2 pt-4 md:grid`}>
                  <span className="versalitas text-[10px] text-gris-calido-400">Nombre</span>
                  <span className="versalitas text-[10px] text-gris-calido-400">Plan</span>
                  <span className="versalitas text-[10px] text-gris-calido-400">Estado</span>
                  <span className="versalitas text-[10px] text-gris-calido-400">Próx. pago</span>
                  <span />
                </div>
                {barberiasFiltradas.map((barberia) => (
                  <FilaBarberia key={barberia.id} barberia={barberia} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ModalFormulario abierto={modalNuevaAbierto} titulo="Nueva barbería" onCerrar={cerrarModalNueva} ancho="lg">
        <form onSubmit={crear} className="flex flex-col gap-4">
          {/* Una sola columna, no `md:grid-cols-3` — ese breakpoint mira el
              ANCHO DE LA PANTALLA, no el del modal (que es angosto y fijo),
              así que en cualquier desktop normal se armaban 3 columnas
              apretadas ahí adentro y el select de "Plan" quedaba cortado
              contra su propia flechita. */}
          <div className="grid grid-cols-1 gap-4">
            <label className="flex flex-col gap-2">
              <span className="versalitas text-xs text-gris-calido-500">Nombre</span>
              <input
                type="text"
                name="nombre"
                autoFocus
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
          {errorEnvio && (
            <p role="alert" className="text-sm text-red-700">
              {errorEnvio}
            </p>
          )}
          <p className="max-w-md text-xs text-gris-calido-500">
            La barbería se crea en estado "Pendiente de activación". Actívala desde su página de
            auditoría cuando esté lista.
          </p>
        </form>
      </ModalFormulario>
    </div>
  )
}
