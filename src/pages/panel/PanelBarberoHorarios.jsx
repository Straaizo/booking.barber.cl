import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../../components/common/Loader'
import { Button } from '../../components/common/Button'
import { useHorariosDeBarbero, useCrearHorario, useActualizarHorario } from './hooks/useHorariosAdmin'
import { useBarberosAdmin, useActualizarBarbero } from './hooks/useBarberosAdmin'
import { useIsMobile } from '../../hooks/useIsMobile'
import { FilaHorario, HojaNuevoBloque } from './components/FilaHorario'
import { SelectorIntervaloReserva } from './components/SelectorIntervaloReserva'
import { ExcepcionesHorario } from './components/ExcepcionesHorario'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const ETIQUETA_SECCION = 'mb-2 block px-1 font-sans! text-[13px] font-semibold uppercase tracking-[0.06em] text-gris-calido-500'

export function PanelBarberoHorarios() {
  const { perfil } = useAuth()
  const { data: horarios, isLoading, isError } = useHorariosDeBarbero(perfil.barbero_id)
  const crearHorario = useCrearHorario(perfil.barbero_id)
  const actualizarHorario = useActualizarHorario(perfil.barbero_id)
  const { data: barberos } = useBarberosAdmin(perfil.barberia_id)
  const actualizarBarbero = useActualizarBarbero(perfil.barberia_id)
  const barbero = barberos?.find((b) => b.id === perfil.barbero_id)

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

  // En el celular: misma lista compacta y hojas inferiores que el panel del dueño.
  if (esMovil) {
    return (
      <div>
        <h1 className="font-display text-[28px] font-light leading-tight tracking-tight text-negro-barbero">
          Mis horarios
        </h1>
        <p className="mt-1 text-[15px] text-gris-calido-500">Solo se ofrecen horas dentro de tus bloques.</p>

        <h2 className={`${ETIQUETA_SECCION} mt-7`}>Semana</h2>
        {isLoading && (
          <div className="py-12">
            <Loader label="Cargando horarios" />
          </div>
        )}
        {isError && (
          <p role="alert" className="py-4 text-[15px] text-red-700">
            No pudimos cargar tus horarios. Recarga la página o intenta más tarde.
          </p>
        )}
        {horarios && (
          <div className="divide-y divide-gris-calido-100 overflow-hidden rounded-2xl border border-gris-calido-200 bg-white">
            {horarios.length === 0 && (
              <p className="px-4 py-4 text-[15px] text-gris-calido-500">Todavía no tienes horarios cargados.</p>
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

        {barbero && (
          <>
            <h2 className={`${ETIQUETA_SECCION} mt-7`}>Reservas</h2>
            <SelectorIntervaloReserva
              barbero={barbero}
              onGuardar={(valor) =>
                actualizarBarbero.mutateAsync({
                  id: barbero.id,
                  cambios: { intervalo_reserva_minutos: valor },
                })
              }
            />
            <h2 className={`${ETIQUETA_SECCION} mt-7`}>Días puntuales</h2>
            <ExcepcionesHorario barberoId={barbero.id} />
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
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
        Mis horarios
      </h1>
      <p className="mt-2 max-w-lg text-sm text-gris-calido-700">
        Define tus bloques de horario por día. Solo se ofrecen horas dentro de estos bloques a
        quien te reserve.
      </p>

      {barbero && (
        <div className="mt-6 flex flex-col gap-4">
          <SelectorIntervaloReserva
            barbero={barbero}
            onGuardar={(valor) =>
              actualizarBarbero.mutateAsync({
                id: barbero.id,
                cambios: { intervalo_reserva_minutos: valor },
              })
            }
          />
          <ExcepcionesHorario barberoId={barbero.id} />
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
            No pudimos cargar tus horarios. Recarga la página o intenta más tarde.
          </p>
        )}

        {horarios && horarios.length === 0 && (
          <p className="py-8 text-sm text-gris-calido-700">Todavía no tienes horarios cargados.</p>
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
    </div>
  )
}
