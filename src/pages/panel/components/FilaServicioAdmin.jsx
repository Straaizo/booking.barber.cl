import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Interruptor } from '../../../components/panel/Interruptor'
import { SelectorArchivo } from '../../../components/common/SelectorArchivo'
import { ModalAsignarBarberos } from './ModalAsignarBarberos'
import { subirImagenBarberia, borrarImagenBarberia } from '../../../services/storageImagenes'
import { errorDeOferta } from '../../../utils/ofertas'
import { formatoCLP, ofertaVigente } from '../../../utils/formatos'
import { useIsMobile } from '../../../hooks/useIsMobile'

const ESTADOS = {
  guardando: 'Guardando…',
  guardado: 'Guardado',
  error: 'No se pudo guardar',
}

const ETIQUETA_MOVIL = 'text-[13px] font-semibold uppercase tracking-[0.06em] text-gris-calido-500'
const CAMPO_MOVIL =
  'numeros-tabulares min-h-12 w-full appearance-none rounded-xl [&::-webkit-inner-spin-button]:appearance-none border border-gris-calido-200 bg-white px-3.5 text-base text-negro-barbero outline-none transition-colors focus:border-cobre'

function TextoEstadoMovil({ estado }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={estado}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role={estado === 'error' ? 'alert' : undefined}
        className={`text-[13px] font-medium ${estado === 'error' ? 'text-red-700' : 'text-verde-barberia'}`}
      >
        {ESTADOS[estado]}
      </motion.span>
    </AnimatePresence>
  )
}

