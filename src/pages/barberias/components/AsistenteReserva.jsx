import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PasoServicio } from './PasoServicio'
import { PasoBarbero } from './PasoBarbero'
import { PasoHorario } from './PasoHorario'
import { PasoDatos } from './PasoDatos'
import { Confirmacion } from './Confirmacion'
import { useCrearReserva } from '../hooks/useCrearReserva'
import { formatoCLP } from '../../../utils/formatos'

const VARIANTES_PASO = {
  entra: { opacity: 0, x: 24 },
  centro: { opacity: 1, x: 0 },
  sale: { opacity: 0, x: -24 },
}

export function AsistenteReserva({ barberia }) {
  const barberosActivos = barberia.barberos.filter((barbero) => barbero.activo)
  const [paso, setPaso] = useState('servicio')
  const [servicio, setServicio] = useState(null)
  const [barbero, setBarbero] = useState(
    barberosActivos.length === 1 ? barberosActivos[0] : null
  )
  const [horario, setHorario] = useState(null)

  const crearReserva = useCrearReserva()

  function elegirServicio(servicioElegido) {
    setServicio(servicioElegido)
    setPaso(barberosActivos.length > 1 ? 'barbero' : 'horario')
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

  return (
    <div className="overflow-hidden rounded-2xl bg-white/40 p-5 shadow-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={paso}
          variants={VARIANTES_PASO}
          initial="entra"
          animate="centro"
          exit="sale"
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {paso === 'servicio' && (
            <PasoServicio servicios={barberia.servicios} onSeleccionar={elegirServicio} />
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
              onVolver={() => volverA(barberosActivos.length > 1 ? 'barbero' : 'servicio')}
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
        <p className="mt-3 text-sm text-red-700">
          No pudimos confirmar tu reserva. Intenta nuevamente.
        </p>
      )}
    </div>
  )
}
