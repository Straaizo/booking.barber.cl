import { useState } from 'react'
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
      <div className="versalitas mb-3 flex justify-between text-xs text-[var(--pb-texto-terciario)]">
        <span>
          <span className="numeros-tabulares text-[var(--pb-acento-texto)]">{String(indiceActivo + 1).padStart(2, '0')}</span>
          {' / '}
          <span className="numeros-tabulares">{String(total).padStart(2, '0')}</span>
        </span>
        <span>{etiquetas[indiceActivo]}</span>
      </div>
      <div className="h-px w-full bg-[var(--pb-borde)]">
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

  // El barbero se elige primero (no el servicio) porque cada barbero puede
  // ofrecer un catálogo de servicios distinto — recién con el barbero
  // elegido se sabe qué servicios corresponde mostrar en el paso siguiente.
  // Este paso se muestra siempre, aunque la barbería tenga un solo barbero:
  // deja claro desde el principio quién atiende, en vez de asumirlo en
  // silencio.
  const [paso, setPaso] = useState('barbero')
  const [barbero, setBarbero] = useState(null)
  const [servicio, setServicio] = useState(null)
  const [horario, setHorario] = useState(null)

  const crearReserva = useCrearReserva()

  // Si el barbero tiene catálogo propio (lo habilitó el dueño), solo se le
  // ofrecen SUS servicios (`servicio.barbero_id === barbero.id`) — si no,
  // el catálogo compartido de la barbería (`servicio.barbero_id` vacío).
  const serviciosDelBarbero = barbero
    ? serviciosActivos.filter((servicio) =>
        barbero.usa_catalogo_propio ? servicio.barbero_id === barbero.id : !servicio.barbero_id
      )
    : []

  const secuenciaPasos = ['barbero', 'servicio', 'horario', 'datos']
  const etiquetasPasos = ['Barbero', 'Servicio', 'Horario', 'Tus datos']
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
        <p className="font-display text-xl font-light text-[var(--pb-texto)]">
          Esta barbería aún no tiene servicios publicados.
        </p>
        <p className="mt-2 text-sm text-[var(--pb-texto-secundario)]">Vuelve a intentarlo más tarde.</p>
      </div>
    )
  }

  return (
    <div className="border-t-2 border-cobre bg-[var(--pb-superficie)]/50 px-5 py-7 md:px-7 md:py-9">
      {/* Alto fijo (medido contra el paso más alto real: "Elige día y hora"
          con varios horarios disponibles) en vez de uno que crece según qué
          pasos se visitaron — con el enfoque anterior, volver a un paso
          corto después de haber visto uno alto lo dejaba con un hueco vacío
          enorme, porque el mínimo nunca se achicaba. Uno fijo es siempre
          igual sin importar el orden de navegación. El contenido de cada
          paso queda arriba (no centrado en el alto disponible): es donde el
          ojo llega primero, justo debajo de la barra de progreso — un paso
          corto (ej. un solo barbero) deja el resto del espacio fijo vacío
          abajo, en vez de forzar todo al medio. */}
      <div className="min-h-[600px] md:min-h-[520px]">
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
                onVolver={() => volverA('barbero')}
              />
            )}
            {paso === 'horario' && (
              <PasoHorario
                barbero={barbero}
                servicio={servicio}
                diasMaximosReserva={barberia.dias_maximos_reserva}
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
