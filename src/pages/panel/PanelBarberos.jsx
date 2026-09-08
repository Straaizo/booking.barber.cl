import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../../components/common/Loader'
import { Button } from '../../components/common/Button'
import { Interruptor } from '../../components/panel/Interruptor'
import { CambiarPassword } from '../../components/panel/CambiarPassword'
import { ModalConfirmacion } from '../../components/panel/ModalConfirmacion'
import { IconoPapelera } from '../../components/panel/IconoPapelera'
import { IconoLapiz } from '../../components/panel/IconoLapiz'
import { subirImagenBarberia, borrarImagenBarberia } from '../../services/storageImagenes'
import { useBarberiaAdmin } from './hooks/useBarberiaAdmin'
import {
  useBarberosAdmin,
  useCrearBarbero,
  useActualizarBarbero,
  useDarDeBajaBarbero,
  useEstablecerContrasenaBarbero,
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

  function quitarFoto() {
    if (barbero.foto_url) borrarImagenBarberia(barbero.foto_url)
    onCambiar({ foto_url: null })
  }

  return (
    <div className="rounded-lg border border-gris-calido-200 bg-white p-6 transition-colors hover:border-gris-calido-300">
      {/* Fila 1 — identidad: quién es y si está activo, nada más. La foto y
          el nombre son lo primero que se lee de una tarjeta, así que van
          solos en su propia línea, sin competir por espacio con el campo de
          especialidad (antes los 3 vivían apretados en una sola fila). */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* La foto vive DENTRO del mismo círculo del avatar — "Agregar
              foto" ya no es un botón aparte que ocupa su propio espacio: el
              círculo entero es el botón (el `<label>` cubre todo el
              círculo), con un ícono de cámara que aparece al pasar el mouse
              como pista de que es clickeable. Para QUITAR la foto (no
              reemplazarla) hay un botón redondo chico de basura superpuesto
              en la esquina — separado a propósito, para no confundir
              "cambiar" con "borrar sin reemplazo". */}
          <div className="group/foto relative h-14 w-14 shrink-0">
            <label
              className={`relative block h-14 w-14 cursor-pointer overflow-hidden rounded-full border border-gris-calido-200 ${subiendo ? 'opacity-60' : ''}`}
            >
              {barbero.foto_url ? (
                <img src={barbero.foto_url} alt={barbero.nombre} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-lg text-gris-calido-400">
                  {barbero.nombre.trim().charAt(0).toUpperCase()}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-negro-barbero/0 opacity-0 transition-all group-hover/foto:bg-negro-barbero/40 group-hover/foto:opacity-100">
                <IconoLapiz className="h-4 w-4 text-hueso" />
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={subiendo}
                onChange={subirFoto}
              />
            </label>
            {barbero.foto_url && (
              <button
                type="button"
                onClick={quitarFoto}
                aria-label={`Quitar foto de ${barbero.nombre}`}
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-gris-calido-200 bg-white text-gris-calido-500 transition-colors hover:border-red-700 hover:text-red-700"
              >
                <IconoPapelera className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className={`font-medium ${barbero.activo ? 'text-negro-barbero' : 'text-gris-calido-400 line-through'}`}>
              {barbero.nombre}
            </span>
            {barbero.usuario && (
              <span className="versalitas text-xs text-gris-calido-500">Usuario: {barbero.usuario}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="versalitas hidden text-xs text-gris-calido-500 sm:inline">
            {barbero.activo ? 'Activo' : 'Inactivo'}
          </span>
          <Interruptor
            activo={barbero.activo}
            etiqueta={`Activar/desactivar a ${barbero.nombre}`}
            onCambiar={(valor) => onCambiar({ activo: valor })}
          />
        </div>
      </div>

      {/* Fila 2 — especialidad, con su propio ancho completo en vez de
          compartir línea con la identidad de arriba (la foto ya se maneja
          directo sobre el avatar, ver más arriba). */}
      <div className="mt-4 border-t border-gris-calido-100 pt-4">
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
      </div>

      {/* Fila 3 — acciones sobre la cuenta. El catálogo propio por barbero
          se sacó de acá: ahora se asigna un barbero a cada servicio directo
          desde el panel de Servicios, no con un interruptor por barbero. */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-5">
        <CambiarPassword onGuardar={onCambiarPassword} />
        <button
          type="button"
          onClick={onDarDeBaja}
          disabled={dandoDeBaja}
          className="versalitas flex items-center gap-1.5 text-xs text-gris-calido-500 transition-colors hover:text-red-700 disabled:opacity-50"
        >
          <IconoPapelera className="h-3.5 w-3.5" />
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

  const [nombreNuevo, setNombreNuevo] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [errorEnvio, setErrorEnvio] = useState(null)
  const [dandoDeBajaId, setDandoDeBajaId] = useState(null)
  const [barberoDandoDeBaja, setBarberoDandoDeBaja] = useState(null)
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

  function pedirDarDeBaja(barbero) {
    setBarberoDandoDeBaja(barbero)
  }

  async function confirmarDarDeBaja() {
    const barbero = barberoDandoDeBaja
    setDandoDeBajaId(barbero.id)
    try {
      await darDeBajaBarbero.mutateAsync(barbero.id)
      setBarberoDandoDeBaja(null)
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
          <span className="inline-flex items-center gap-2 rounded-full border border-gris-calido-200 bg-hueso px-3 py-1.5">
            <span className="numeros-tabulares text-sm font-semibold text-negro-barbero">
              {totalBarberos}/{maxBarberos}
            </span>
            <span className="versalitas text-xs text-gris-calido-500">
              barberos · plan {barberia?.planes?.nombre}
            </span>
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
                onDarDeBaja={() => pedirDarDeBaja(barbero)}
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

      <ModalConfirmacion
        abierto={Boolean(barberoDandoDeBaja)}
        titulo="Dar de baja"
        mensaje={
          barberoDandoDeBaja
            ? `¿Dar de baja a ${barberoDandoDeBaja.nombre}? Ya no va a poder entrar a su panel ni aparecer en tu página pública, pero su historial de reservas y su horario quedan guardados por si lo reactivas más adelante.`
            : ''
        }
        textoConfirmar="Sí, dar de baja"
        variante="peligro"
        confirmando={Boolean(dandoDeBajaId)}
        onConfirmar={confirmarDarDeBaja}
        onCerrar={() => setBarberoDandoDeBaja(null)}
      />
    </div>
  )
}
