import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from '../../components/common/Loader'
import { HoverLink } from '../../components/common/HoverLink'
import { Button } from '../../components/common/Button'
import { ModalFormulario } from '../../components/panel/ModalFormulario'
import { IconoLapiz } from '../../components/panel/IconoLapiz'
import {
  useBarberiaDetalle,
  useCambiarEstadoBarberia,
  useCambiarPlanBarberia,
} from './hooks/useBarberiasSuperadmin'
import { usePlanesSuperadmin } from './hooks/usePlanesSuperadmin'
import { useHistorialEstados } from './hooks/useHistorialEstados'
import {
  useBarberosAdmin,
  useCrearBarbero,
  useEstablecerContrasenaBarbero,
  useEliminarCuentaBarbero,
} from './hooks/useBarberosAdmin'
import {
  useCuentaDueno,
  useCrearCuentaDueno,
  useEstablecerPasswordDueno,
  useEliminarCuentaDueno,
  useCrearCuentaBarbero,
} from './hooks/useUsuariosSuperadmin'
import { NOMBRE_ESTADO, TONO_ESTADO, ESTADO_ACTIVO } from '../../utils/estados'
import { proximoPago, diasHastaProximoPago } from '../../utils/facturacion'

function formatoFechaCorta(fecha) {
  return fecha.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

// "hoy" / "mañana" / "en 5 días" — más legible de un vistazo que una fecha
// pelada, que es lo que de verdad importa acá (qué tan urgente es).
function textoDiasHasta(dias) {
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'mañana'
  return `en ${dias} días`
}

const CLASE_INPUT =
  'min-h-11 min-w-0 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre'

// Modal genérico para EDITAR una cuenta ya existente (dueño o barbero): solo
// hay dos cosas que tocar — la contraseña (el dueño siempre la escribe él
// mismo, nunca una generada al azar) y, como última acción, borrar la cuenta
// entera. Un solo componente para ambos casos porque el formulario es
// idéntico, cambia solo el título y a qué mutación apunta cada botón.
function ModalEditarCuenta({ abierto, onCerrar, titulo, usuario, onGuardarPassword, onEliminar, eliminando }) {
  const [password, setPassword] = useState('')
  const [estado, setEstado] = useState(null) // 'guardando' | 'guardado' | 'error'

  async function guardar(evento) {
    evento.preventDefault()
    if (!password.trim()) return
    setEstado('guardando')
    try {
      await onGuardarPassword(password.trim())
      setEstado('guardado')
      setPassword('')
    } catch {
      setEstado('error')
    }
  }

  return (
    <ModalFormulario abierto={abierto} onCerrar={onCerrar} titulo={titulo}>
      <p className="versalitas text-xs text-gris-calido-500">Usuario: {usuario}</p>
      <form onSubmit={guardar} className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="versalitas text-xs text-gris-calido-500">Nueva contraseña</span>
          <input
            type="text"
            name="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Con la que va a entrar"
            className={CLASE_INPUT}
          />
        </label>
        <Button as="button" type="submit" disabled={estado === 'guardando'} className="w-fit">
          {estado === 'guardando' ? 'Guardando…' : 'Guardar contraseña'}
        </Button>
        {estado === 'guardado' && <p className="text-sm text-verde-barberia">Contraseña actualizada.</p>}
        {estado === 'error' && (
          <p role="alert" className="text-sm text-red-700">
            No se pudo guardar.
          </p>
        )}
      </form>
      <div className="mt-5 border-t border-gris-calido-100 pt-4">
        <button
          type="button"
          onClick={onEliminar}
          disabled={eliminando}
          className="versalitas text-xs text-gris-calido-500 transition-colors hover:text-red-700 disabled:opacity-50"
        >
          {eliminando ? 'Eliminando…' : 'Eliminar cuenta'}
        </button>
      </div>
    </ModalFormulario>
  )
}

// Cuenta del dueño de esta barbería en particular. Sin cuenta todavía: un
// botón abre el modal de creación (nombre + contraseña). Con cuenta: un
// lápiz abre el modal de edición (cambiar contraseña / eliminar).
function SeccionCuentaDueno({ barberiaId }) {
  const { data: cuenta, isLoading } = useCuentaDueno(barberiaId)
  const crear = useCrearCuentaDueno(barberiaId)
  const establecerPassword = useEstablecerPasswordDueno(barberiaId)
  const eliminar = useEliminarCuentaDueno(barberiaId)

  const [modalCrearAbierto, setModalCrearAbierto] = useState(false)
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  async function crearCuenta(evento) {
    evento.preventDefault()
    if (!nombre.trim() || !password.trim()) return
    setError(null)
    try {
      await crear.mutateAsync({ nombre: nombre.trim(), password: password.trim() })
      setNombre('')
      setPassword('')
      setModalCrearAbierto(false)
    } catch {
      setError('No pudimos crear la cuenta. Intenta de nuevo.')
    }
  }

  async function eliminarCuenta() {
    const confirmado = window.confirm(
      '¿Eliminar la cuenta del dueño? Ya no va a poder entrar a su panel hasta que le crees una nueva.'
    )
    if (!confirmado) return
    await eliminar.mutateAsync()
    setModalEditarAbierto(false)
  }

  if (isLoading) {
    return (
      <div className="mt-3 py-6">
        <Loader label="Cargando cuenta" />
      </div>
    )
  }

  if (!cuenta) {
    return (
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-dashed border-cobre/40 bg-cobre/5 p-5">
        <p className="text-sm text-gris-calido-700">Esta barbería todavía no tiene cuenta de dueño.</p>
        <Button as="button" type="button" onClick={() => setModalCrearAbierto(true)} className="w-fit">
          + Crear cuenta
        </Button>

        <ModalFormulario
          abierto={modalCrearAbierto}
          onCerrar={() => setModalCrearAbierto(false)}
          titulo="Crear cuenta de dueño"
        >
          <form onSubmit={crearCuenta} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="versalitas text-xs text-gris-calido-500">Nombre del dueño</span>
              <input
                type="text"
                name="nombre"
                autoFocus
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre y apellido"
                className={CLASE_INPUT}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="versalitas text-xs text-gris-calido-500">Contraseña</span>
              <input
                type="text"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Con la que va a entrar"
                className={CLASE_INPUT}
              />
            </label>
            <Button as="button" type="submit" disabled={crear.isPending} className="w-fit">
              {crear.isPending ? 'Creando…' : 'Crear cuenta'}
            </Button>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
          </form>
        </ModalFormulario>
      </div>
    )
  }

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gris-calido-200 bg-white p-5">
      <div className="flex flex-col gap-1">
        <span className="font-medium text-negro-barbero">{cuenta.nombre}</span>
        <span className="versalitas text-xs text-gris-calido-500">Usuario: {cuenta.usuario}</span>
      </div>
      <button
        type="button"
        onClick={() => setModalEditarAbierto(true)}
        aria-label="Editar cuenta del dueño"
        className="text-gris-calido-500 transition-colors hover:text-cobre-texto"
      >
        <IconoLapiz className="h-5 w-5" />
      </button>

      <ModalEditarCuenta
        abierto={modalEditarAbierto}
        onCerrar={() => setModalEditarAbierto(false)}
        titulo="Cuenta del dueño"
        usuario={cuenta.usuario}
        onGuardarPassword={(password) => establecerPassword.mutateAsync({ password })}
        onEliminar={eliminarCuenta}
        eliminando={eliminar.isPending}
      />
    </div>
  )
}