export function FilaServicioAdmin({ servicio, barberiaId, barberos, onGuardar }) {
  const [campos, setCampos] = useState({
    nombre: servicio.nombre,
    descripcion: servicio.descripcion ?? '',
    duracion_minutos: String(servicio.duracion_minutos),
    precio_clp: String(servicio.precio_clp ?? ''),
    precio_oferta: String(servicio.precio_oferta ?? ''),
  })
  const [estado, setEstado] = useState(null)
  const [errorOferta, setErrorOferta] = useState(null)
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [modalBarberosAbierto, setModalBarberosAbierto] = useState(false)
  const [desplegado, setDesplegado] = useState(false)
  const esMovil = useIsMobile()

  useEffect(() => {
    setCampos({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion ?? '',
      duracion_minutos: String(servicio.duracion_minutos),
      precio_clp: String(servicio.precio_clp ?? ''),
      precio_oferta: String(servicio.precio_oferta ?? ''),
    })
  }, [servicio])

  useEffect(() => {
    if (estado !== 'guardado') return
    const temporizador = setTimeout(() => setEstado(null), 1800)
    return () => clearTimeout(temporizador)
  }, [estado])

  async function guardar(cambios) {
    setEstado('guardando')
    try {
      await onGuardar(cambios)
      setEstado('guardado')
    } catch {
      setEstado('error')
    }
  }

  function commitTexto() {
    if (campos.nombre.trim() && campos.nombre !== servicio.nombre) {
      guardar({ nombre: campos.nombre.trim() })
    }
  }

  function commitDescripcion() {
    const limpia = campos.descripcion.trim()
    if (limpia !== (servicio.descripcion ?? '')) {
      guardar({ descripcion: limpia })
    }
  }

  async function cambiarImagen(evento) {
    const archivo = evento.target.files?.[0]
    if (!archivo) return
    setSubiendoImagen(true)
    try {
      const urlAnterior = servicio.imagen_url
      const url = await subirImagenBarberia(archivo, { barberiaId, maxAncho: 800, maxAlto: 600 })
      await guardar({ imagen_url: url })
      if (urlAnterior) borrarImagenBarberia(urlAnterior)
    } finally {
      setSubiendoImagen(false)
      evento.target.value = ''
    }
  }

  function commitNumero(campo, valorCrudo, valorOriginal) {
    const valor = Number(valorCrudo)
    if (!Number.isFinite(valor) || valor === valorOriginal) return
    guardar({ [campo]: valor })
  }

  function alternarOferta(valor) {
    const error = errorDeOferta(valor, servicio.precio_oferta, servicio.precio_clp)
    if (error) {
      setErrorOferta(error)
      return
    }
    setErrorOferta(null)
    guardar({ oferta_activa: valor })
  }

  function commitPrecioOferta() {
    const valorCrudo = campos.precio_oferta
    if (valorCrudo === '') {
      if (servicio.precio_oferta !== null) guardar({ precio_oferta: null })
      return
    }
    const valor = Number(valorCrudo)
    if (!Number.isFinite(valor) || valor === servicio.precio_oferta) return
    const error = errorDeOferta(servicio.oferta_activa, valor, servicio.precio_clp)
    if (error) {
      setErrorOferta(error)
      return
    }
    setErrorOferta(null)
    guardar({ precio_oferta: valor })
  }

  // En el celular el servicio es una fila compacta (foto, nombre, duración y
  // precio) que se despliega como acordeón con los mismos campos y el mismo
  // guardado automático de la tarjeta de escritorio.
  if (esMovil) {
    const enOferta = ofertaVigente(servicio)
    const textoBarberos =
      (servicio.barbero_ids ?? []).length === 0
        ? 'Todos'
        : (barberos ?? [])
            .filter((barbero) => servicio.barbero_ids.includes(barbero.id))
            .map((barbero) => barbero.nombre)
            .join(', ')
    return (
      <div data-fila-servicio>
        <button
          type="button"
          onClick={() => setDesplegado((d) => !d)}
          aria-expanded={desplegado}
          className="flex min-h-[72px] w-full items-center gap-3 px-4 py-3 text-left active:bg-gris-calido-100"
        >
          {servicio.imagen_url ? (
            <img src={servicio.imagen_url} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cobre/10 font-display text-lg text-cobre-texto"
            >
              {servicio.nombre.trim().charAt(0).toUpperCase()}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span
              className={`block truncate text-base font-medium leading-snug ${servicio.activo ? 'text-negro-barbero' : 'text-gris-calido-400'}`}
            >
              {servicio.nombre}
            </span>
            <span className="numeros-tabulares flex flex-wrap items-center gap-x-1.5 text-[15px] leading-snug text-gris-calido-500">
              <span>{servicio.duracion_minutos} min</span>
              <span aria-hidden="true">·</span>
              {enOferta ? (
                <>
                  <span className="font-medium text-cobre-texto">{formatoCLP(servicio.precio_oferta)}</span>
                  <span className="text-[13px] text-gris-calido-400 line-through">{formatoCLP(servicio.precio_clp)}</span>
                </>
              ) : (
                <span>{formatoCLP(servicio.precio_clp ?? 0)}</span>
              )}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {estado ? (
              <TextoEstadoMovil estado={estado} />
            ) : (
              !servicio.activo && (
                <span className="rounded-full bg-gris-calido-100 px-2 py-0.5 text-[13px] font-medium text-gris-calido-500">
                  Oculto
                </span>
              )
            )}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={`h-5 w-5 text-gris-calido-400 transition-transform duration-200 ${desplegado ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        <AnimatePresence initial={false}>
          {desplegado && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-4 border-t border-gris-calido-100 bg-hueso/40 px-4 pb-5 pt-4">
                <div className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-gris-calido-200 bg-white px-4">
                  <span className="text-base text-negro-barbero">
                    {servicio.activo ? 'Publicado' : 'Oculto en tu página'}
                  </span>
                  <Interruptor
                    activo={servicio.activo}
                    etiqueta={`Publicado: ${servicio.nombre}`}
                    onCambiar={(valor) => guardar({ activo: valor })}
                  />
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className={ETIQUETA_MOVIL}>Nombre</span>
                  <input
                    type="text"
                    name="nombre"
                    value={campos.nombre}
                    onChange={(e) => setCampos((c) => ({ ...c, nombre: e.target.value }))}
                    onBlur={commitTexto}
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
                      value={campos.duracion_minutos}
                      onChange={(e) => setCampos((c) => ({ ...c, duracion_minutos: e.target.value }))}
                      onBlur={() =>
                        commitNumero('duracion_minutos', campos.duracion_minutos, servicio.duracion_minutos)
                      }
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
                      value={campos.precio_clp}
                      onChange={(e) => setCampos((c) => ({ ...c, precio_clp: e.target.value }))}
                      onBlur={() => commitNumero('precio_clp', campos.precio_clp, servicio.precio_clp)}
                      className={CAMPO_MOVIL}
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex min-h-8 items-center justify-between">
                    <span className={ETIQUETA_MOVIL}>Precio oferta</span>
                    <Interruptor
                      activo={servicio.oferta_activa}
                      etiqueta={`Oferta activa de ${servicio.nombre}`}
                      onCambiar={alternarOferta}
                    />
                  </div>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="Sin oferta"
                    name="precio_oferta"
                    value={campos.precio_oferta}
                    onChange={(e) => setCampos((c) => ({ ...c, precio_oferta: e.target.value }))}
                    onBlur={commitPrecioOferta}
                    className={CAMPO_MOVIL}
                  />
                  {errorOferta && (
                    <p role="alert" className="text-[15px] text-red-700">
                      {errorOferta}
                    </p>
                  )}
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className={ETIQUETA_MOVIL}>Descripción</span>
                  <textarea
                    name="descripcion"
                    rows={3}
                    value={campos.descripcion}
                    onChange={(e) => setCampos((c) => ({ ...c, descripcion: e.target.value }))}
                    onBlur={commitDescripcion}
                    placeholder="Qué incluye este servicio."
                    className="resize-none rounded-xl border border-gris-calido-200 bg-white px-3.5 py-3 text-base text-negro-barbero outline-none transition-colors focus:border-cobre"
                  />
                </label>

                <div className="flex items-center gap-3">
                  {servicio.imagen_url ? (
                    <img src={servicio.imagen_url} alt={servicio.nombre} className="h-16 w-20 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-gris-calido-200 bg-white text-[13px] text-gris-calido-400">
                      Sin foto
                    </div>
                  )}
                  <SelectorArchivo
                    etiqueta={servicio.imagen_url ? 'Cambiar foto' : 'Agregar foto'}
                    cargando={subiendoImagen}
                    onChange={cambiarImagen}
                    className="min-h-11 flex-1 justify-center bg-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setModalBarberosAbierto(true)}
                  className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-gris-calido-200 bg-white px-4 text-left"
                >
                  <span className="shrink-0 text-base text-negro-barbero">Barberos</span>
                  <span className="flex min-w-0 items-center gap-1 text-[15px] text-gris-calido-500">
                    <span className="truncate">{textoBarberos}</span>
                    <span aria-hidden="true" className="text-lg leading-none text-gris-calido-400">
                      ›
                    </span>
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ModalAsignarBarberos
          abierto={modalBarberosAbierto}
          servicioNombre={servicio.nombre}
          barberos={barberos}
          barberoIds={servicio.barbero_ids ?? []}
          onGuardar={(barbero_ids) => guardar({ barbero_ids })}
          onCerrar={() => setModalBarberosAbierto(false)}
        />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gris-calido-200 bg-white p-5 transition-colors hover:border-gris-calido-300">
      {/* Encabezado de la tarjeta: nombre (lo principal) + estado de
          publicación — el mismo tipo de fila que ya usan otras tarjetas del
          panel (barbero, sección), para que "publicado/oculto" se lea como
          el estado general del servicio, no como un control más perdido
          entre los demás. */}
      <div className="flex items-start justify-between gap-4">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="versalitas text-xs text-gris-calido-500">Nombre</span>
          <input
            type="text"
            name="nombre"
            value={campos.nombre}
            onChange={(e) => setCampos((c) => ({ ...c, nombre: e.target.value }))}
            onBlur={commitTexto}
            className="min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-base font-medium text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>

        {/* Un espaciador invisible de la misma altura que la etiqueta
            "Nombre" (texto + separación) hace que el interruptor quede
            exactamente a la altura del input de al lado, en vez de calcular
            un padding a ojo — si el tamaño de la etiqueta cambia alguna vez,
            esto se sigue ajustando solo. */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span aria-hidden="true" className="versalitas invisible text-xs">
            Nombre
          </span>
          <div className="flex min-h-11 items-center gap-2">
            <Interruptor
              activo={servicio.activo}
              etiqueta={`Publicado: ${servicio.nombre}`}
              onCambiar={(valor) => guardar({ activo: valor })}
            />
            <span className="versalitas text-xs text-gris-calido-500">
              {servicio.activo ? 'Publicado' : 'Oculto'}
            </span>
          </div>
          <div className="h-4">
            <AnimatePresence mode="wait">
              {estado && (
                <motion.span
                  key={estado}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  role={estado === 'error' ? 'alert' : undefined}
                  className={`versalitas text-xs ${estado === 'error' ? 'text-red-700' : 'text-verde-barberia'}`}
                >
                  {ESTADOS[estado]}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Imagen + descripción: lo que convierte esta fila en algo que se
          puede mostrar como tarjeta en la vidriera pública de servicios, no
          solo una línea de precio. Ambos opcionales — un servicio sin nada
          de esto sigue funcionando igual, solo que sin foto ni bajada en esa
          vidriera. */}
      <div className="mt-4 flex flex-col gap-4 border-t border-gris-calido-100 pt-4 sm:flex-row">
        <div className="shrink-0">
          {servicio.imagen_url ? (
            <img
              src={servicio.imagen_url}
              alt={servicio.nombre}
              className="h-20 w-28 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-20 w-28 items-center justify-center rounded-md border border-dashed border-gris-calido-200 text-xs text-gris-calido-400">
              Sin foto
            </div>
          )}
          <SelectorArchivo
            etiqueta={servicio.imagen_url ? 'Cambiar foto' : 'Agregar foto'}
            cargando={subiendoImagen}
            onChange={cambiarImagen}
            className="mt-2 w-full justify-center"
          />
        </div>
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="versalitas text-xs text-gris-calido-500">Descripción</span>
          <textarea
            name="descripcion"
            rows={3}
            value={campos.descripcion}
            onChange={(e) => setCampos((c) => ({ ...c, descripcion: e.target.value }))}
            onBlur={commitDescripcion}
            placeholder="Qué incluye este servicio, para que el cliente sepa qué está eligiendo."
            className="resize-none rounded-md border border-gris-calido-200 bg-transparent p-2 text-sm text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>
      </div>

      {/* A qué barberos pertenece este servicio — sin ninguno asignado (el
          caso por defecto) lo ofrece cualquier barbero activo; con uno o
          varios, SOLO esos lo ofrecen (ver AsistenteReserva.jsx). Reemplaza
          al viejo "catálogo propio" que activaba/desactivaba el barbero
          desde su panel — ahora es el dueño quien decide esto acá, por
          servicio, en su propia card en vez de una fila de checkboxes
          siempre visible. */}
      <div className="mt-4 border-t border-gris-calido-100 pt-4">
        <span className="versalitas text-xs text-gris-calido-500">Barberos asignados</span>
        <p className="mt-1 text-sm text-negro-barbero">
          {(servicio.barbero_ids ?? []).length === 0
            ? 'Compartido — cualquier barbero'
            : (barberos ?? [])
                .filter((barbero) => servicio.barbero_ids.includes(barbero.id))
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

      <ModalAsignarBarberos
        abierto={modalBarberosAbierto}
        servicioNombre={servicio.nombre}
        barberos={barberos}
        barberoIds={servicio.barbero_ids ?? []}
        onGuardar={(barbero_ids) => guardar({ barbero_ids })}
        onCerrar={() => setModalBarberosAbierto(false)}
      />

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-gris-calido-100 pt-4 md:grid-cols-[8rem_10rem_12rem]">
        <label className="flex flex-col gap-1">
          <span className="versalitas flex min-h-7 items-center text-xs text-gris-calido-500">
            Duración (min)
          </span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            name="duracion_minutos"
            value={campos.duracion_minutos}
            onChange={(e) => setCampos((c) => ({ ...c, duracion_minutos: e.target.value }))}
            onBlur={() =>
              commitNumero('duracion_minutos', campos.duracion_minutos, servicio.duracion_minutos)
            }
            className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="versalitas flex min-h-7 items-center text-xs text-gris-calido-500">
            Precio
          </span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            name="precio_clp"
            value={campos.precio_clp}
            onChange={(e) => setCampos((c) => ({ ...c, precio_clp: e.target.value }))}
            onBlur={() => commitNumero('precio_clp', campos.precio_clp, servicio.precio_clp)}
            className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
        </label>

        {/* El interruptor de "oferta activa" vive pegado al campo que
            enciende — antes estaba en una fila aparte, lejos del precio de
            oferta, sin ninguna relación visual con él. `min-h-7` en las tres
            etiquetas (esta y las dos de arriba) es lo que las deja a la
            misma altura — sin eso, esta fila queda más alta que las otras
            dos (por el interruptor) y el input de acá abajo termina más
            abajo que "Duración"/"Precio", desalineando toda la fila. */}
        <div className="col-span-2 flex flex-col gap-1 md:col-span-1">
          <div className="flex min-h-7 items-center justify-between">
            <span className="versalitas text-xs text-gris-calido-500">Precio oferta</span>
            <Interruptor
              activo={servicio.oferta_activa}
              etiqueta={`Oferta activa de ${servicio.nombre}`}
              onCambiar={alternarOferta}
            />
          </div>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="—"
            name="precio_oferta"
            value={campos.precio_oferta}
            onChange={(e) => setCampos((c) => ({ ...c, precio_oferta: e.target.value }))}
            onBlur={commitPrecioOferta}
            className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre disabled:text-gris-calido-400"
          />
          {errorOferta && (
            <p role="alert" className="text-xs text-red-700">
              {errorOferta}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
