import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../../components/common/Loader'
import { Button } from '../../components/common/Button'
import { Interruptor } from '../../components/panel/Interruptor'
import { SelectorArchivo } from '../../components/common/SelectorArchivo'
import { archivoAImagenComprimida } from '../../utils/imagenes'
import { useBarberiaAdmin } from './hooks/useBarberiaAdmin'
import {
  useBarberosAdmin,
  useCrearBarbero,
  useActualizarBarbero,
  useEliminarBarbero,
  useEstablecerContrasenaBarbero,
  useActivarCatalogoPropio,
  useDesactivarCatalogoPropio,
} from './hooks/useBarberosAdmin'

const ESTADOS_PASSWORD = {
  guardando: 'Guardando…',
  guardado: 'Contraseña actualizada',
  error: 'No se pudo guardar',
}

// Control para cambiar la contraseña de un barbero ya existente — el dueño
// la escribe él mismo (no una generada al azar): tiene que poder ser algo
// que el barbero use de inmediato, sin depender de que alguien le dicte una
// cadena rara. Colapsado por defecto para no ensuciar la tarjeta.
function CambiarPassword({ onGuardar }) {
  const [abierto, setAbierto] = useState(false)
  const [password, setPassword] = useState('')
  const [estado, setEstado] = useState(null)

  useEffect(() => {
    if (estado !== 'guardado') return
    const temporizador = setTimeout(() => {
      setEstado(null)
      setAbierto(false)
    }, 1500)
    return () => clearTimeout(temporizador)
  }, [estado])

  async function guardar(evento) {
    evento.preventDefault()
    if (!password.trim()) return
    setEstado('guardando')
    try {
      await onGuardar(password.trim())
      setEstado('guardado')
      setPassword('')
    } catch {
      setEstado('error')
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="versalitas text-xs text-gris-calido-500 transition-colors hover:text-cobre-texto"
      >
        Cambiar contraseña
      </button>
    )
  }

  return (
    <form onSubmit={guardar} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Nueva contraseña"
        className="min-h-9 w-40 border-b border-gris-calido-200 bg-transparent py-1 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
      />
      <button
        type="submit"
        disabled={estado === 'guardando'}
        className="versalitas text-xs text-cobre-texto transition-colors hover:text-cobre disabled:opacity-50"
      >
        Guardar
      </button>
      <button
        type="button"
        onClick={() => {
          setAbierto(false)
          setPassword('')
        }}
        className="versalitas text-xs text-gris-calido-500 transition-colors hover:text-negro-barbero"
      >
        Cancelar
      </button>
      {estado && (
        <span className={`versalitas text-xs ${estado === 'error' ? 'text-red-700' : 'text-verde-barberia'}`}>
          {ESTADOS_PASSWORD[estado]}
        </span>
      )}
    </form>
  )
}

