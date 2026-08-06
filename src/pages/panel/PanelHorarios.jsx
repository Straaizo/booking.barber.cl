import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../../components/common/Loader'
import { Button } from '../../components/common/Button'
import { useBarberosAdmin } from './hooks/useBarberosAdmin'
import { useHorariosDeBarbero, useCrearHorario, useActualizarHorario } from './hooks/useHorariosAdmin'
import { FilaHorario } from './components/FilaHorario'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function PanelHorarios() {
  const { perfil } = useAuth()
  const { data: barberos, isLoading: cargandoBarberos } = useBarberosAdmin(perfil.barberia_id)
  const [barberoId, setBarberoId] = useState(null)

  useEffect(() => {
    if (!barberoId && barberos?.length) setBarberoId(barberos[0].id)
  }, [barberos, barberoId])

  const { data: horarios, isLoading, isError } = useHorariosDeBarbero(barberoId)
  const crearHorario = useCrearHorario(barberoId)
  const actualizarHorario = useActualizarHorario(barberoId)

  const [nuevo, setNuevo] = useState({ dia_semana: '1', hora_inicio: '09:00', hora_fin: '19:00' })
  const [errorEnvio, setErrorEnvio] = useState(null)

  async function agregarHorario(evento) {
    evento.preventDefault()
    setErrorEnvio(null)
    try {
      await crearHorario.mutateAsync({
        dia_semana: Number(nuevo.dia_semana),
        hora_inicio: nuevo.hora_inicio,
        hora_fin: nuevo.hora_fin,
      })
    } catch {
      setErrorEnvio('No pudimos crear el horario. Intenta de nuevo.')
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
        Horarios de atención
      </h1>
      <p className="mt-2 max-w-lg text-sm text-gris-calido-700">
        Define los bloques de horario por día para cada barbero. Solo se ofrecen horas dentro de
        estos bloques al reservar.
      </p>

      {cargandoBarberos && (
        <div className="py-12">
          <Loader label="Cargando barberos" />
        </div>
      )}

      {barberos && barberos.length === 0 && (
        <p className="py-8 text-sm text-gris-calido-700">
          Primero agrega un barbero en la pestaña "Barberos".
        </p>
      )}

      {barberos && barberos.length > 0 && (
        <>
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {barberos.map((barbero) => (
              <button
                key={barbero.id}
                type="button"
                onClick={() => setBarberoId(barbero.id)}
                className={`versalitas min-h-11 shrink-0 rounded-full border px-4 text-xs transition-colors ${
                  barberoId === barbero.id
                    ? 'border-cobre bg-cobre text-hueso'
                    : 'border-gris-calido-200 text-gris-calido-700 hover:border-cobre/50'
                }`}
              >
                {barbero.nombre}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {isLoading && (
              <div className="py-12">
                <Loader label="Cargando horarios" />
              </div>
            )}

            {isError && (
              <p role="alert" className="py-8 text-sm text-red-700">
                No pudimos cargar los horarios. Recarga la página o intenta más tarde.
              </p>
            )}

            {horarios && horarios.length === 0 && (
              <p className="py-8 text-sm text-gris-calido-700">
                Este barbero todavía no tiene horarios cargados.
              </p>
            )}

            {horarios && horarios.length > 0 && (
              <div className="border-t border-gris-calido-200">
                {horarios.map((horario) => (
                  <FilaHorario
                    key={horario.id}
                    horario={horario}
                    onGuardar={(cambios) => actualizarHorario.mutateAsync({ id: horario.id, cambios })}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-10 border-t border-cobre/25 pt-6">
            <span className="versalitas text-xs text-cobre">— Nuevo bloque de horario</span>
            <form
              onSubmit={agregarHorario}
              className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-[1fr_8rem_8rem_auto] md:items-end"
            >
              <label className="col-span-2 flex flex-col gap-2 md:col-span-1">
                <span className="versalitas text-xs text-gris-calido-500">Día</span>
                <select
                  value={nuevo.dia_semana}
                  onChange={(e) => setNuevo((n) => ({ ...n, dia_semana: e.target.value }))}
                  className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
                >
                  {DIAS.map((dia, indice) => (
                    <option key={dia} value={indice}>
                      {dia}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="versalitas text-xs text-gris-calido-500">Desde</span>
                <input
                  type="time"
                  value={nuevo.hora_inicio}
                  onChange={(e) => setNuevo((n) => ({ ...n, hora_inicio: e.target.value }))}
                  className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="versalitas text-xs text-gris-calido-500">Hasta</span>
                <input
                  type="time"
                  value={nuevo.hora_fin}
                  onChange={(e) => setNuevo((n) => ({ ...n, hora_fin: e.target.value }))}
                  className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-negro-barbero outline-none transition-colors focus:border-cobre"
                />
              </label>
              <Button as="button" type="submit" disabled={crearHorario.isPending} className="h-fit">
                {crearHorario.isPending ? 'Creando…' : 'Agregar'}
              </Button>
            </form>
            {errorEnvio && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {errorEnvio}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
