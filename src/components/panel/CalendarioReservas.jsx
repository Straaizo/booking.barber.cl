import { useEffect, useMemo, useRef, useState } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'
import { horaMinutoEnSantiago, claveFechaSantiago, hoyEnSantiago, inicioDeSemanaLunes } from '../../utils/horaLocal'

// Línea de tiempo por hora con las reservas como bloques reales en su
// horario — el mismo patrón que usan Google Calendar, Fresha, Square
// Appointments o Cal.com para agendas de reserva, en vez de una grilla de
// mes con solo un número por día. La ventana de horas es fija (no la
// atención real de la barbería, que varía por barbero) — de sobra para
// cualquier jornada real, sin tener que ir a buscar horarios de atención
// para esto. La altura visible tiene techo (`ALTO_VISIBLE`) con scroll
// interno — sin esto, un día casi vacío deja un card gigante de puro blanco,
// muy por encima de lo que ocupa la lista al lado.
const HORA_APERTURA = 8
const HORA_CIERRE = 21
const PX_POR_HORA = 52
const ALTO_VISIBLE = 440

const DIAS_SEMANA_CORTO = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

// Paleta rotativa por barbero (para distinguir de un vistazo quién atiende
// cada bloque cuando hay más de uno) — reusa los tokens de marca ya
// definidos en index.css, nada de colores nuevos sueltos.
const PALETA_BARBERO = [
  { bg: 'bg-cobre/15', borde: 'border-cobre', texto: 'text-cobre-texto' },
  { bg: 'bg-verde-barberia/15', borde: 'border-verde-barberia', texto: 'text-verde-barberia' },
  { bg: 'bg-laton/20', borde: 'border-laton', texto: 'text-gris-calido-700' },
  { bg: 'bg-negro-barbero/10', borde: 'border-negro-barbero/40', texto: 'text-negro-barbero' },
]

function mismoDia(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// Los días de la grilla (semana visible, selección) son simples marcadores
// Y/M/D sin huso real — se comparan entre sí con getters locales de
// siempre. Las reservas SÍ son instantes reales y necesitan pasar por
// `claveFechaSantiago` (huso fijo de Chile) antes de comparar contra estos
// marcadores — mezclarlos sería el mismo bug que el resto de este archivo
// evita a propósito (ver utils/horaLocal.js).
function claveFechaGrilla(fecha) {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function minutosDesdeApertura(fecha) {
  const { hora, minuto } = horaMinutoEnSantiago(fecha)
  return (hora - HORA_APERTURA) * 60 + minuto
}

// Asigna cada reserva a un "carril" (0, 1, 2...) para que dos que se cruzan
// en el tiempo (dos barberos atendiendo a la misma hora) queden lado a lado
// en vez de superpuestas — mismo algoritmo que usa cualquier calendario real
// (Google Calendar incluido) para el mismo problema.
function ubicarEnCarriles(reservasDelDia) {
  const ordenadas = [...reservasDelDia].sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
  const carriles = [] // fin (Date) de la última reserva puesta en cada carril
  const ubicadas = ordenadas.map((reserva) => {
    const inicio = new Date(reserva.fecha_hora)
    const fin = new Date(reserva.fecha_hora_fin)
    let carril = carriles.findIndex((finCarril) => finCarril <= inicio)
    if (carril === -1) {
      carril = carriles.length
      carriles.push(fin)
    } else {
      carriles[carril] = fin
    }
    return { reserva, carril }
  })
  const totalCarriles = carriles.length || 1
  return ubicadas.map(({ reserva, carril }) => ({ reserva, carril, totalCarriles }))
}

function BloqueReserva({ reserva, carril, totalCarriles, onAbrir }) {
  const inicio = new Date(reserva.fecha_hora)
  const fin = new Date(reserva.fecha_hora_fin)
  const top = (minutosDesdeApertura(inicio) / 60) * PX_POR_HORA
  const alto = Math.max(((fin - inicio) / 3_600_000) * PX_POR_HORA - 3, 24)
  const anchoPorcentaje = 100 / totalCarriles
  const colores = PALETA_BARBERO[(reserva.barbero_id ?? 0) % PALETA_BARBERO.length]
  const esCorta = alto < 42

  return (
    <button
      type="button"
      onClick={() => onAbrir(reserva)}
      style={{
        top: `${top}px`,
        height: `${alto}px`,
        left: `calc(${carril * anchoPorcentaje}% + 2px)`,
        width: `calc(${anchoPorcentaje}% - 4px)`,
      }}
      className={`absolute z-[1] overflow-hidden rounded-md border-l-[3px] px-2 py-1 text-left shadow-sm transition-shadow hover:z-10 hover:shadow-md ${colores.bg} ${colores.borde}`}
    >
      <span className={`versalitas numeros-tabulares block truncate text-[10px] leading-tight ${colores.texto}`}>
        {inicio.toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'America/Santiago',
        })}
      </span>
      <span className="block truncate text-xs font-semibold leading-tight text-negro-barbero">
        {reserva.cliente_nombre}
      </span>
      {!esCorta && (
        <span className="block truncate text-[10px] leading-tight text-gris-calido-500">
          {reserva.servicios?.nombre}
        </span>
      )}
    </button>
  )
}