// Una fila por barbero: sin cuenta, un botón de texto abre el modal de
// creación (solo pide contraseña — el nombre ya se sabe); con cuenta, un
// lápiz abre el mismo modal de edición que usa la cuenta del dueño.
function FilaBarberoUsuario({ barbero, barberiaId }) {
  const crearCuenta = useCrearCuentaBarbero(barberiaId)
  const establecerPassword = useEstablecerContrasenaBarbero(barberiaId)
  const eliminarCuenta = useEliminarCuentaBarbero(barberiaId)

  const [modalCrearAbierto, setModalCrearAbierto] = useState(false)
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  async function crear(evento) {
    evento.preventDefault()
    if (!password.trim()) return
    setError(null)
    try {
      await crearCuenta.mutateAsync({ barberoId: barbero.id, nombre: barbero.nombre, password: password.trim() })
      setPassword('')
      setModalCrearAbierto(false)
    } catch {
      setError('No pudimos crear la cuenta.')
    }
  }

  async function eliminar() {
    const confirmado = window.confirm(
      `¿Eliminar la cuenta de ${barbero.nombre}? Sigue existiendo como barbero, pero no va a poder entrar a su panel hasta que le crees una nueva.`
    )
    if (!confirmado) return
    await eliminarCuenta.mutateAsync(barbero.id)
    setModalEditarAbierto(false)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gris-calido-100 py-3 last:border-b-0">
      <span className="text-sm text-negro-barbero">{barbero.nombre}</span>
      {barbero.usuario ? (
        <div className="flex items-center gap-3">
          <span className="versalitas text-xs text-gris-calido-500">Usuario: {barbero.usuario}</span>
          <button
            type="button"
            onClick={() => setModalEditarAbierto(true)}
            aria-label={`Editar cuenta de ${barbero.nombre}`}
            className="text-gris-calido-500 transition-colors hover:text-cobre-texto"
          >
            <IconoLapiz className="h-4 w-4" />
          </button>

          <ModalEditarCuenta
            abierto={modalEditarAbierto}
            onCerrar={() => setModalEditarAbierto(false)}
            titulo={`Cuenta de ${barbero.nombre}`}
            usuario={barbero.usuario}
            onGuardarPassword={(password) => establecerPassword.mutateAsync({ barberoId: barbero.id, password })}
            onEliminar={eliminar}
            eliminando={eliminarCuenta.isPending}
          />
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setModalCrearAbierto(true)}
            className="versalitas text-xs text-cobre-texto transition-colors hover:text-cobre"
          >
            + Crear cuenta
          </button>

          <ModalFormulario
            abierto={modalCrearAbierto}
            onCerrar={() => setModalCrearAbierto(false)}
            titulo={`Crear cuenta para ${barbero.nombre}`}
          >
            <form onSubmit={crear} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="versalitas text-xs text-gris-calido-500">Contraseña</span>
                <input
                  type="text"
                  name="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Con la que va a entrar"
                  className={CLASE_INPUT}
                />
              </label>
              <Button as="button" type="submit" disabled={crearCuenta.isPending} className="w-fit">
                {crearCuenta.isPending ? 'Creando…' : 'Crear cuenta'}
              </Button>
              {error && (
                <p role="alert" className="text-sm text-red-700">
                  {error}
                </p>
              )}
            </form>
          </ModalFormulario>
        </>
      )}
    </div>
  )
}

