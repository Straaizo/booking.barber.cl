import { useState } from 'react'
import { Interruptor } from '../../../components/panel/Interruptor'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function FilaHorario({ horario, onGuardar }) {
  const [guardando, setGuardando] = useState(false)

  async function alternar(valor) {
    setGuardando(true)
    try {
      await onGuardar({ activo: valor })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-gris-calido-200 py-4">
      <div>
        <span className={`font-medium ${horario.activo ? 'text-negro-barbero' : 'text-gris-calido-400'}`}>
          {DIAS[horario.dia_semana]}
        </span>
        <span className="numeros-tabulares ml-3 text-sm text-gris-calido-500">
          {horario.hora_inicio.slice(0, 5)} – {horario.hora_fin.slice(0, 5)}
        </span>
      </div>
      <Interruptor
        activo={horario.activo}
        etiqueta={`Horario de ${DIAS[horario.dia_semana]}`}
        disabled={guardando}
        onCambiar={alternar}
      />
    </div>
  )
}