// Línea roja de "ahora" — solo en la columna de hoy, y solo si el instante
// actual cae dentro de la ventana de horas visible. El mismo detalle que
// hace que Google Calendar/Fresha se sientan "vivos" en vez de una tabla
// estática.
function LineaAhora() {
  const [minutos, setMinutos] = useState(() => minutosDesdeApertura(new Date()))

  useEffect(() => {
    const id = setInterval(() => setMinutos(minutosDesdeApertura(new Date())), 60_000)
    return () => clearInterval(id)
  }, [])

  if (minutos < 0 || minutos > (HORA_CIERRE - HORA_APERTURA) * 60) return null

  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 z-[2] flex items-center"
      style={{ top: `${(minutos / 60) * PX_POR_HORA}px` }}
    >
      <div className="h-1.5 w-1.5 shrink-0 -translate-x-1/2 rounded-full bg-red-600" />
      <div className="h-px flex-1 bg-red-600" />
    </div>
  )
}

// Cabecera de un día (botón con día de semana + número) — vive en su PROPIA
// fila "sticky", separada del cuerpo con las horas. Antes cada día tenía su
// propio botón sticky Y la columna de horas tenía un espaciador sticky
// aparte, los dos "adivinando" la misma altura (52px) — en la práctica el
// botón real medía otra cosa (texto + círculo + padding), así que quedaban
// desalineados y las reservas se veían varias horas más abajo de la línea
// que les correspondía. Con una sola fila de cabecera compartida es
// imposible que las alturas no coincidan: es literalmente la misma fila.
function CabeceraDia({ fecha, esSeleccionado, esHoy, onSeleccionarDia }) {
  return (
    <button
      type="button"
      onClick={() => onSeleccionarDia(fecha)}
      className={`versalitas flex min-w-0 flex-1 flex-col items-center gap-0.5 border-b border-gris-calido-200 py-3 text-xs transition-colors ${
        esSeleccionado ? 'bg-cobre text-hueso' : esHoy ? 'bg-cobre/5 text-cobre-texto' : 'bg-white text-gris-calido-600 hover:bg-cobre/10'
      }`}
    >
      <span>{DIAS_SEMANA_CORTO[fecha.getDay() === 0 ? 6 : fecha.getDay() - 1]}</span>
      <span
        className={`numeros-tabulares flex h-6 w-6 items-center justify-center rounded-full text-sm normal-case ${
          esHoy && !esSeleccionado ? 'border border-cobre/60 font-semibold' : ''
        }`}
      >
        {fecha.getDate()}
      </span>
    </button>
  )
}

function CuerpoDia({ reservasDelDia, esHoy, onAbrirReserva }) {
  const bloques = useMemo(() => ubicarEnCarriles(reservasDelDia), [reservasDelDia])
  const horas = HORA_CIERRE - HORA_APERTURA

  return (
    <div
      className={`relative min-w-0 flex-1 ${esHoy ? 'bg-cobre/[0.03]' : ''}`}
      style={{ height: `${horas * PX_POR_HORA}px` }}
    >
      {Array.from({ length: horas }, (_, i) => (
        <div
          key={i}
          className="absolute inset-x-0 border-t border-gris-calido-100"
          style={{ top: `${i * PX_POR_HORA}px` }}
        />
      ))}
      {esHoy && <LineaAhora />}
      {bloques.map(({ reserva, carril, totalCarriles }) => (
        <BloqueReserva key={reserva.id} reserva={reserva} carril={carril} totalCarriles={totalCarriles} onAbrir={onAbrirReserva} />
      ))}
    </div>
  )
}

