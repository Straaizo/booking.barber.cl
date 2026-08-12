import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../../components/common/Loader'
import { Button } from '../../components/common/Button'
import { Interruptor } from '../../components/panel/Interruptor'
import { ToastGuardado } from '../../components/common/ToastGuardado'
import { formatoCLP, ofertaVigente } from '../../utils/formatos'
import { useBarberosAdmin } from './hooks/useBarberosAdmin'
import {
  useServiciosDeBarberia,
  useCatalogoPropioBarbero,
  useCrearServicioPropio,
  useActualizarServicioPropio,
} from './hooks/useServiciosPanel'

// Sin "servicios propios" activado: el catálogo lo administra el dueño — el
// barbero lo ve tal cual se lo va a mostrar a sus clientes, pero no puede
// tocar nada acá (antes se le dejaba editar precio/oferta, lo que hacía que
// el interruptor de "servicios propios" no significara nada real — verlo sin
// poder modificarlo es justamente la otra mitad de esa distinción).
function CatalogoCompartidoSoloLectura({ barberiaId }) {
  const { data: servicios, isLoading, isError } = useServiciosDeBarberia(barberiaId)

  return (
    <div>
      <p className="mt-2 max-w-lg text-sm text-gris-calido-700">
        Estos son los servicios y precios de tu barbería — los administra tu dueño. Si necesitas
        tener tus propios servicios y precios, pídele que te los habilite desde la pestaña
        "Barberos" de su panel.
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
            Tu barbería aún no tiene servicios cargados. Pídele a tu administrador que los cree.
          </p>
        )}

        {servicios && servicios.length > 0 && (
          <div className="border-t border-gris-calido-200">
            {servicios.map((servicio) => {
              const enOferta = ofertaVigente(servicio)
              return (
                <div
                  key={servicio.id}
                  className="flex items-center justify-between gap-4 border-b border-gris-calido-200 py-4"
                >
                  <div>
                    <span className={`block font-medium ${servicio.activo ? 'text-negro-barbero' : 'text-gris-calido-400 line-through'}`}>
                      {servicio.nombre}
                    </span>
                    <span className="versalitas mt-0.5 block text-xs text-gris-calido-400">
                      {servicio.duracion_minutos} min · solo lectura
                    </span>
                  </div>
                  <div className="numeros-tabulares shrink-0 text-right">
                    {enOferta ? (
                      <>
                        <span className="block text-xs text-gris-calido-400 line-through">
                          {formatoCLP(servicio.precio_clp)}
                        </span>
                        <span className="block text-sm font-semibold text-cobre-texto">
                          {formatoCLP(servicio.precio_oferta)}
                        </span>
                      </>
                    ) : (
                      <span className="block text-sm font-semibold text-negro-barbero">
                        {formatoCLP(servicio.precio_clp)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const SERVICIO_VACIO = { nombre: '', duracion_minutos: '30', precio_clp: '' }

// Una fila con estado LOCAL (no manda nada hasta que se aprieta "Guardar
// cambios" en el padre) — a diferencia de FilaServicioAdmin (que usa la
// misma pantalla del dueño y guarda cada campo solo, al perder el foco), acá
// se pidió explícitamente que el barbero tenga que confirmar el cambio.
function FilaServicioPropioBorrador({ servicio, cambios, onCambio }) {
  const valor = (campo) => (cambios && campo in cambios ? cambios[campo] : servicio[campo])

  return (
    <div className="border-b border-gris-calido-200 py-5">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-[1.4fr_6rem_8rem_8rem]">
        <label className="col-span-2 flex flex-col gap-1 md:col-span-1">
          <span className="versalitas text-xs text-gris-calido-500">Nombre</span>
          <input
            type="text"
            value={valor('nombre')}
            onChange={(e) => onCambio(servicio.id, 'nombre', e.target.value)}
            className="min-h-11 border-b border-gris-calido-200 bg-transparent py-1 font-medium text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="versalitas text-xs text-gris-calido-500">Duración (min)</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={valor('duracion_minutos')}
            onChange={(e) => onCambio(servicio.id, 'duracion_minutos', e.target.value)}
            className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="versalitas text-xs text-gris-calido-500">Precio</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={valor('precio_clp')}
            onChange={(e) => onCambio(servicio.id, 'precio_clp', e.target.value)}
            className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="versalitas text-xs text-gris-calido-500">Precio oferta</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="—"
            value={valor('precio_oferta') ?? ''}
            onChange={(e) => onCambio(servicio.id, 'precio_oferta', e.target.value)}
            className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="flex items-center gap-3">
          <Interruptor
            activo={valor('oferta_activa')}
            etiqueta={`Oferta activa de ${servicio.nombre}`}
            onCambiar={(v) => onCambio(servicio.id, 'oferta_activa', v)}
          />
          <span className="versalitas text-xs text-gris-calido-500">Oferta activa</span>
        </div>

        <div className="flex items-center gap-3">
          <Interruptor
            activo={valor('activo')}
            etiqueta={`Publicado: ${servicio.nombre}`}
            onCambiar={(v) => onCambio(servicio.id, 'activo', v)}
          />
          <span className="versalitas text-xs text-gris-calido-500">
            {valor('activo') ? 'Publicado' : 'Oculto'}
          </span>
        </div>
      </div>
    </div>
  )
}

// Con "servicios propios" activado: catálogo completo del barbero (arrancó
// como copia del compartido al activarse, ver PanelBarberos.jsx) — puede
// crear, editar y publicar/ocultar los suyos, sin afectar el resto de la
// barbería. Los cambios quedan en un borrador local hasta apretar "Guardar
// cambios" — nada se manda a mitad de edición.
function CatalogoPropio({ barberiaId, barberoId }) {
  const { data: servicios, isLoading, isError } = useCatalogoPropioBarbero(barberiaId, barberoId)
  const crearServicio = useCrearServicioPropio(barberiaId, barberoId)
  const actualizarServicio = useActualizarServicioPropio(barberiaId, barberoId)

  const [cambiosPendientes, setCambiosPendientes] = useState({})
  const [estadoToast, setEstadoToast] = useState(null)
  const [nuevo, setNuevo] = useState(SERVICIO_VACIO)
  const [errorEnvio, setErrorEnvio] = useState(null)

  const hayCambiosPendientes = Object.keys(cambiosPendientes).length > 0

  useEffect(() => {
    if (estadoToast !== 'ok' && estadoToast !== 'error') return
    const temporizador = setTimeout(() => setEstadoToast(null), 2600)
    return () => clearTimeout(temporizador)
  }, [estadoToast])

  function onCambio(servicioId, campo, valor) {
    setCambiosPendientes((c) => ({ ...c, [servicioId]: { ...c[servicioId], [campo]: valor } }))
  }

  async function guardarCambios() {
    setEstadoToast('cargando')
    try {
      await Promise.all(
        Object.entries(cambiosPendientes).map(([id, cambios]) => {
          const limpio = { ...cambios }
          if ('duracion_minutos' in limpio) limpio.duracion_minutos = Number(limpio.duracion_minutos)
          if ('precio_clp' in limpio) limpio.precio_clp = Number(limpio.precio_clp)
          if ('precio_oferta' in limpio) {
            limpio.precio_oferta = limpio.precio_oferta === '' ? null : Number(limpio.precio_oferta)
          }
          return actualizarServicio.mutateAsync({ id, cambios: limpio })
        })
      )
      setCambiosPendientes({})
      setEstadoToast('ok')
    } catch {
      setEstadoToast('error')
    }
  }

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
      })
      setNuevo(SERVICIO_VACIO)
    } catch {
      setErrorEnvio('No pudimos crear el servicio. Intenta de nuevo.')
    }
  }

  return (
    <div>
      <p className="mt-2 max-w-lg text-sm text-gris-calido-700">
        Tienes tu propio catálogo de servicios — creá, editá o quitá lo que necesites, sin afectar
        el catálogo del resto de la barbería. Los cambios quedan pendientes hasta que apretás
        "Guardar cambios".
      </p>

      <div className="mt-8">
        {isLoading && (
          <div className="py-12">
            <Loader label="Cargando servicios" />
          </div>
        )}

        {isError && (
          <p role="alert" className="py-8 text-sm text-red-700">
            No pudimos cargar tus servicios. Recarga la página o intenta más tarde.
          </p>
        )}

        {servicios && servicios.length === 0 && (
          <p className="py-8 text-sm text-gris-calido-700">
            Aún no tienes servicios propios. Crea el primero abajo.
          </p>
        )}

        {servicios && servicios.length > 0 && (
          <>
            <div className="border-t border-gris-calido-200">
              {servicios.map((servicio) => (
                <FilaServicioPropioBorrador
                  key={servicio.id}
                  servicio={servicio}
                  cambios={cambiosPendientes[servicio.id]}
                  onCambio={onCambio}
                />
              ))}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <Button
                as="button"
                type="button"
                onClick={guardarCambios}
                disabled={!hayCambiosPendientes || estadoToast === 'cargando'}
                className="w-fit"
              >
                Guardar cambios
              </Button>
              {hayCambiosPendientes && (
                <span className="versalitas text-xs text-cobre-texto">Tenés cambios sin guardar</span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="mt-10 border-t border-cobre/25 pt-6">
        <span className="versalitas text-xs text-cobre">— Nuevo servicio</span>
        <form
          onSubmit={agregarServicio}
          className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-[1.4fr_6rem_8rem_auto] md:items-end"
        >
          <label className="col-span-2 flex flex-col gap-2 md:col-span-1">
            <span className="versalitas text-xs text-gris-calido-500">Nombre</span>
            <input
              type="text"
              value={nuevo.nombre}
              onChange={(e) => setNuevo((n) => ({ ...n, nombre: e.target.value }))}
              placeholder="Ej: Corte + Barba"
              className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="versalitas text-xs text-gris-calido-500">Duración (min)</span>
            <input
              type="number"
              min="0"
              value={nuevo.duracion_minutos}
              onChange={(e) => setNuevo((n) => ({ ...n, duracion_minutos: e.target.value }))}
              className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="versalitas text-xs text-gris-calido-500">Precio</span>
            <input
              type="number"
              min="0"
              value={nuevo.precio_clp}
              onChange={(e) => setNuevo((n) => ({ ...n, precio_clp: e.target.value }))}
              placeholder="12000"
              className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
            />
          </label>
          <Button as="button" type="submit" disabled={crearServicio.isPending} className="h-fit">
            {crearServicio.isPending ? 'Creando…' : 'Crear servicio'}
          </Button>
        </form>
        {errorEnvio && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {errorEnvio}
          </p>
        )}
      </div>

      <ToastGuardado estado={estadoToast} />
    </div>
  )
}

export function PanelBarberoServicios() {
  const { perfil } = useAuth()
  const { data: barberos, isLoading } = useBarberosAdmin(perfil.barberia_id)
  const barbero = barberos?.find((b) => b.id === perfil.barbero_id)

  return (
    <div>
      <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
        Mis servicios
      </h1>

      {isLoading && (
        <div className="py-12">
          <Loader label="Cargando" />
        </div>
      )}

      {barbero &&
        (barbero.usa_catalogo_propio ? (
          <CatalogoPropio barberiaId={perfil.barberia_id} barberoId={perfil.barbero_id} />
        ) : (
          <CatalogoCompartidoSoloLectura barberiaId={perfil.barberia_id} />
        ))}
    </div>
  )
}
