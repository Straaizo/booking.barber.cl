import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../../components/common/Loader'
import { Button } from '../../components/common/Button'
import { Interruptor } from '../../components/panel/Interruptor'
import { CambiarPassword } from '../../components/panel/CambiarPassword'
import { SelectorArchivo } from '../../components/common/SelectorArchivo'
import { subirImagenBarberia, borrarImagenBarberia } from '../../services/storageImagenes'
import { useBarberiaAdmin } from './hooks/useBarberiaAdmin'
import {
  useBarberosAdmin,
  useCrearBarbero,
  useActualizarBarbero,
  useDarDeBajaBarbero,
  useEstablecerContrasenaBarbero,
  useActivarCatalogoPropio,
  useDesactivarCatalogoPropio,
} from './hooks/useBarberosAdmin'

// Mismo mínimo que valida la Edge Function `gestionar-usuario`.
const LARGO_MINIMO_PASSWORD = 8

// Foto + especialidad de cada barbero se muestran tal cual en la página
// pública, en la sección "Nuestro equipo" (ver VistaBarberia.jsx) — por eso
// viven acá, junto al resto de los datos del barbero, y no en Personalización.
function TarjetaBarbero({
  barbero,
  barberiaId,
  onCambiar,
  onCambiarCatalogoPropio,
  cambiandoCatalogo,
  onDarDeBaja,
  dandoDeBaja,
  onCambiarPassword,
}) {
  const [subiendo, setSubiendo] = useState(false)

  async function subirFoto(evento) {
    const archivo = evento.target.files?.[0]
    if (!archivo) return
    setSubiendo(true)
    try {
      const urlAnterior = barbero.foto_url
      const url = await subirImagenBarberia(archivo, { barberiaId, maxAncho: 500, maxAlto: 500 })
      onCambiar({ foto_url: url })
      if (urlAnterior) borrarImagenBarberia(urlAnterior)
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
            name="especialidad"
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
          onClick={onDarDeBaja}
          disabled={dandoDeBaja}
          className="versalitas text-xs text-gris-calido-500 transition-colors hover:text-red-700 disabled:opacity-50"
        >
          {dandoDeBaja ? 'Dando de baja…' : 'Dar de baja'}
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
  const darDeBajaBarbero = useDarDeBajaBarbero(perfil.barberia_id)
  const establecerContrasena = useEstablecerContrasenaBarbero(perfil.barberia_id)
  const activarCatalogoPropio = useActivarCatalogoPropio(perfil.barberia_id)
  const desactivarCatalogoPropio = useDesactivarCatalogoPropio(perfil.barberia_id)

  const [nombreNuevo, setNombreNuevo] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [errorEnvio, setErrorEnvio] = useState(null)
  const [cambiandoCatalogoId, setCambiandoCatalogoId] = useState(null)
  const [dandoDeBajaId, setDandoDeBajaId] = useState(null)
  const [usuarioCreado, setUsuarioCreado] = useState(null)
  const [errorActivo, setErrorActivo] = useState(null)

  // Reactivar a un barbero con el interruptor puede chocar con el límite de
  // barberos del plan (no solo crear uno nuevo) — antes esta mutación era
  // "mandar y olvidar", así que ese rechazo quedaba completamente en
  // silencio para quien lo intentaba.
  function cambiarBarbero(barbero, cambios) {
    setErrorActivo(null)
    actualizarBarbero.mutate(
      { id: barbero.id, cambios },
      {
        onError: () =>
          setErrorActivo(
            `No pudimos actualizar a ${barbero.nombre}. Si intentabas activarlo, puede que hayas llegado al límite de barberos de tu plan.`
          ),
      }
    )
  }

  async function alternarCatalogoPropio(barberoId, activar) {
    setCambiandoCatalogoId(barberoId)
    try {
      await (activar ? activarCatalogoPropio : desactivarCatalogoPropio).mutateAsync(barberoId)
    } finally {
      setCambiandoCatalogoId(null)
    }
  }

  async function darDeBaja(barbero) {
    const confirmado = window.confirm(
      `¿Dar de baja a ${barbero.nombre}? Ya no va a poder entrar a su panel ni aparecer en tu página pública, pero su historial de reservas y su horario quedan guardados por si lo reactivas más adelante.`
    )
    if (!confirmado) return
    setDandoDeBajaId(barbero.id)
    try {
      await darDeBajaBarbero.mutateAsync(barbero.id)
    } finally {
      setDandoDeBajaId(null)
    }
  }

  // Cuenta solo los ACTIVOS — el límite del plan es sobre barberos activos,
  // no sobre el total histórico. Antes daba lo mismo (un barbero "eliminado"
  // desaparecía del arreglo), pero desde que "dar de baja" los deja en la
  // lista como inactivos (ver useDarDeBajaBarbero), contar el total incluiría
  // para siempre a quienes ya no trabajan ahí.
  const maxBarberos = barberia?.planes?.max_barberos ?? null
  const totalBarberos = barberos?.filter((b) => b.activo).length ?? 0
  const limiteAlcanzado = maxBarberos !== null && totalBarberos >= maxBarberos

  async function agregarBarbero(evento) {
    evento.preventDefault()
    if (!nombreNuevo.trim() || !passwordNueva.trim()) return
    // Mismo mínimo que exige la Edge Function — se avisa acá antes de gastar
    // la llamada al servidor, nunca como el único lugar que lo exige.
    if (passwordNueva.trim().length < LARGO_MINIMO_PASSWORD) {
      setErrorEnvio(`La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres.`)
      return
    }
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
      {errorActivo && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {errorActivo}
        </p>
      )}

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
                barberiaId={perfil.barberia_id}
                onCambiar={(cambios) => cambiarBarbero(barbero, cambios)}
                onCambiarCatalogoPropio={(valor) => alternarCatalogoPropio(barbero.id, valor)}
                cambiandoCatalogo={cambiandoCatalogoId === barbero.id}
                onDarDeBaja={() => darDeBaja(barbero)}
                dandoDeBaja={dandoDeBajaId === barbero.id}
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
                  name="nombre_nuevo"
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
                  name="password_nueva"
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