// Antes de esto, un superadmin no tenía ninguna forma de cargar el PRIMER
// barbero de una barbería recién creada: esta sección solo sabía administrar
// la cuenta de barberos que YA existían como ficha de negocio. Reusa
// `useCrearBarbero` (la misma mutación del panel del dueño) porque hace las
// dos cosas de una: crea la ficha del barbero Y su cuenta de acceso.
function BotonNuevoBarbero({ barberiaId, limiteAlcanzado, maxBarberos, planNombre }) {
  const crearBarbero = useCrearBarbero(barberiaId)
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  async function crear(evento) {
    evento.preventDefault()
    if (!nombre.trim() || !password.trim()) return
    setError(null)
    try {
      await crearBarbero.mutateAsync({ nombre: nombre.trim(), password: password.trim() })
      setNombre('')
      setPassword('')
      setAbierto(false)
    } catch {
      setError('No pudimos agregar el barbero. Intenta de nuevo.')
    }
  }

  if (limiteAlcanzado) {
    return (
      <p className="mt-3 text-sm text-gris-calido-700">
        Esta barbería alcanzó el límite de <strong>{maxBarberos} barberos</strong> de su plan{' '}
        <strong>{planNombre}</strong>.
      </p>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="versalitas mt-3 text-xs text-cobre-texto transition-colors hover:text-cobre"
      >
        + Nuevo barbero
      </button>

      <ModalFormulario abierto={abierto} onCerrar={() => setAbierto(false)} titulo="Nuevo barbero">
        <form onSubmit={crear} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="versalitas text-xs text-gris-calido-500">Nombre del barbero</span>
            <input
              type="text"
              name="nombre"
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre y apellido"
              className={CLASE_INPUT}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="versalitas text-xs text-gris-calido-500">Contraseña</span>
            <input
              type="text"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Con la que va a entrar"
              className={CLASE_INPUT}
            />
          </label>
          <Button as="button" type="submit" disabled={crearBarbero.isPending} className="w-fit">
            {crearBarbero.isPending ? 'Agregando…' : 'Agregar barbero'}
          </Button>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
        </form>
      </ModalFormulario>
    </>
  )
}

function formatoFecha(iso) {
  return new Date(iso).toLocaleString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PanelSuperadminBarberiaDetalle() {
  const { id } = useParams()
  const { data: barberia, isLoading, isError } = useBarberiaDetalle(id)
  const { data: planes } = usePlanesSuperadmin()
  const { data: historial, isLoading: cargandoHistorial } = useHistorialEstados(id)
  const { data: barberos, isLoading: cargandoBarberos } = useBarberosAdmin(id)
  const cambiarEstado = useCambiarEstadoBarberia()
  const cambiarPlan = useCambiarPlanBarberia()

  const [estadoDestino, setEstadoDestino] = useState('')
  const [motivo, setMotivo] = useState('')
  const [errorEnvio, setErrorEnvio] = useState(null)
  const [errorPlan, setErrorPlan] = useState(null)

  // Bajar de plan con más barberos activos que el límite nuevo permite queda
  // bloqueado (por decisión de Enzo, no automático) — la función
  // `validar_limite_barberos` del lado de la base lo rechaza; acá solo se
  // traduce ese rechazo a un mensaje legible.
  async function cambiarPlanDe(planId) {
    setErrorPlan(null)
    try {
      await cambiarPlan.mutateAsync({ id, planId })
    } catch {
      setErrorPlan(
        'No se puede bajar a ese plan: esta barbería tiene más barberos activos de los que permite. Desactiva algunos primero.'
      )
    }
  }

  // Activar una barbería no tiene nada que explicar (es solo "ya está lista"
  // o "ya pagó") — el motivo obligatorio es para desactivarla o suspenderla,
  // donde sí importa dejar registrado el porqué.
  const activandoAhora = estadoDestino !== '' && Number(estadoDestino) === ESTADO_ACTIVO

  async function confirmarCambioEstado(evento) {
    evento.preventDefault()
    setErrorEnvio(null)
    if (!estadoDestino || (!activandoAhora && !motivo.trim())) {
      setErrorEnvio('Selecciona el nuevo estado e ingresa un motivo.')
      return
    }
    try {
      await cambiarEstado.mutateAsync({
        barberiaId: id,
        estadoNuevoId: Number(estadoDestino),
        motivo: activandoAhora ? 'Activación' : motivo.trim(),
      })
      setEstadoDestino('')
      setMotivo('')
    } catch {
      setErrorEnvio('No pudimos cambiar el estado. Intenta de nuevo.')
    }
  }

  if (isLoading) {
    return (
      <div className="py-12">
        <Loader label="Cargando barbería" />
      </div>
    )
  }

  if (isError || !barberia) {
    return (
      <p role="alert" className="py-8 text-sm text-red-700">
        No pudimos cargar esta barbería.
      </p>
    )
  }

  return (
    <div>
      <HoverLink href="/admin" className="text-xs text-gris-calido-500">
        ← Volver a barberías
      </HoverLink>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
          {barberia.nombre}
        </h1>
        <span className={`versalitas text-xs ${TONO_ESTADO[barberia.estado_id]}`}>
          {NOMBRE_ESTADO[barberia.estado_id]}
        </span>
      </div>
      <p className="versalitas mt-1 text-xs text-gris-calido-500">
        booking.barber.cl/barberias/{barberia.slug}
      </p>

      {barberia.estado_id === ESTADO_ACTIVO && barberia.fecha_activacion && (
        <p className="mt-3 text-sm text-gris-calido-700">
          Próximo pago{' '}
          <strong className="text-negro-barbero">
            {textoDiasHasta(diasHastaProximoPago(barberia.fecha_activacion))}
          </strong>{' '}
          ({formatoFechaCorta(proximoPago(barberia.fecha_activacion))})
        </p>
      )}

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <section>
          <span className="versalitas text-xs text-cobre">— Plan contratado</span>
          <div className="mt-3 flex items-center gap-4">
            <select
              name="plan_id"
              value={barberia.plan_id ?? ''}
              onChange={(e) => cambiarPlanDe(Number(e.target.value))}
              className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
            >
              {planes?.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.nombre}
                </option>
              ))}
            </select>
            {cambiarPlan.isPending && (
              <span className="versalitas text-xs text-gris-calido-500">Guardando…</span>
            )}
          </div>
          <p className="mt-2 text-xs text-gris-calido-500">
            Máximo {barberia.planes?.max_barberos} barberos con este plan.
          </p>
          {errorPlan && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {errorPlan}
            </p>
          )}
        </section>

        <section>
          <span className="versalitas text-xs text-cobre">— Cambiar estado</span>
          <form onSubmit={confirmarCambioEstado} className="mt-3 flex flex-col gap-4">
            <select
              name="estado_destino"
              value={estadoDestino}
              onChange={(e) => setEstadoDestino(e.target.value)}
              className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
            >
              <option value="">Selecciona el nuevo estado</option>
              {Object.entries(NOMBRE_ESTADO)
                .filter(([idEstado]) => Number(idEstado) !== barberia.estado_id)
                .map(([idEstado, nombre]) => (
                  <option key={idEstado} value={idEstado}>
                    {nombre}
                  </option>
                ))}
            </select>
            {!activandoAhora && (
              <label className="flex flex-col gap-2">
                <span className="versalitas text-xs text-gris-calido-500">Motivo (obligatorio)</span>
                <textarea
                  name="motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={2}
                  placeholder="Ej: atraso de pago de 2 meses"
                  className="border-b border-gris-calido-200 bg-transparent py-2 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
                />
              </label>
            )}
            <Button as="button" type="submit" disabled={cambiarEstado.isPending} className="w-fit">
              {cambiarEstado.isPending ? 'Guardando…' : 'Confirmar cambio'}
            </Button>
            {errorEnvio && (
              <p role="alert" className="text-sm text-red-700">
                {errorEnvio}
              </p>
            )}
          </form>
        </section>
      </div>

      <div className="mt-10 border-t border-gris-calido-200 pt-6">
        <span className="versalitas text-xs text-cobre">— Usuarios</span>
        <p className="mt-2 max-w-lg text-sm text-gris-calido-700">
          La cuenta del dueño entra al panel administrativo de esta barbería; cada barbero entra solo al
          suyo.
        </p>

        <div className="mt-5">
          <span className="versalitas text-xs text-gris-calido-500">Dueño</span>
          <SeccionCuentaDueno barberiaId={id} />
        </div>

        <div className="mt-6">
          <span className="versalitas text-xs text-gris-calido-500">Barberos</span>

          {cargandoBarberos && (
            <div className="py-8">
              <Loader label="Cargando barberos" />
            </div>
          )}

          {barberos && barberos.length === 0 && (
            <p className="mt-3 text-sm text-gris-calido-700">Esta barbería todavía no tiene barberos cargados.</p>
          )}

          {barberos && barberos.length > 0 && (
            <div className="mt-3 rounded-lg border border-gris-calido-200 bg-white px-5">
              {barberos.map((barbero) => (
                <FilaBarberoUsuario key={barbero.id} barbero={barbero} barberiaId={id} />
              ))}
            </div>
          )}

          {barberos && (
            <BotonNuevoBarbero
              barberiaId={id}
              limiteAlcanzado={
                barberia.planes?.max_barberos != null && barberos.length >= barberia.planes.max_barberos
              }
              maxBarberos={barberia.planes?.max_barberos}
              planNombre={barberia.planes?.nombre}
            />
          )}
        </div>
      </div>

      <div className="mt-10 border-t border-gris-calido-200 pt-6">
        <span className="versalitas text-xs text-cobre">— Historial de estados</span>

        {cargandoHistorial && (
          <div className="py-8">
            <Loader label="Cargando historial" />
          </div>
        )}

        {historial && historial.length === 0 && (
          <p className="py-6 text-sm text-gris-calido-700">Sin cambios de estado registrados.</p>
        )}

        {historial && historial.length > 0 && (
          <div className="mt-4">
            {historial.map((evento) => (
              <div key={evento.id} className="border-b border-gris-calido-200 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm text-negro-barbero">
                    {NOMBRE_ESTADO[evento.estado_anterior_id] ?? '—'} →{' '}
                    <strong>{NOMBRE_ESTADO[evento.estado_nuevo_id]}</strong>
                  </span>
                  <span className="numeros-tabulares text-xs text-gris-calido-500">
                    {formatoFecha(evento.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gris-calido-700">{evento.motivo}</p>
                <p className="versalitas mt-1 text-xs text-gris-calido-400">
                  por {evento.usuarios?.nombre ?? 'usuario eliminado'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
