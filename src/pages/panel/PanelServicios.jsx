import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../../components/common/Loader'
import { Button } from '../../components/common/Button'
import { useServiciosAdmin, useCrearServicio, useActualizarServicioAdmin } from './hooks/useServiciosAdmin'
import { useBarberosAdmin } from './hooks/useBarberosAdmin'
import { FilaServicioAdmin } from './components/FilaServicioAdmin'
import { ModalAsignarBarberos } from './components/ModalAsignarBarberos'
import { ModalFormulario } from '../../components/panel/ModalFormulario'
import { useIsMobile } from '../../hooks/useIsMobile'

const SERVICIO_VACIO = { nombre: '', duracion_minutos: '30', precio_clp: '', barbero_ids: [] }
const ETIQUETA_MOVIL = 'text-[13px] font-semibold uppercase tracking-[0.06em] text-gris-calido-500'
const CAMPO_MOVIL =
  'numeros-tabulares min-h-12 w-full appearance-none rounded-xl [&::-webkit-inner-spin-button]:appearance-none border border-gris-calido-200 bg-white px-3.5 text-base text-negro-barbero outline-none transition-colors focus:border-cobre'

export function PanelServicios() {
  const { perfil } = useAuth()
  const { data: servicios, isLoading, isError } = useServiciosAdmin(perfil.barberia_id)
  const { data: barberos } = useBarberosAdmin(perfil.barberia_id)
  const crearServicio = useCrearServicio(perfil.barberia_id)
  const actualizarServicio = useActualizarServicioAdmin(perfil.barberia_id)

  const [nuevo, setNuevo] = useState(SERVICIO_VACIO)
  const [errorEnvio, setErrorEnvio] = useState(null)
  const [modalBarberosAbierto, setModalBarberosAbierto] = useState(false)
  const [hojaNuevoAbierta, setHojaNuevoAbierta] = useState(false)
  const esMovil = useIsMobile()

  async function agregarServicio(evento) {
    evento.preventDefault()
    setErrorEnvio(null)
    const duracion = Number(nuevo.duracion_minutos)
    const precio = Number(nuevo.precio_clp)
    if (!nuevo.nombre.trim() || !Number.isFinite(duracion) || !Number.isFinite(precio)) {
      setErrorEnvio('Completa nombre, duración y precio.')
      return
    }
    try {
      await crearServicio.mutateAsync({
        nombre: nuevo.nombre.trim(),
        duracion_minutos: duracion,
        precio_clp: precio,
        precio_oferta: null,
        oferta_activa: false,
        barbero_ids: nuevo.barbero_ids,
      })
      setNuevo(SERVICIO_VACIO)
      setHojaNuevoAbierta(false)
    } catch {
      setErrorEnvio('No pudimos crear el servicio. Intenta de nuevo.')
    }
  }

  const textoBarberosNuevo =
    nuevo.barbero_ids.length === 0
      ? 'Todos'
      : (barberos ?? [])
          .filter((barbero) => nuevo.barbero_ids.includes(barbero.id))
          .map((barbero) => barbero.nombre)
          .join(', ')

  // En el celular: lista compacta de servicios (cada uno se despliega para
  // editarlo) y "Nuevo servicio" como botón principal que abre una hoja inferior.
  if (esMovil) {
    return (
      <div>
        <h1 className="font-display text-[28px] font-light leading-tight tracking-tight text-negro-barbero">
          Servicios
        </h1>
        <p className="mt-1 text-[15px] text-gris-calido-500">Toca uno para editarlo. Se guarda solo.</p>

        <button
          type="button"
          onClick={() => setHojaNuevoAbierta(true)}
          className="mt-5 min-h-12 w-full rounded-xl bg-cobre-oscuro text-base font-semibold text-hueso transition-[filter] active:brightness-110"
        >
          + Nuevo servicio
        </button>

        <div className="mt-6">
          {isLoading && (
            <div className="py-12">
              <Loader label="Cargando servicios" />
            </div>
          )}
          {isError && (
            <p role="alert" className="py-4 text-[15px] text-red-700">
              No pudimos cargar los servicios. Recarga la página o intenta más tarde.
            </p>
          )}
          {servicios && servicios.length === 0 && (
            <p className="py-4 text-[15px] text-gris-calido-700">Aún no tienes servicios. Crea el primero.</p>
          )}
          {servicios && servicios.length > 0 && (
            <div className="divide-y divide-gris-calido-100 overflow-hidden rounded-2xl border border-gris-calido-200 bg-white">
              {servicios.map((servicio) => (
                <FilaServicioAdmin
                  key={servicio.id}
                  servicio={servicio}
                  barberiaId={perfil.barberia_id}
                  barberos={barberos}
                  onGuardar={(cambios) => actualizarServicio.mutateAsync({ id: servicio.id, cambios })}
                />
              ))}
            </div>
          )}
        </div>

        <ModalFormulario abierto={hojaNuevoAbierta} titulo="Nuevo servicio" onCerrar={() => setHojaNuevoAbierta(false)}>
          <form onSubmit={agregarServicio} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={ETIQUETA_MOVIL}>Nombre</span>
              <input
                type="text"
                name="nombre"
                value={nuevo.nombre}
                onChange={(e) => setNuevo((n) => ({ ...n, nombre: e.target.value }))}
                placeholder="Ej: Corte + Barba"
                className={CAMPO_MOVIL}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className={ETIQUETA_MOVIL}>Duración (min)</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  name="duracion_minutos"
                  value={nuevo.duracion_minutos}
                  onChange={(e) => setNuevo((n) => ({ ...n, duracion_minutos: e.target.value }))}
                  className={CAMPO_MOVIL}
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className={ETIQUETA_MOVIL}>Precio</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  name="precio_clp"
                  value={nuevo.precio_clp}
                  onChange={(e) => setNuevo((n) => ({ ...n, precio_clp: e.target.value }))}
                  placeholder="12000"
                  className={CAMPO_MOVIL}
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => setModalBarberosAbierto(true)}
              className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-gris-calido-200 px-4 text-left"
            >
              <span className="shrink-0 text-base text-negro-barbero">Barberos</span>
              <span className="flex min-w-0 items-center gap-1 text-[15px] text-gris-calido-500">
                <span className="truncate">{textoBarberosNuevo}</span>
                <span aria-hidden="true" className="text-lg leading-none text-gris-calido-400">
                  ›
                </span>
              </span>
            </button>
            {errorEnvio && (
              <p role="alert" className="text-[15px] text-red-700">
                {errorEnvio}
              </p>
            )}
            <button
              type="submit"
              disabled={crearServicio.isPending}
              className="mt-2 min-h-12 w-full rounded-xl bg-cobre-oscuro text-base font-semibold text-hueso transition-[filter] active:brightness-110 disabled:opacity-60"
            >
              {crearServicio.isPending ? 'Creando…' : 'Crear servicio'}
            </button>
          </form>
        </ModalFormulario>

        <ModalAsignarBarberos
          abierto={modalBarberosAbierto}
          servicioNombre={nuevo.nombre.trim() || 'nuevo servicio'}
          barberos={barberos}
          barberoIds={nuevo.barbero_ids}
          onGuardar={(barbero_ids) => setNuevo((n) => ({ ...n, barbero_ids }))}
          onCerrar={() => setModalBarberosAbierto(false)}
        />
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
        Servicios
      </h1>
      <p className="mt-2 max-w-lg text-sm text-gris-calido-700">
        Crea y edita los servicios que tus clientes ven al reservar. Los cambios se guardan solos.
      </p>

      <div className="mt-8">
        {isLoading && (
          <div className="py-12">
            <Loader label="Cargando servicios" />
          </div>
        )}

        {isError && (
          <p role="alert" className="py-8 text-sm text-red-700">
            No pudimos cargar los servicios. Recarga la página o intenta más tarde.
          </p>
        )}

        {servicios && servicios.length === 0 && (
          <p className="py-8 text-sm text-gris-calido-700">
            Aún no tienes servicios. Crea el primero abajo.
          </p>
        )}

        {servicios && servicios.length > 0 && (
          <div className="flex flex-col gap-4">
            {servicios.map((servicio) => (
              <FilaServicioAdmin
                key={servicio.id}
                servicio={servicio}
                barberiaId={perfil.barberia_id}
                barberos={barberos}
                onGuardar={(cambios) => actualizarServicio.mutateAsync({ id: servicio.id, cambios })}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <span className="versalitas text-xs text-cobre">— Nuevo servicio</span>
        <form
          onSubmit={agregarServicio}
          className="mt-3 rounded-lg border border-dashed border-cobre/40 bg-cobre/5 p-5"
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-[1.4fr_8rem_10rem_auto] md:items-end">
            <label className="col-span-2 flex flex-col gap-1 md:col-span-1">
              <span className="versalitas text-xs text-gris-calido-500">Nombre</span>
              <input
                type="text"
                name="nombre"
                value={nuevo.nombre}
                onChange={(e) => setNuevo((n) => ({ ...n, nombre: e.target.value }))}
                placeholder="Ej: Corte + Barba"
                className="min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="versalitas text-xs text-gris-calido-500">Duración (min)</span>
              <input
                type="number"
                min="0"
                name="duracion_minutos"
                value={nuevo.duracion_minutos}
                onChange={(e) => setNuevo((n) => ({ ...n, duracion_minutos: e.target.value }))}
                className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="versalitas text-xs text-gris-calido-500">Precio</span>
              <input
                type="number"
                min="0"
                name="precio_clp"
                value={nuevo.precio_clp}
                onChange={(e) => setNuevo((n) => ({ ...n, precio_clp: e.target.value }))}
                placeholder="12000"
                className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
              />
            </label>
            <Button as="button" type="submit" disabled={crearServicio.isPending} className="h-fit">
              {crearServicio.isPending ? 'Creando…' : 'Crear servicio'}
            </Button>
          </div>
          <div className="mt-4">
            <span className="versalitas text-xs text-gris-calido-500">Barberos asignados</span>
            <p className="mt-1 text-sm text-negro-barbero">
              {nuevo.barbero_ids.length === 0
                ? 'Compartido — cualquier barbero'
                : (barberos ?? [])
                    .filter((barbero) => nuevo.barbero_ids.includes(barbero.id))
                    .map((barbero) => barbero.nombre)
                    .join(', ')}
            </p>
            <button
              type="button"
              onClick={() => setModalBarberosAbierto(true)}
              className="mt-2 rounded-md border border-gris-calido-200 px-4 py-2 text-sm text-negro-barbero transition-colors hover:border-cobre hover:text-cobre-texto"
            >
              Asignar servicio
            </button>
          </div>
          {errorEnvio && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {errorEnvio}
            </p>
          )}
        </form>
      </div>

      <ModalAsignarBarberos
        abierto={modalBarberosAbierto}
        servicioNombre={nuevo.nombre.trim() || 'nuevo servicio'}
        barberos={barberos}
        barberoIds={nuevo.barbero_ids}
        onGuardar={(barbero_ids) => setNuevo((n) => ({ ...n, barbero_ids }))}
        onCerrar={() => setModalBarberosAbierto(false)}
      />
    </div>
  )
}
