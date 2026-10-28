import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../../components/common/Loader'
import { IconoCalendario } from '../../components/panel/IconosNav'
import { diaSantiagoComoFechaLocal, hoyEnSantiago } from '../../utils/horaLocal'
import { useReservasDeBarbero, useRealtimeReservas } from './hooks/useReservasBandeja'
import { useAvanceMetaBarberia, useMetasMes, useResumenMes } from './hooks/useResumen'

const FORMATO_MES = new Intl.DateTimeFormat('es-CL', { month: 'long' })

function formatoHora(iso) {
  return new Date(iso).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Santiago',
  })
}

function saludo() {
  const hora = Number(
    new Date().toLocaleTimeString('es-CL', { hour: '2-digit', hour12: false, timeZone: 'America/Santiago' })
  )
  if (hora < 12) return 'Buenos días'
  if (hora < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

function variacion(actual, anterior) {
  if (!anterior) return null
  return Math.round(((actual - anterior) / anterior) * 100)
}

// Meta del mes en porcentaje y ritmo — nunca montos: el barbero ve cuánto
// avanzó, no cuánto dinero representa. El ritmo compara ese avance con la
// parte del mes que ya pasó (a mitad de mes, ir en 50% o más es ir al día).
// Usa su meta propia si el dueño le asignó una; si no, la de la barbería.
function TarjetaMeta({ porcentaje, deEquipo, mes }) {
  const nombre = FORMATO_MES.format(mes)
  const titulo = deEquipo ? `Meta de la barbería · ${nombre}` : `Tu meta de ${nombre}`

  if (porcentaje == null) {
    return (
      <section className="rounded-2xl bg-negro-barbero p-5 text-hueso md:max-w-xl">
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-gris-calido-400">Tu meta de {nombre}</p>
        <p className="mt-2 text-[17px] font-semibold">Aún no hay meta para este mes</p>
        <p className="mt-1 text-[15px] text-gris-calido-200">
          Cuando el dueño de la barbería la defina, aquí verás cuánto llevas y si vas al día.
        </p>
      </section>
    )
  }

  const hoy = hoyEnSantiago()
  const diasDelMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const esperado = Math.round((hoy.getDate() / diasDelMes) * 100)
  const diferencia = porcentaje - esperado

  let ritmo
  if (porcentaje >= 100) ritmo = { texto: '🎉 ¡Meta cumplida!', clase: 'text-hueso' }
  else if (diferencia >= 0)
    ritmo = {
      texto: diferencia >= 10 ? (deEquipo ? 'Vamos adelantados ✓' : 'Vas adelantado ✓') : deEquipo ? 'Vamos al día ✓' : 'Vas al día ✓',
      clase: 'text-[#9fd3b1]',
    }
  else {
    const atraso = Math.abs(diferencia)
    ritmo = { texto: deEquipo ? `Vamos ${atraso}% atrasados` : `Vas ${atraso}% atrasado`, clase: 'text-cobre-claro' }
  }

  return (
    <section className="rounded-2xl bg-negro-barbero p-5 text-hueso shadow-lg md:max-w-xl">
      <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-gris-calido-400">{titulo}</p>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <p className="text-[15px] text-gris-calido-200">
          {deEquipo ? 'Vamos en' : 'Vas en'} <strong className="numeros-tabulares text-[34px] font-semibold text-hueso">{porcentaje}%</strong>
        </p>
        <p className={`text-[15px] font-semibold ${ritmo.clase}`}>{ritmo.texto}</p>
      </div>
      <div className="relative mt-3">
        <div className="h-3 overflow-hidden rounded-full bg-white/15">
          <motion.div
            className={`h-full rounded-full ${porcentaje >= 100 ? 'bg-verde-barberia' : 'bg-cobre'}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, porcentaje)}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </div>
        {porcentaje < 100 && (
          <span
            className="absolute -top-1 h-5 w-0.5 rounded-full bg-hueso"
            style={{ left: `${esperado}%` }}
            aria-hidden="true"
          />
        )}
      </div>
      {porcentaje < 100 && (
        <p className="mt-2 text-[13px] text-gris-calido-400">
          La marca blanca es donde {deEquipo ? 'deberíamos' : 'deberías'} ir hoy ({esperado}%).
        </p>
      )}
    </section>
  )
}

function Cifra({ etiqueta, valor, delta, inversa = false }) {
  let detalle = <span className="text-gris-calido-400">—</span>
  if (delta != null) {
    const bueno = inversa ? delta <= 0 : delta >= 0
    detalle = (
      <span className={bueno ? 'text-verde-barberia' : 'text-red-700'}>
        {delta === 0 ? '=' : delta > 0 ? '▲' : '▼'} {Math.abs(delta)}%
      </span>
    )
  }
  return (
    <div className="rounded-2xl border border-gris-calido-200 bg-white p-3.5 text-center">
      <p className="numeros-tabulares text-[24px] font-semibold leading-tight text-negro-barbero">{valor}</p>
      <p className="text-[13px] text-gris-calido-500">{etiqueta}</p>
      <p className="mt-0.5 text-[12px] font-semibold">{detalle}</p>
    </div>
  )
}

export function PanelBarberoInicio() {
  const { perfil } = useAuth()
  const hoy = hoyEnSantiago()
  const mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)

  const { data: reservas, isLoading } = useReservasDeBarbero(perfil.barbero_id)
  const { data: resumen } = useResumenMes(mes)
  const { data: resumenAnterior } = useResumenMes(mesAnterior)
  const { data: metas } = useMetasMes(mes)
  useRealtimeReservas({ barberoId: perfil.barbero_id })

  const propio = resumen?.find((f) => f.barbero_id === perfil.barbero_id)
  const propioAnterior = resumenAnterior?.find((f) => f.barbero_id === perfil.barbero_id)
  const meta = metas?.find((m) => m.barbero_id === perfil.barbero_id)?.meta_ingresos_clp
  const { data: avanceEquipo } = useAvanceMetaBarberia(mes, metas !== undefined && !meta)
  const porcentajePropio = meta ? Math.round(((propio?.ingresos_agendados ?? 0) / meta) * 100) : null

  const { deHoy, proxima, sinConfirmar } = useMemo(() => {
    const hoy = hoyEnSantiago()
    const mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const confirmadas = (reservas ?? []).filter((r) => r.estado === 'confirmada')
    const ahora = new Date()
    const delDia = confirmadas
      .filter((r) => diaSantiagoComoFechaLocal(new Date(r.fecha_hora)).getTime() === hoy.getTime())
      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
    return {
      deHoy: delDia,
      proxima: confirmadas
        .filter((r) => new Date(r.fecha_hora_fin ?? r.fecha_hora) > ahora)
        .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))[0],
      // Solo las de este mes: las de meses anteriores ya quedaron en el
      // historial y no tiene sentido seguir recordándolas acá.
      sinConfirmar: confirmadas.filter((r) => {
        const dia = diaSantiagoComoFechaLocal(new Date(r.fecha_hora))
        return dia < hoy && dia >= mes
      }).length,
    }
  }, [reservas])

  const efectivas = propio ? propio.reservas - propio.canceladas : 0
  const efectivasAnterior = propioAnterior ? propioAnterior.reservas - propioAnterior.canceladas : 0
  const pasadas = propio ? propio.atendidas + propio.sin_confirmar : 0
  const asistencia = pasadas ? Math.round((propio.atendidas / pasadas) * 100) : null
  const proximaEsHoy = proxima && diaSantiagoComoFechaLocal(new Date(proxima.fecha_hora)).getTime() === hoy.getTime()
  const nombrePila = (perfil?.nombre ?? '').split(' ')[0]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[28px]/[1.15] font-light tracking-tight text-negro-barbero md:text-3xl">
          {saludo()}, {nombrePila}
        </h1>
        <p className="mt-1 text-[15px] text-gris-calido-500 md:text-sm">
          {deHoy.length === 0
            ? 'Hoy no tienes reservas.'
            : `Hoy tienes ${deHoy.length} ${deHoy.length === 1 ? 'reserva' : 'reservas'}.`}
        </p>
      </div>

      <TarjetaMeta
        porcentaje={meta ? porcentajePropio : (avanceEquipo ?? null)}
        deEquipo={!meta}
        mes={mes}
      />

      {sinConfirmar > 0 && (
        <Link
          to="/panel/barbero/reservas"
          state={{ vista: 'historial' }}
          className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-[15px] text-amber-800 active:bg-amber-100 md:max-w-xl"
        >
          <span>
            Tienes <strong>{sinConfirmar}</strong> {sinConfirmar === 1 ? 'reserva pasada' : 'reservas pasadas'} sin confirmar
            asistencia.
          </span>
          <span aria-hidden="true" className="text-xl">›</span>
        </Link>
      )}

      <section className="md:max-w-xl">
        <h2 className="mb-2 px-1 font-sans! text-[13px] font-semibold uppercase tracking-[0.06em] text-gris-calido-500">
          Tu próxima reserva
        </h2>
        {isLoading ? (
          <div className="py-6">
            <Loader label="Cargando" />
          </div>
        ) : proxima ? (
          <Link
            to="/panel/barbero/reservas"
            className="flex items-center gap-4 rounded-2xl border border-gris-calido-200 bg-white p-4 active:bg-gris-calido-100"
          >
            <div className="w-16 shrink-0">
              <p className="numeros-tabulares text-[22px] font-semibold leading-none text-negro-barbero">
                {formatoHora(proxima.fecha_hora)}
              </p>
              <p className="mt-1 text-[13px] text-gris-calido-500">
                {proximaEsHoy
                  ? 'Hoy'
                  : new Date(proxima.fecha_hora).toLocaleDateString('es-CL', {
                      weekday: 'short',
                      day: 'numeric',
                      timeZone: 'America/Santiago',
                    })}
              </p>
            </div>
            <div className="min-w-0 flex-1 border-l border-gris-calido-200 pl-4">
              <p className="truncate text-[17px] font-semibold text-negro-barbero">{proxima.cliente_nombre}</p>
              <p className="truncate text-[15px] text-gris-calido-700">{proxima.servicios?.nombre}</p>
            </div>
            <span aria-hidden="true" className="text-xl text-gris-calido-400">›</span>
          </Link>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gris-calido-200 bg-white/60 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gris-calido-100 text-gris-calido-500">
              <IconoCalendario className="h-5 w-5" />
            </span>
            <p className="text-[15px] text-gris-calido-500">No tienes reservas próximas por ahora.</p>
          </div>
        )}
      </section>

      <section className="md:max-w-xl">
        <h2 className="mb-2 px-1 font-sans! text-[13px] font-semibold uppercase tracking-[0.06em] text-gris-calido-500">
          Tu mes · vs. {FORMATO_MES.format(mesAnterior)}
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          <Cifra
            etiqueta="Reservas"
            valor={efectivas}
            delta={propioAnterior ? variacion(efectivas, efectivasAnterior) : null}
          />
          <Cifra
            etiqueta="Atendidas"
            valor={propio?.atendidas ?? 0}
            delta={propioAnterior ? variacion(propio?.atendidas ?? 0, propioAnterior.atendidas) : null}
          />
          <Cifra
            etiqueta="Canceladas"
            valor={propio?.canceladas ?? 0}
            delta={propioAnterior ? variacion(propio?.canceladas ?? 0, propioAnterior.canceladas) : null}
            inversa
          />
        </div>
        {asistencia != null && (
          <p className="mt-2 px-1 text-[13px] text-gris-calido-500">
            Confirmaste la asistencia del {asistencia}% de tus reservas pasadas.
          </p>
        )}
      </section>
    </div>
  )
}
