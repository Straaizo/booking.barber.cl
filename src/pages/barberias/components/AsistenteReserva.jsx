import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PasoServicio } from './PasoServicio'
import { PasoBarbero } from './PasoBarbero'
import { PasoHorario } from './PasoHorario'
import { PasoDatos } from './PasoDatos'
import { Confirmacion } from './Confirmacion'
import { useCrearReserva } from '../hooks/useCrearReserva'
import { formatoCLP } from '../../../utils/formatos'
import { EASE_ENTRADA } from '../../../components/animations/easing'

const VARIANTES_PASO = {
  entra: { opacity: 0, x: 20 },
  centro: { opacity: 1, x: 0 },
  sale: { opacity: 0, x: -20 },
}

// P0001 es el código que Postgres le pone a un `raise exception` sin un
// ERRCODE explícito — es exactamente el que usan todas nuestras validaciones
// de negocio en `reservas` (horario no disponible, enfriamiento por
// teléfono, freno por barbería, etc.), escritas a propósito en español para
// que el cliente las lea. Cualquier otro código (una violación de
// constraint, un error de red) trae un mensaje técnico que no corresponde
// mostrarle a quien está reservando.
function mensajeErrorReserva(error) {
  if (error?.code === 'P0001' && error.message) return error.message
  return 'No pudimos confirmar tu reserva. Intenta nuevamente.'
}

function ProgresoAsistente({ etiquetas, indiceActivo }) {
  const total = etiquetas.length
  return (
    <div className="mb-8">
      <div className="versalitas mb-3 flex justify-between text-xs text-gris-calido-500">
        <span>
          <span className="numeros-tabulares text-cobre-texto">{String(indiceActivo + 1).padStart(2, '0')}</span>
          {' / '}
          <span className="numeros-tabulares">{String(total).padStart(2, '0')}</span>
        </span>
        <span>{etiquetas[indiceActivo]}</span>
      </div>
      <div className="h-px w-full bg-gris-calido-200">
        <motion.div
          className="h-px bg-cobre"
          initial={false}
          animate={{ width: `${((indiceActivo + 1) / total) * 100}%` }}
          transition={{ duration: 0.5, ease: EASE_ENTRADA }}
        />
      </div>
    </div>
  )
}

