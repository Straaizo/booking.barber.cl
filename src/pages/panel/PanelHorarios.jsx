import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../../components/common/Loader'
import { Button } from '../../components/common/Button'
import { useBarberosAdmin, useActualizarBarbero } from './hooks/useBarberosAdmin'
import { useHorariosDeBarbero, useCrearHorario, useActualizarHorario } from './hooks/useHorariosAdmin'
import { useIsMobile } from '../../hooks/useIsMobile'
import { FilaHorario, HojaNuevoBloque } from './components/FilaHorario'
import { SelectorIntervaloReserva } from './components/SelectorIntervaloReserva'
import { ExcepcionesHorario } from './components/ExcepcionesHorario'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const ETIQUETA_SECCION = 'mb-2 block px-1 font-sans! text-[13px] font-semibold uppercase tracking-[0.06em] text-gris-calido-500'

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
  const actualizarBarbero = useActualizarBarbero(perfil.barberia_id)
  const barberoActivo = barberos?.find((b) => b.id === barberoId)

  const [nuevo, setNuevo] = useState({ dia_semana: '1', hora_inicio: '09:00', hora_fin: '19:00' })
  const [errorEnvio, setErrorEnvio] = useState(null)
  const [hojaNuevoAbierta, setHojaNuevoAbierta] = useState(false)
  const esMovil = useIsMobile()

  async function agregarHorario(evento) {
    evento.preventDefault()
    setErrorEnvio(null)
    try {
      await crearHorario.mutateAsync({
        dia_semana: Number(nuevo.dia_semana),
        hora_inicio: nuevo.hora_inicio,
        hora_fin: nuevo.hora_fin,
      })
      setHojaNuevoAbierta(false)
    } catch {
      setErrorEnvio('No pudimos crear el horario. Intenta de nuevo.')
    }
  }

  // En el celular: la semana como lista compacta tipo iOS y lo poco usado
  // (nuevo bloque, excepciones) detrás de filas que abren hojas inferiores.
  if (esMovil) {
    return (
      <div>
        <h1 className="font-display text-[28px] font-light leading-tight tracking-tight text-negro-barbero">
          Horarios de atención
        </h1>
        <p className="mt-1 text-[15px] text-gris-calido-500">Los bloques semanales de cada barbero.</p>

        {cargandoBarberos && (
          <div className="py-12">
            <Loader label="Cargando barberos" />
          </div>
        )}

        {barberos && barberos.length === 0 && (
          <p className="py-8 text-[15px] text-gris-calido-700">
            Primero agrega un barbero en la pestaña "Barberos".
          </p>
        )}

        {barberos && barberos.length > 0 && (
          <>
            <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              {barberos.map((barbero) => (
                <button
                  key={barbero.id}
                  type="button"
                  onClick={() => setBarberoId(barbero.id)}
                  aria-pressed={barberoId === barbero.id}
                  className={`min-h-11 shrink-0 rounded-full border px-4 text-[15px] font-medium transition-colors ${
                    barberoId === barbero.id
                      ? 'border-negro-barbero bg-negro-barbero text-hueso'
                      : 'border-gris-calido-200 bg-white text-gris-calido-700'
                  }`}
                >
                  {barbero.nombre}
                </button>
              ))}
            </div>

            <h2 className={`${ETIQUETA_SECCION} mt-7`}>Semana</h2>
            {isLoading && (
              <div className="py-12">
                <Loader label="Cargando horarios" />
              </div>
            )}
            {isError && (
              <p role="alert" className="py-4 text-[15px] text-red-700">
                No pudimos cargar los horarios. Recarga la página o intenta más tarde.
              </p>
            )}
            {horarios && (
              <div className="divide-y divide-gris-calido-100 overflow-hidden rounded-2xl border border-gris-calido-200 bg-white">
                {horarios.length === 0 && (
                  <p className="px-4 py-4 text-[15px] text-gris-calido-500">
                    Este barbero todavía no tiene horarios cargados.
                  </p>
                )}
                {horarios.map((horario) => (
                  <FilaHorario
                    key={horario.id}
                    horario={horario}
                    onGuardar={(cambios) => actualizarHorario.mutateAsync({ id: horario.id, cambios })}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setHojaNuevoAbierta(true)}
                  className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-base font-medium text-cobre-texto active:bg-gris-calido-100"
                >
                  <span aria-hidden="true" className="text-xl leading-none">
                    +
                  </span>
                  Nuevo bloque
                </button>
              </div>
            )}

            {barberoActivo && (
              <>
                <h2 className={`${ETIQUETA_SECCION} mt-7`}>Reservas</h2>
                <SelectorIntervaloReserva
                  barbero={barberoActivo}
                  onGuardar={(valor) =>
                    actualizarBarbero.mutateAsync({
                      id: barberoActivo.id,
                      cambios: { intervalo_reserva_minutos: valor },
                    })
                  }
                />
                <h2 className={`${ETIQUETA_SECCION} mt-7`}>Días puntuales</h2>
                <ExcepcionesHorario barberoId={barberoActivo.id} />
              </>
            )}

            <HojaNuevoBloque
              abierto={hojaNuevoAbierta}
              onCerrar={() => setHojaNuevoAbierta(false)}
              nuevo={nuevo}
              setNuevo={setNuevo}
              onSubmit={agregarHorario}
              creando={crearHorario.isPending}
              error={errorEnvio}
            />
          </>
        )}
      </div>
    )
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

          {barberoActivo && (
            <div className="mt-6 flex flex-col gap-4">
              <SelectorIntervaloReserva
                barbero={barberoActivo}
                onGuardar={(valor) =>
                  actualizarBarbero.mutateAsync({
                    id: barberoActivo.id,
                    cambios: { intervalo_reserva_minutos: valor },
                  })
                }
              />
              <ExcepcionesHorario barberoId={barberoActivo.id} />
            </div>
          )}

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
              <div className="flex flex-col gap-4">
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

          <div className="mt-8">
            <span className="versalitas text-xs text-cobre">— Nuevo bloque de horario</span>
            <form
              onSubmit={agregarHorario}
              className="mt-3 rounded-lg border border-dashed border-cobre/40 bg-cobre/5 p-5"
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-[1fr_8rem_8rem_auto] md:items-end">
                <label className="col-span-2 flex flex-col gap-1 md:col-span-1">
                  <span className="versalitas text-xs text-gris-calido-500">Día</span>
                  <select
                    name="dia_semana"
                    value={nuevo.dia_semana}
                    onChange={(e) => setNuevo((n) => ({ ...n, dia_semana: e.target.value }))}
                    className="min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
                  >
                    {DIAS.map((dia, indice) => (
                      <option key={dia} value={indice}>
                        {dia}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="versalitas text-xs text-gris-calido-500">Desde</span>
                  <input
                    type="time"
                    name="hora_inicio"
                    value={nuevo.hora_inicio}
                    onChange={(e) => setNuevo((n) => ({ ...n, hora_inicio: e.target.value }))}
                    className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="versalitas text-xs text-gris-calido-500">Hasta</span>
                  <input
                    type="time"
                    name="hora_fin"
                    value={nuevo.hora_fin}
                    onChange={(e) => setNuevo((n) => ({ ...n, hora_fin: e.target.value }))}
                    className="numeros-tabulares min-h-11 border-b border-gris-calido-200 bg-transparent py-1 text-negro-barbero outline-none transition-colors focus:border-cobre"
                  />
                </label>
                <Button as="button" type="submit" disabled={crearHorario.isPending} className="h-fit">
                  {crearHorario.isPending ? 'Creando…' : 'Agregar'}
                </Button>
              </div>
              {errorEnvio && (
                <p role="alert" className="mt-3 text-sm text-red-700">
                  {errorEnvio}
                </p>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  )
}