// `diasAMostrar`: 7 en escritorio (semana completa) — 1 en mobile (el día
// elegido nomás, con una tira de fechas arriba para cambiarlo sin abrir un
// selector aparte).
export function CalendarioReservas({ reservas, diaSeleccionado, onSeleccionarDia, onAbrirReserva }) {
  const esMobile = useIsMobile(1024)
  const [semanaVisible, setSemanaVisible] = useState(() => inicioDeSemanaLunes(new Date()))
  const contenedorRef = useRef(null)

  const reservasPorDia = useMemo(() => {
    const mapa = new Map()
    for (const r of reservas) {
      if (r.estado !== 'confirmada') continue
      const clave = claveFechaSantiago(new Date(r.fecha_hora))
      if (!mapa.has(clave)) mapa.set(clave, [])
      mapa.get(clave).push(r)
    }
    return mapa
  }, [reservas])

  const diasDeLaSemana = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(semanaVisible.getFullYear(), semanaVisible.getMonth(), semanaVisible.getDate() + i)),
    [semanaVisible]
  )

  const hoy = hoyEnSantiago()
  const diasAMostrar = esMobile ? [diaSeleccionado] : diasDeLaSemana

  // Arranca centrado en la hora actual (si hoy está en la semana visible) o
  // si no, mostrando desde un poco antes del mediodía — nunca desde las
  // 08:00 en punto, que casi siempre es la franja menos usada del día.
  useEffect(() => {
    const el = contenedorRef.current
    if (!el) return
    const minutosAhora = minutosDesdeApertura(new Date())
    const minutosBase = minutosAhora >= 0 && minutosAhora <= (HORA_CIERRE - HORA_APERTURA) * 60 ? minutosAhora : 240
    el.scrollTop = Math.max((minutosBase / 60) * PX_POR_HORA - ALTO_VISIBLE / 2.5, 0)
  }, [semanaVisible, esMobile])

  function cambiarSemana(delta) {
    setSemanaVisible((s) => new Date(s.getFullYear(), s.getMonth(), s.getDate() + delta * 7))
  }
  function cambiarDiaMobile(delta) {
    const nuevo = new Date(diaSeleccionado)
    nuevo.setDate(nuevo.getDate() + delta)
    onSeleccionarDia(nuevo)
  }
  function irAHoy() {
    setSemanaVisible(inicioDeSemanaLunes(hoy))
    onSeleccionarDia(hoy)
  }

  const rangoTexto = esMobile
    ? diaSeleccionado.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })
    : `${diasDeLaSemana[0].toLocaleDateString('es-CL', { day: 'numeric', month: diasDeLaSemana[0].getMonth() === diasDeLaSemana[6].getMonth() ? undefined : 'short' })} – ${diasDeLaSemana[6].toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}`

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => (esMobile ? cambiarDiaMobile(-1) : cambiarSemana(-1))}
          aria-label={esMobile ? 'Día anterior' : 'Semana anterior'}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-gris-calido-500 transition-colors hover:bg-cobre/10 hover:text-cobre-texto"
        >
          ‹
        </button>
        {/* Sin `font-display`: la serif fina se pierde en un rótulo chico de
            navegación — la tipografía normal del panel se lee más clara acá. */}
        <span className="truncate text-base font-semibold capitalize tracking-tight text-negro-barbero md:text-lg">
          {rangoTexto}
        </span>
        <button
          type="button"
          onClick={() => (esMobile ? cambiarDiaMobile(1) : cambiarSemana(1))}
          aria-label={esMobile ? 'Día siguiente' : 'Semana siguiente'}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-gris-calido-500 transition-colors hover:bg-cobre/10 hover:text-cobre-texto"
        >
          ›
        </button>
        <button
          type="button"
          onClick={irAHoy}
          className="versalitas ml-1 shrink-0 rounded-lg border border-gris-calido-200 px-3 py-2 text-xs text-gris-calido-600 transition-colors hover:border-cobre/50 hover:text-cobre-texto"
        >
          Hoy
        </button>
      </div>

      <div
        ref={contenedorRef}
        data-testid="calendario-scroll"
        className="mt-4 overflow-auto rounded-md border border-gris-calido-100"
        style={{ maxHeight: `${ALTO_VISIBLE}px` }}
      >
        {/* Una sola fila de cabecera "sticky" — el espacio para la columna
            de horas es un hueco vacío DENTRO de esta misma fila, no una
            copia aparte adivinando la misma altura (ver el porqué en
            CabeceraDia). */}
        <div className="sticky top-0 z-20 flex bg-white">
          <div className="w-14 shrink-0 border-b border-gris-calido-200 bg-white" />
          <div className="flex min-w-0 flex-1 divide-x divide-gris-calido-100">
            {diasAMostrar.map((fecha) => (
              <CabeceraDia
                key={claveFechaGrilla(fecha)}
                fecha={fecha}
                esSeleccionado={mismoDia(fecha, diaSeleccionado)}
                esHoy={mismoDia(fecha, hoy)}
                onSeleccionarDia={onSeleccionarDia}
              />
            ))}
          </div>
        </div>

        <div className="flex">
          <div className="sticky left-0 z-10 flex w-14 shrink-0 flex-col bg-white">
            {Array.from({ length: HORA_CIERRE - HORA_APERTURA }, (_, i) => (
              <div
                key={i}
                style={{ height: `${PX_POR_HORA}px` }}
                className="versalitas numeros-tabulares flex items-start justify-end pr-2 text-[10px] text-gris-calido-400"
              >
                {/* El texto queda en el flujo normal (aporta ancho real a la
                    columna) — el `translate` solo lo corre visualmente para
                    que quede centrado sobre la línea de la hora, sin sacarlo
                    del cálculo de ancho como pasaría con `position: absolute`. */}
                <span className="-translate-y-1/2">{String(HORA_APERTURA + i).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 divide-x divide-gris-calido-100">
            {diasAMostrar.map((fecha) => (
              <CuerpoDia
                key={claveFechaGrilla(fecha)}
                reservasDelDia={reservasPorDia.get(claveFechaGrilla(fecha)) ?? []}
                esHoy={mismoDia(fecha, hoy)}
                onAbrirReserva={onAbrirReserva}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
