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

  const [paso, setPaso] = useState('servicio')
  const [servicio, setServicio] = useState(null)
  const [barbero, setBarbero] = useState(
    barberosActivos.length === 1 ? barberosActivos[0] : null
  )
  const [horario, setHorario] = useState(null)

  const crearReserva = useCrearReserva()

  const secuenciaPasos = hayVariosBarberos
    ? ['servicio', 'barbero', 'horario', 'datos']
    : ['servicio', 'horario', 'datos']
  const etiquetasPasos = hayVariosBarberos
    ? ['Servicio', 'Barbero', 'Horario', 'Tus datos']
    : ['Servicio', 'Horario', 'Tus datos']
  const indiceActivo = secuenciaPasos.indexOf(paso)

  function elegirServicio(servicioElegido) {
    setServicio(servicioElegido)
    setPaso(hayVariosBarberos ? 'barbero' : 'horario')
  }

  function elegirBarbero(barberoElegido) {
    setBarbero(barberoElegido)
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
          {paso === 'barbero' && (
            <PasoBarbero
              barberos={barberosActivos}
              onSeleccionar={elegirBarbero}
              onVolver={() => volverA('servicio')}
            />
          )}
          {paso === 'horario' && (
            <PasoHorario
              barbero={barbero}
              servicio={servicio}
              onSeleccionar={elegirHorario}
              onVolver={() => volverA(hayVariosBarberos ? 'barbero' : 'servicio')}
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

      {crearReserva.isError && (
        <p className="mt-4 text-sm text-red-700" role="alert">
          No pudimos confirmar tu reserva. Intenta nuevamente.
        </p>
      )}
    </div>
  )
}