export function AsistenteReserva({ barberia }) {
  const barberosActivos = barberia.barberos.filter((barbero) => barbero.activo)
  const serviciosActivos = barberia.servicios.filter((servicio) => servicio.activo)
  const hayVariosBarberos = barberosActivos.length > 1

  // El barbero se elige primero (no el servicio) porque cada barbero puede
  // ofrecer un catálogo de servicios distinto — recién con el barbero
  // elegido se sabe qué servicios corresponde mostrar en el paso siguiente.
  // Con un solo barbero se auto-selecciona y ese paso ni se muestra, pero el
  // filtrado de servicios sigue aplicando igual.
  const [paso, setPaso] = useState(hayVariosBarberos ? 'barbero' : 'servicio')
  const [barbero, setBarbero] = useState(
    barberosActivos.length === 1 ? barberosActivos[0] : null
  )
  const [servicio, setServicio] = useState(null)
  const [horario, setHorario] = useState(null)

  const crearReserva = useCrearReserva()

  // Cada paso tiene una altura distinta (la grilla de barberos no mide lo
  // mismo que el formulario de datos, ni que el calendario de horario) —
  // sin reservar espacio, el <Footer> que viene justo después de este
  // componente (ver VistaBarberia.jsx) salta hacia arriba o abajo en cada
  // paso. En vez de adivinar un alto fijo (que quedaría corto o largo según
  // cuántos servicios/barberos tenga cada barbería), se mide el alto real de
  // cada paso a medida que se visita y se aplica como mínimo el más alto
  // visto hasta ahora — nunca se achica, así que el footer deja de moverse
  // apenas se pasó una vez por el paso más alto, sin importar cuál paso
  // arranca primero (con 1 solo barbero, el asistente ni pasa por "barbero").
  const contenedorRef = useRef(null)
  const [alturaMinima, setAlturaMinima] = useState(0)

  useEffect(() => {
    const elemento = contenedorRef.current
    if (!elemento || typeof ResizeObserver === 'undefined') return
    const observador = new ResizeObserver(([entrada]) => {
      const alto = entrada.contentRect.height
      setAlturaMinima((actual) => Math.max(actual, alto))
    })
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  // Si el barbero tiene catálogo propio (lo habilitó el dueño), solo se le
  // ofrecen SUS servicios (`servicio.barbero_id === barbero.id`) — si no,
  // el catálogo compartido de la barbería (`servicio.barbero_id` vacío).
  const serviciosDelBarbero = barbero
    ? serviciosActivos.filter((servicio) =>
        barbero.usa_catalogo_propio ? servicio.barbero_id === barbero.id : !servicio.barbero_id
      )
    : []

  const secuenciaPasos = hayVariosBarberos
    ? ['barbero', 'servicio', 'horario', 'datos']
    : ['servicio', 'horario', 'datos']
  const etiquetasPasos = hayVariosBarberos
    ? ['Barbero', 'Servicio', 'Horario', 'Tus datos']
    : ['Servicio', 'Horario', 'Tus datos']
  const indiceActivo = secuenciaPasos.indexOf(paso)

  function elegirBarbero(barberoElegido) {
    setBarbero(barberoElegido)
    setServicio(null)
    setPaso('servicio')
  }

  function elegirServicio(servicioElegido) {
    setServicio(servicioElegido)
    setPaso('horario')
  }

  function elegirHorario(horarioElegido) {
    setHorario(horarioElegido)
    setPaso('datos')
  }

  function volverA(pasoAnterior) {
    setPaso(pasoAnterior)
  }

  async function confirmar(datosCliente) {
    const fechaHora = new Date(horario.fecha)
    const [horas, minutos] = horario.hora.split(':').map(Number)
    fechaHora.setHours(horas, minutos, 0, 0)

    const reserva = await crearReserva.mutateAsync({
      barberia_id: barberia.id,
      barbero_id: barbero.id,
      servicio_id: servicio.id,
      fecha_hora: fechaHora.toISOString(),
      estado: 'confirmada',
      ...datosCliente,
    })
    setPaso('confirmado')
    return reserva
  }

  const resumen = servicio
    ? `${servicio.nombre} · ${barbero?.nombre ?? ''} · ${
        horario ? `${horario.fecha.toLocaleDateString('es-CL')} ${horario.hora}` : ''
      } · ${formatoCLP(servicio.precio_oferta && servicio.oferta_activa ? servicio.precio_oferta : servicio.precio_clp)}`
    : ''

  if (serviciosActivos.length === 0) {
    return (
      <div className="border-t border-cobre/25 py-10 text-center">
        <p className="font-display text-xl font-light text-negro-barbero">
          Esta barbería aún no tiene servicios publicados.
        </p>
        <p className="mt-2 text-sm text-gris-calido-700">Vuelve a intentarlo más tarde.</p>
      </div>
    )
  }

  return (
    <div className="border-t-2 border-cobre bg-white/50 px-5 py-7 md:px-7 md:py-9">
      {/* La barra de progreso entra en la misma medición que los pasos: si
          quedara afuera, el paso "confirmado" (que no la muestra) se
          achicaría por el alto exacto de la barra sin importar el mínimo
          reservado más abajo. */}
      <div ref={contenedorRef} style={{ minHeight: alturaMinima || undefined }}>
        {paso !== 'confirmado' && (
          <ProgresoAsistente etiquetas={etiquetasPasos} indiceActivo={indiceActivo} />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={paso}
            variants={VARIANTES_PASO}
            initial="entra"
            animate="centro"
            exit="sale"
            transition={{ duration: 0.3, ease: EASE_ENTRADA }}
          >
            {paso === 'barbero' && (
              <PasoBarbero barberos={barberosActivos} onSeleccionar={elegirBarbero} />
            )}
            {paso === 'servicio' && (
              <PasoServicio
                servicios={serviciosDelBarbero}
                onSeleccionar={elegirServicio}
                onVolver={hayVariosBarberos ? () => volverA('barbero') : undefined}
              />
            )}
            {paso === 'horario' && (
              <PasoHorario
                barbero={barbero}
                servicio={servicio}
                onSeleccionar={elegirHorario}
                onVolver={() => volverA('servicio')}
              />
            )}
            {paso === 'datos' && (
              <PasoDatos
                resumen={resumen}
                enviando={crearReserva.isPending}
                onConfirmar={confirmar}
                onVolver={() => volverA('horario')}
              />
            )}
            {paso === 'confirmado' && <Confirmacion resumen={resumen} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {crearReserva.isError && (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {mensajeErrorReserva(crearReserva.error)}
        </p>
      )}
    </div>
  )
}