// Foto + especialidad de cada barbero se muestran tal cual en la página
// pública, en la sección "Nuestro equipo" (ver VistaBarberia.jsx) — por eso
// viven acá, junto al resto de los datos del barbero, y no en Personalización.
function TarjetaBarbero({
  barbero,
  onCambiar,
  onCambiarCatalogoPropio,
  cambiandoCatalogo,
  onEliminar,
  eliminando,
  onCambiarPassword,
}) {
  const [subiendo, setSubiendo] = useState(false)

  async function subirFoto(evento) {
    const archivo = evento.target.files?.[0]
    if (!archivo) return
    setSubiendo(true)
    try {
      const dataUrl = await archivoAImagenComprimida(archivo, { maxAncho: 500, maxAlto: 500 })
      onCambiar({ foto_url: dataUrl })
    } finally {
      setSubiendo(false)
      evento.target.value = ''
    }
  }

  return (
    <div className="rounded-lg border border-gris-calido-200 bg-white p-5 transition-colors hover:border-gris-calido-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4 sm:w-56 sm:shrink-0">
          {barbero.foto_url ? (
            <img src={barbero.foto_url} alt={barbero.nombre} className="h-14 w-14 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gris-calido-200 text-lg text-gris-calido-400">
              {barbero.nombre.trim().charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex flex-col gap-1">
            <span className={`font-medium ${barbero.activo ? 'text-negro-barbero' : 'text-gris-calido-400 line-through'}`}>
              {barbero.nombre}
            </span>
            {barbero.usuario && (
              <span className="versalitas text-xs text-gris-calido-500">Usuario: {barbero.usuario}</span>
            )}
            <SelectorArchivo
              etiqueta={barbero.foto_url ? 'Cambiar foto' : 'Agregar foto'}
              cargando={subiendo}
              onChange={subirFoto}
              className="w-fit px-2.5 py-1.5"
            />
          </div>
        </div>

        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="versalitas text-xs text-gris-calido-500">Especialidad</span>
          <input
            type="text"
            value={barbero.especialidad ?? ''}
            onChange={(e) => onCambiar({ especialidad: e.target.value })}
            placeholder="En qué se especializa — ej: Cortes clásicos y degradados"
            className="min-h-11 min-w-0 border-b border-gris-calido-200 bg-transparent py-1 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>

        <div className="flex items-center gap-3 sm:shrink-0">
          <span className="versalitas text-xs text-gris-calido-500">{barbero.activo ? 'Activo' : 'Inactivo'}</span>
          <Interruptor
            activo={barbero.activo}
            etiqueta={`Activar/desactivar a ${barbero.nombre}`}
            onCambiar={(valor) => onCambiar({ activo: valor })}
          />
        </div>
      </div>

      {/* Fila propia, debajo de un separador — no comparte fila con lo de
          arriba porque es un permiso distinto (edición de servicios), no la
          identidad/estado del barbero. Esto decide si este barbero puede
          MODIFICAR algo en su pestaña "Servicios" o no — apagado, solo puede
          mirar el catálogo compartido (lo administra el dueño); prendido,
          tiene su propio catálogo editable, arrancando con una copia del
          compartido para no partir de cero. No es solo "qué lista ve" — es
          literalmente el permiso de edición. */}
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gris-calido-100 pt-4">
        <Interruptor
          activo={Boolean(barbero.usa_catalogo_propio)}
          etiqueta={`Servicios propios de ${barbero.nombre}`}
          disabled={cambiandoCatalogo}
          onCambiar={onCambiarCatalogoPropio}
        />
        <span className="versalitas text-xs text-gris-calido-500">
          {barbero.usa_catalogo_propio ? 'Tiene su propio catálogo' : 'Ve el catálogo compartido'}
        </span>
      </div>

      {/* Fila propia, aparte de la de arriba a propósito: si comparten fila,
          un texto de descripción más largo (o una pantalla más angosta que
          mobile pero no tan ancha como desktop) hace que estos dos controles
          terminen apretados contra el borde de la tarjeta o se corten mal —
          separarlos evita pelear por el mismo espacio sin importar el ancho. */}
      <div className="mt-3 flex flex-wrap items-center justify-end gap-4">
        <CambiarPassword onGuardar={onCambiarPassword} />
        <button
          type="button"
          onClick={onEliminar}
          disabled={eliminando}
          className="versalitas text-xs text-gris-calido-500 transition-colors hover:text-red-700 disabled:opacity-50"
        >
          {eliminando ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>
    </div>
  )
}

export function PanelBarberos() {
  const { perfil } = useAuth()
  const { data: barberia } = useBarberiaAdmin(perfil.barberia_id)
  const { data: barberos, isLoading, isError } = useBarberosAdmin(perfil.barberia_id)
  const crearBarbero = useCrearBarbero(perfil.barberia_id)
  const actualizarBarbero = useActualizarBarbero(perfil.barberia_id)
  const eliminarBarbero = useEliminarBarbero(perfil.barberia_id)
  const establecerContrasena = useEstablecerContrasenaBarbero(perfil.barberia_id)
  const activarCatalogoPropio = useActivarCatalogoPropio(perfil.barberia_id)
  const desactivarCatalogoPropio = useDesactivarCatalogoPropio(perfil.barberia_id)

  const [nombreNuevo, setNombreNuevo] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [errorEnvio, setErrorEnvio] = useState(null)
  const [cambiandoCatalogoId, setCambiandoCatalogoId] = useState(null)
  const [eliminandoId, setEliminandoId] = useState(null)
  const [usuarioCreado, setUsuarioCreado] = useState(null)

  async function alternarCatalogoPropio(barberoId, activar) {
    setCambiandoCatalogoId(barberoId)
    try {
      await (activar ? activarCatalogoPropio : desactivarCatalogoPropio).mutateAsync(barberoId)
    } finally {
      setCambiandoCatalogoId(null)
    }
  }

  async function eliminar(barbero) {
    const confirmado = window.confirm(
      `¿Eliminar a ${barbero.nombre}? También se borran su horario, sus excepciones puntuales y su catálogo propio si tenía uno. Esta acción no se puede deshacer.`
    )
    if (!confirmado) return
    setEliminandoId(barbero.id)
    try {
      await eliminarBarbero.mutateAsync(barbero.id)
    } finally {
      setEliminandoId(null)
    }
  }

  const maxBarberos = barberia?.planes?.max_barberos ?? null
  const totalBarberos = barberos?.length ?? 0
  const limiteAlcanzado = maxBarberos !== null && totalBarberos >= maxBarberos

  async function agregarBarbero(evento) {
    evento.preventDefault()
    if (!nombreNuevo.trim() || !passwordNueva.trim()) return
    setErrorEnvio(null)
    try {
      const nuevo = await crearBarbero.mutateAsync({ nombre: nombreNuevo.trim(), password: passwordNueva.trim() })
      setNombreNuevo('')
      setPasswordNueva('')
      if (nuevo.usuario) setUsuarioCreado({ nombre: nuevo.nombre, usuario: nuevo.usuario })
    } catch {
      setErrorEnvio('No pudimos agregar el barbero. Intenta de nuevo.')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
          Barberos
        </h1>
        {maxBarberos !== null && (
          <span className="numeros-tabulares text-sm text-gris-calido-500">
            {totalBarberos} / {maxBarberos}{' '}
            <span className="versalitas text-xs">según tu plan {barberia?.planes?.nombre}</span>
          </span>
        )}
      </div>
      <p className="mt-2 max-w-lg text-sm text-gris-calido-700">
        La foto y la especialidad de cada barbero aparecen en tu página pública, en la sección
        "Nuestro equipo". El usuario y la contraseña son con los que cada barbero entra a su propio
        panel.
      </p>

      <div className="mt-8">
        {isLoading && (
          <div className="py-12">
            <Loader label="Cargando barberos" />
          </div>
        )}

        {isError && (
          <p role="alert" className="py-8 text-sm text-red-700">
            No pudimos cargar tus barberos. Recarga la página o intenta más tarde.
          </p>
        )}

        {barberos && barberos.length === 0 && (
          <p className="py-8 text-sm text-gris-calido-700">
            Aún no tienes barberos cargados. Agrega el primero abajo.
          </p>
        )}

        {barberos && barberos.length > 0 && (
          <div className="flex flex-col gap-4">
            {barberos.map((barbero) => (
              <TarjetaBarbero
                key={barbero.id}
                barbero={barbero}
                onCambiar={(cambios) => actualizarBarbero.mutate({ id: barbero.id, cambios })}
                onCambiarCatalogoPropio={(valor) => alternarCatalogoPropio(barbero.id, valor)}
                cambiandoCatalogo={cambiandoCatalogoId === barbero.id}
                onEliminar={() => eliminar(barbero)}
                eliminando={eliminandoId === barbero.id}
                onCambiarPassword={(password) =>
                  establecerContrasena.mutateAsync({ barberoId: barbero.id, password })
                }
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <span className="versalitas text-xs text-cobre">— Nuevo barbero</span>
        <div className="mt-3 rounded-lg border border-dashed border-cobre/40 bg-cobre/5 p-5">
          {limiteAlcanzado ? (
            <p className="text-sm text-gris-calido-700">
              Alcanzaste el límite de <strong>{maxBarberos} barberos</strong> de tu plan{' '}
              <strong>{barberia?.planes?.nombre}</strong>. Para agregar más, actualiza tu plan.
            </p>
          ) : (
            <form onSubmit={agregarBarbero} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <label className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="versalitas text-xs text-gris-calido-500">Nombre del nuevo barbero</span>
                <input
                  type="text"
                  value={nombreNuevo}
                  onChange={(evento) => setNombreNuevo(evento.target.value)}
                  placeholder="Nombre y apellido"
                  className="min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
                />
              </label>
              <label className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-[12rem]">
                <span className="versalitas text-xs text-gris-calido-500">Contraseña</span>
                <input
                  type="text"
                  value={passwordNueva}
                  onChange={(evento) => setPasswordNueva(evento.target.value)}
                  placeholder="Con la que va a entrar"
                  className="min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
                />
              </label>
              <Button as="button" type="submit" disabled={crearBarbero.isPending} className="sm:w-auto">
                {crearBarbero.isPending ? 'Agregando…' : 'Agregar barbero'}
              </Button>
            </form>
          )}
          {errorEnvio && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {errorEnvio}
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {usuarioCreado && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-verde-barberia/40 bg-verde-barberia/5 p-4"
          >
            <p className="text-sm text-negro-barbero">
              {usuarioCreado.nombre} ya puede entrar a su panel con el usuario{' '}
              <strong className="numeros-tabulares font-semibold">{usuarioCreado.usuario}</strong> y la
              contraseña que le pusiste.
            </p>
            <button
              type="button"
              onClick={() => setUsuarioCreado(null)}
              className="versalitas shrink-0 text-xs text-gris-calido-500 transition-colors hover:text-negro-barbero"
            >
              Cerrar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
