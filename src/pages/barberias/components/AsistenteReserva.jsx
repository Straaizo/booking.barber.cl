import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PasoServicio } from './PasoServicio'
import { PasoBarberoHorario } from './PasoBarberoHorario'
import { PasoDatos } from './PasoDatos'
import { Confirmacion } from './Confirmacion'
import { useCrearReserva } from '../hooks/useCrearReserva'
import { formatoCLP } from '../../../utils/formatos'
import { EASE_ENTRADA } from '../../../components/animations/easing'
import { clasesTarjeta } from '../../../utils/personalizacion'

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

  // El servicio se elige primero: recién con el servicio elegido se sabe
  // quién lo hace (ver `barberosQueOfrecen` más abajo) — así se puede
  // mostrar TODOS los barberos que lo ofrecen con sus horas de un mismo día,
  // en vez de comprometerse con un barbero a ciegas antes de saber si tiene
  // hora (el flujo viejo, "elige barbero" → "elige servicio" → "elige
  // horario", uno a la vez).
  const [paso, setPaso] = useState('servicio')
  const [barbero, setBarbero] = useState(null)
  const [servicio, setServicio] = useState(null)
  const [horario, setHorario] = useState(null)

  const crearReserva = useCrearReserva()

  // Un servicio COMPARTIDO (`barbero_ids` vacío) lo ofrece cualquier barbero
  // activo; uno asignado a uno o varios barberos puntuales (el dueño los
  // elige desde Servicios, ver PanelServicios.jsx) solo lo ofrecen esos.
  const barberosQueOfrecen = servicio
    ? servicio.barbero_ids?.length > 0
      ? barberosActivos.filter((b) => servicio.barbero_ids.includes(b.id))
      : barberosActivos
    : []

  const secuenciaPasos = ['servicio', 'barbero_horario', 'datos']
  const etiquetasPasos = ['Servicio', 'Barbero y hora', 'Tus datos']
  const indiceActivo = secuenciaPasos.indexOf(paso)

  function elegirServicio(servicioElegido) {
    setServicio(servicioElegido)
    setBarbero(null)
    setPaso('barbero_horario')
  }

  function elegirBarberoYHorario({ barbero: barberoElegido, fecha, hora }) {
    setBarbero(barberoElegido)
    setHorario({ fecha, hora })
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
    // El acento superior color de marca (`border-t-cobre`) queda siempre,
    // sea cual sea `estilo_tarjetas` — es la pista de "acá se reserva",
    // la misma en toda la página; lo que cambia con el estilo es el resto
    // del borde/sombra, igual que en testimonios/equipo/tablas.
    <div
      className={`${clasesTarjeta(barberia.personalizacion?.estilo_tarjetas, barberia.personalizacion?.tema === 'oscuro')} border-t-2 border-t-cobre bg-[var(--pb-superficie)] px-5 py-7 md:px-7 md:py-9`}
    >
      {/* Nada de alto fijo ni scroll interno — con varios servicios (cada
          uno con foto grande) o muchos horarios, la lista tiene que poder
          crecer como una lista normal, no quedar recortada en una cajita
          con scroll (se ve poco profesional, y corta el encabezado "01/03"
          de arriba). `layout`: Framer Motion mide el alto real en cada
          cambio de paso y anima la transición — así el contenedor sigue
          creciendo/achicándose libremente según el contenido, pero el salto
          entre un paso y otro es suave en vez de un corte de golpe. */}
      <motion.div layout transition={{ duration: 0.35, ease: EASE_ENTRADA }}>
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
            {paso === 'servicio' && (
              <PasoServicio servicios={serviciosActivos} onSeleccionar={elegirServicio} />
            )}
            {paso === 'barbero_horario' && (
              <PasoBarberoHorario
                servicio={servicio}
                barberos={barberosQueOfrecen}
                diasMaximosReserva={barberia.dias_maximos_reserva}
                onSeleccionar={elegirBarberoYHorario}
                onVolver={() => volverA('servicio')}
              />
            )}
            {paso === 'datos' && (
              <PasoDatos
                resumen={resumen}
                enviando={crearReserva.isPending}
                onConfirmar={confirmar}
                onVolver={() => volverA('barbero_horario')}
              />
            )}
            {paso === 'confirmado' && <Confirmacion resumen={resumen} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {crearReserva.isError && (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {mensajeErrorReserva(crearReserva.error)}
        </p>
      )}
    </div>
  )
}
