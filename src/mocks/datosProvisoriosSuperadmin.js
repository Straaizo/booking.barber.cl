import { ESTADO_ACTIVO, ESTADO_PENDIENTE_ACTIVACION } from '../utils/estados'
import { normalizarPersonalizacion } from '../utils/personalizacion'
import { ROL_BARBERO } from '../utils/roles'
import { generarUsuarioDesdeNombre } from '../utils/usuarios'

// TEMPORAL: mientras no haya un Supabase real conectado (VITE_SUPABASE_URL
// en `.env` sigue siendo el placeholder de ejemplo), el panel superadmin y la
// página pública de barbería leen/escriben acá, respaldado en localStorage,
// en vez de contra la base real. Se autodesactiva solo — apenas `.env` tenga
// una URL real, `HAY_BACKEND_REAL` pasa a `true` y cada hook que lo consulta
// vuelve a usar su query original de Supabase sin que haya que tocar nada.
export const HAY_BACKEND_REAL = !String(import.meta.env.VITE_SUPABASE_URL ?? '').includes('tu-proyecto')

const CLAVE_STORAGE = 'booking_barber_datos_provisorios_v1'

export const ID_BARBERIA_PROVISORIA = 'prov-barberia-1'
export const ID_USUARIO_PROVISORIO = 'prov-usuario-1'

// Credenciales del dueño en modo provisorio — fijas (no generadas) para que
// siempre se pueda entrar a probar sin tener que ir a mirar el localStorage.
// Se autodesactivan junto con el resto de lo provisorio en cuanto haya un
// Supabase real conectado.
export const ADMIN_PROVISORIO = { usuario: 'demo', password_provisoria: 'demo1234' }

const PLANES_SEED = [
  { id: 1, nombre: 'Solo', precio_clp: 5000, max_barberos: 1, orden: 1 },
  { id: 2, nombre: 'Equipo', precio_clp: 6000, max_barberos: 3, orden: 2 },
  { id: 3, nombre: 'Estudio', precio_clp: 7000, max_barberos: 99, orden: 3 },
]

const BARBERIAS_SEED = [
  {
    id: ID_BARBERIA_PROVISORIA,
    nombre: 'Barbería Don Manuel',
    slug: 'don-manuel',
    estado_id: ESTADO_ACTIVO,
    plan_id: 2,
    telefono_whatsapp: '+56911112222',
    email_contacto: 'contacto@donmanuel.cl',
    direccion: 'Av. Irarrázaval 2140, Ñuñoa',
    logo_url: null,
    personalizacion: {
      color_primario: '#7a4324',
      color_header: null,
      fuente_display: 'fraunces',
      eslogan: 'Corte de barrio, oficio de siempre',
      descripcion:
        'Barbería de prueba, cargada para revisar cómo se ve el panel y la página pública mientras no hay Supabase real conectado.',
      banner_url: null,
      secciones: [],
    },
    // `barbero_id: null` = servicio compartido de la barbería (lo que ve
    // cualquier barbero por defecto). Un servicio con `barbero_id` puesto es
    // del catálogo PROPIO de ese barbero — solo existe si el dueño le activó
    // "servicios propios" (ver `activarCatalogoPropioProvisorio` más abajo).
    servicios: [
      { id: 'prov-servicio-1', nombre: 'Corte clásico', duracion_minutos: 30, precio_clp: 8000, precio_oferta: null, oferta_activa: false, oferta_vence: null, activo: true, barbero_id: null },
      { id: 'prov-servicio-2', nombre: 'Corte + Barba', duracion_minutos: 45, precio_clp: 13000, precio_oferta: 11000, oferta_activa: true, oferta_vence: null, activo: true, barbero_id: null },
      { id: 'prov-servicio-3', nombre: 'Afeitado a la antigua', duracion_minutos: 25, precio_clp: 7500, precio_oferta: null, oferta_activa: false, oferta_vence: null, activo: true, barbero_id: null },
    ],
    barberos: [
      { id: 'prov-barbero-1', nombre: 'Manuel Rojas', activo: true, foto_url: null, especialidad: 'Cortes clásicos y degradados', usa_catalogo_propio: false, intervalo_reserva_minutos: 30, usuario: 'mrojas', password_provisoria: 'barbero123' },
      { id: 'prov-barbero-2', nombre: 'Ignacio Soto', activo: true, foto_url: null, especialidad: 'Barba y afeitado a la antigua', usa_catalogo_propio: false, intervalo_reserva_minutos: 30, usuario: 'isoto', password_provisoria: 'barbero123' },
    ],
    historial: [],
  },
]

// Lunes a sábado, 10:00–19:00 para los dos barberos de la barbería seed —
// mismo horario estándar que ya usaba la barbería demo (`config/demo.js`),
// para que el asistente de reserva tenga algo que mostrar sin configurar
// nada primero.
function horarioEstandarPara(barberoId) {
  return [1, 2, 3, 4, 5, 6].map((diaSemana) => ({
    id: `prov-horario-${barberoId}-${diaSemana}`,
    barbero_id: barberoId,
    dia_semana: diaSemana,
    hora_inicio: '10:00',
    hora_fin: '19:00',
    activo: true,
  }))
}

const HORARIOS_DISPONIBLES_SEED = [
  ...horarioEstandarPara('prov-barbero-1'),
  ...horarioEstandarPara('prov-barbero-2'),
]

const RESERVAS_SEED = []
const EXCEPCIONES_HORARIO_SEED = []

function leerEstado() {
  try {
    const crudo = localStorage.getItem(CLAVE_STORAGE)
    if (!crudo) throw new Error('sin datos guardados todavía')
    const estado = JSON.parse(crudo)
    // Migración suave para sesiones que guardaron el estado antes de que
    // existieran `horarios_disponibles`/`reservas`/`excepciones_horario` como
    // tablas propias.
    estado.horarios_disponibles = estado.horarios_disponibles ?? HORARIOS_DISPONIBLES_SEED
    estado.reservas = estado.reservas ?? RESERVAS_SEED
    estado.excepciones_horario = estado.excepciones_horario ?? EXCEPCIONES_HORARIO_SEED
    return estado
  } catch {
    const inicial = {
      barberias: BARBERIAS_SEED,
      planes: PLANES_SEED,
      horarios_disponibles: HORARIOS_DISPONIBLES_SEED,
      reservas: RESERVAS_SEED,
      excepciones_horario: EXCEPCIONES_HORARIO_SEED,
    }
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(inicial))
    return inicial
  }
}

function guardarEstado(estado) {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(estado))
}

function idNuevo(prefijo) {
  return `${prefijo}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

export async function listarBarberiasProvisorias() {
  const { barberias, planes } = leerEstado()
  return [...barberias]
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .map((b) => {
      const plan = planes.find((p) => p.id === b.plan_id)
      return {
        id: b.id,
        nombre: b.nombre,
        slug: b.slug,
        estado_id: b.estado_id,
        plan_id: b.plan_id,
        planes: plan ? { nombre: plan.nombre } : null,
      }
    })
}

export async function obtenerBarberiaProvisoria(id) {
  const { barberias, planes } = leerEstado()
  const b = barberias.find((x) => x.id === id)
  if (!b) throw new Error('Barbería provisoria no encontrada: ' + id)
  const plan = planes.find((p) => p.id === b.plan_id)
  return {
    id: b.id,
    nombre: b.nombre,
    slug: b.slug,
    estado_id: b.estado_id,
    plan_id: b.plan_id,
    telefono_whatsapp: b.telefono_whatsapp,
    email_contacto: b.email_contacto,
    direccion: b.direccion,
    planes: plan ? { nombre: plan.nombre, max_barberos: plan.max_barberos } : null,
  }
}

export async function obtenerBarberiaProvisoriaPorSlug(slug) {
  const { barberias } = leerEstado()
  const b = barberias.find((x) => x.slug === slug)
  if (!b) throw new Error('Barbería provisoria no encontrada para el slug: ' + slug)
  const { id, nombre, telefono_whatsapp, email_contacto, direccion, logo_url, estado_id, personalizacion, servicios, barberos } = b
  return {
    id,
    slug,
    nombre,
    telefono_whatsapp,
    email_contacto,
    direccion,
    logo_url,
    estado_id,
    personalizacion: normalizarPersonalizacion(personalizacion),
    servicios,
    barberos,
  }
}

export async function listarPlanesProvisorios() {
  const { planes } = leerEstado()
  return [...planes].sort((a, b) => a.orden - b.orden)
}

export async function slugProvisorioDisponible(slug) {
  const { barberias } = leerEstado()
  return !barberias.some((b) => b.slug === slug)
}

export async function crearBarberiaProvisoria({ nombre, slug, plan_id }) {
  const estado = leerEstado()
  const nueva = {
    id: 'prov-barberia-' + Date.now(),
    nombre,
    slug,
    plan_id,
    estado_id: ESTADO_PENDIENTE_ACTIVACION,
    telefono_whatsapp: '',
    email_contacto: '',
    direccion: '',
    logo_url: null,
    personalizacion: normalizarPersonalizacion(null),
    servicios: [],
    barberos: [],
    historial: [],
  }
  estado.barberias.push(nueva)
  guardarEstado(estado)
  const plan = estado.planes.find((p) => p.id === plan_id)
  return { id: nueva.id, nombre, slug, estado_id: nueva.estado_id, plan_id, planes: plan ? { nombre: plan.nombre } : null }
}

export async function cambiarPlanProvisorio(id, planId) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === id)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + id)
  barberia.plan_id = planId
  guardarEstado(estado)
}

export async function cambiarEstadoProvisorio(barberiaId, estadoNuevoId, motivo) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  const estadoAnteriorId = barberia.estado_id
  barberia.estado_id = estadoNuevoId
  barberia.historial = barberia.historial ?? []
  barberia.historial.unshift({
    id: 'prov-historial-' + Date.now(),
    estado_anterior_id: estadoAnteriorId,
    estado_nuevo_id: estadoNuevoId,
    motivo,
    created_at: new Date().toISOString(),
    usuarios: { nombre: 'Tú (modo provisorio)' },
  })
  guardarEstado(estado)
}

export async function listarHistorialProvisorio(barberiaId) {
  const { barberias } = leerEstado()
  return barberias.find((b) => b.id === barberiaId)?.historial ?? []
}

// Lo mínimo que necesita el panel de admin (no superadmin) para mostrar la
// pantalla de personalización: identidad de la barbería + su personalización.
export async function obtenerBarberiaParaPersonalizacion(barberiaId) {
  const { barberias } = leerEstado()
  const b = barberias.find((x) => x.id === barberiaId)
  if (!b) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  return {
    id: b.id,
    nombre: b.nombre,
    slug: b.slug,
    logo_url: b.logo_url,
    direccion: b.direccion,
    telefono_whatsapp: b.telefono_whatsapp,
    servicios: b.servicios ?? [],
    barberos: b.barberos ?? [],
    personalizacion: normalizarPersonalizacion(b.personalizacion),
  }
}

export async function guardarPersonalizacionProvisoria(barberiaId, cambios) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  barberia.personalizacion = { ...barberia.personalizacion, ...cambios }
  if ('logo_url' in cambios) barberia.logo_url = cambios.logo_url
  if ('direccion' in cambios) barberia.direccion = cambios.direccion
  if ('telefono_whatsapp' in cambios) barberia.telefono_whatsapp = cambios.telefono_whatsapp
  guardarEstado(estado)
  return barberia.personalizacion
}

export async function listarBarberosProvisorios(barberiaId) {
  const { barberias } = leerEstado()
  const barberia = barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  return [...(barberia.barberos ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre))
}

function usuariosOcupadosProvisorios(estado) {
  const usuariosDeBarberos = estado.barberias.flatMap((b) => (b.barberos ?? []).map((barbero) => barbero.usuario))
  return [ADMIN_PROVISORIO.usuario, ...usuariosDeBarberos].filter(Boolean)
}

export async function crearBarberoProvisorio(barberiaId, nombre, password) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  const usuario = generarUsuarioDesdeNombre(nombre, usuariosOcupadosProvisorios(estado))
  const nuevo = {
    id: 'prov-barbero-' + Date.now(),
    nombre,
    activo: true,
    foto_url: null,
    especialidad: '',
    usa_catalogo_propio: false,
    intervalo_reserva_minutos: 30,
    usuario,
    password_provisoria: password,
  }
  barberia.barberos = [...(barberia.barberos ?? []), nuevo]
  guardarEstado(estado)
  return nuevo
}

export async function actualizarBarberoProvisorio(barberiaId, id, cambios) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  let actualizado = null
  barberia.barberos = (barberia.barberos ?? []).map((b) => {
    if (b.id !== id) return b
    actualizado = { ...b, ...cambios }
    return actualizado
  })
  guardarEstado(estado)
  return actualizado
}

// El dueño escribe la contraseña nueva a mano (no una generada al azar) —
// tiene que poder ser algo que el barbero pueda usar de inmediato, ahí
// mismo, sin depender de que alguien le dicte o le escriba una cadena rara.
export async function establecerContrasenaBarberoProvisoria(barberiaId, id, password) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  let actualizado = null
  barberia.barberos = (barberia.barberos ?? []).map((b) => {
    if (b.id !== id) return b
    actualizado = { ...b, password_provisoria: password }
    return actualizado
  })
  guardarEstado(estado)
  return actualizado
}

// Borra al barbero y todo lo que era solo suyo (su horario, sus excepciones
// puntuales, y su catálogo propio si tenía uno) — las reservas ya tomadas se
// dejan intactas, son un registro histórico, no algo que le "pertenece" al
// barbero en el mismo sentido.
export async function eliminarBarberoProvisorio(barberiaId, id) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  barberia.barberos = (barberia.barberos ?? []).filter((b) => b.id !== id)
  barberia.servicios = (barberia.servicios ?? []).filter((s) => s.barbero_id !== id)
  estado.horarios_disponibles = estado.horarios_disponibles.filter((h) => h.barbero_id !== id)
  estado.excepciones_horario = estado.excepciones_horario.filter((e) => e.barbero_id !== id)
  guardarEstado(estado)
}

// Valida usuario+contraseña contra el dueño provisorio o cualquier barbero de
// la (única) barbería provisoria — reemplaza al selector "Ver como" como la
// forma real de entrar como barbero, dentro de este modo de prueba. La
// contraseña vive en texto plano en `localStorage` porque no hay backend
// real que la resguarde todavía — aceptable solo porque esto es
// explícitamente modo de prueba, nunca producción.
export function validarCredencialesProvisorias(usuario, password) {
  const usuarioNormalizado = usuario.trim().toLowerCase()
  if (usuarioNormalizado === ADMIN_PROVISORIO.usuario && password === ADMIN_PROVISORIO.password_provisoria) {
    return { tipo: 'dueno' }
  }
  const { barberias } = leerEstado()
  const barberia = barberias.find((b) => b.id === ID_BARBERIA_PROVISORIA)
  const barbero = (barberia?.barberos ?? []).find(
    (b) => b.usuario?.toLowerCase() === usuarioNormalizado && b.password_provisoria === password
  )
  return barbero ? { tipo: 'barbero', barberoId: barbero.id } : null
}

// Al activar "servicios propios" por primera vez, el barbero arranca con
// una COPIA editable del catálogo compartido (no de cero) — así puede seguir
// cobrando lo mismo que ya cobraba y ajustar desde ahí, en vez de tener que
// armar su lista entera antes de poder seguir recibiendo reservas. Si ya
// tenía servicios propios de una activación anterior (los desactivó y volvió
// a activar), no se duplican — se reusan los que ya tenía.
export async function activarCatalogoPropioProvisorio(barberiaId, barberoId) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  const barbero = barberia.barberos.find((b) => b.id === barberoId)
  if (!barbero) throw new Error('Barbero provisorio no encontrado: ' + barberoId)

  const yaTieneCatalogoPropio = barberia.servicios.some((s) => s.barbero_id === barberoId)
  if (!yaTieneCatalogoPropio) {
    const copias = barberia.servicios
      .filter((s) => !s.barbero_id)
      .map((s) => ({ ...s, id: idNuevo('prov-servicio'), barbero_id: barberoId }))
    barberia.servicios = [...barberia.servicios, ...copias]
  }
  barbero.usa_catalogo_propio = true
  guardarEstado(estado)
  return barbero
}

// Se guardan los servicios propios (no se borran) al desactivar — si el
// dueño lo vuelve a activar más adelante, el barbero recupera lo que ya
// tenía armado en vez de partir de cero otra vez.
export async function desactivarCatalogoPropioProvisorio(barberiaId, barberoId) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  const barbero = barberia.barberos.find((b) => b.id === barberoId)
  if (!barbero) throw new Error('Barbero provisorio no encontrado: ' + barberoId)
  barbero.usa_catalogo_propio = false
  guardarEstado(estado)
  return barbero
}

// Catálogo COMPARTIDO de la barbería (`barbero_id` vacío) — lo que administra
// el dueño desde la pestaña "Servicios" del panel admin.
export async function listarServiciosAdminProvisorios(barberiaId) {
  const { barberias } = leerEstado()
  const barberia = barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  return barberia.servicios.filter((s) => !s.barbero_id).sort((a, b) => a.nombre.localeCompare(b.nombre))
}

export async function crearServicioAdminProvisorio(barberiaId, datos) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  const nuevo = { id: idNuevo('prov-servicio'), activo: true, barbero_id: null, ...datos }
  barberia.servicios = [...barberia.servicios, nuevo]
  guardarEstado(estado)
  return nuevo
}

// Catálogo PROPIO de un barbero (`barbero_id` puesto) — lo administra el
// barbero mismo desde su panel, solo si el dueño le activó "servicios propios".
export async function listarServiciosDeBarberoProvisorios(barberiaId, barberoId) {
  const { barberias } = leerEstado()
  const barberia = barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  return barberia.servicios.filter((s) => s.barbero_id === barberoId).sort((a, b) => a.nombre.localeCompare(b.nombre))
}

export async function crearServicioDeBarberoProvisorio(barberiaId, barberoId, datos) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  const nuevo = { id: idNuevo('prov-servicio'), activo: true, barbero_id: barberoId, ...datos }
  barberia.servicios = [...barberia.servicios, nuevo]
  guardarEstado(estado)
  return nuevo
}

// Genérica — sirve tanto para un servicio compartido (panel admin) como para
// uno propio de un barbero (panel barbero): ambos son filas del mismo array,
// solo cambia qué lista los trae a la pantalla.
export async function actualizarServicioProvisorio(barberiaId, id, cambios) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  let actualizado = null
  barberia.servicios = barberia.servicios.map((s) => {
    if (s.id !== id) return s
    actualizado = { ...s, ...cambios }
    return actualizado
  })
  guardarEstado(estado)
  return actualizado
}

export async function listarHorariosDisponiblesProvisorios(barberoId) {
  const { horarios_disponibles } = leerEstado()
  return horarios_disponibles
    .filter((h) => h.barbero_id === barberoId && h.activo)
    .sort((a, b) => a.dia_semana - b.dia_semana)
}

// Para el panel (dueño o el barbero editando lo suyo) — a diferencia de la
// anterior, incluye también los bloques desactivados (para poder reactivarlos).
export async function listarHorariosDeBarberoProvisorios(barberoId) {
  const { horarios_disponibles } = leerEstado()
  return horarios_disponibles
    .filter((h) => h.barbero_id === barberoId)
    .sort((a, b) => a.dia_semana - b.dia_semana)
}

export async function crearHorarioProvisorio(barberoId, datos) {
  const estado = leerEstado()
  const nuevo = { id: idNuevo('prov-horario'), barbero_id: barberoId, activo: true, ...datos }
  estado.horarios_disponibles = [...estado.horarios_disponibles, nuevo]
  guardarEstado(estado)
  return nuevo
}

export async function actualizarHorarioProvisorio(id, cambios) {
  const estado = leerEstado()
  let actualizado = null
  estado.horarios_disponibles = estado.horarios_disponibles.map((h) => {
    if (h.id !== id) return h
    actualizado = { ...h, ...cambios }
    return actualizado
  })
  guardarEstado(estado)
  return actualizado
}

// Excepciones puntuales: un bloque distinto (o el día cerrado entero) para
// una fecha exacta, sin tocar el horario semanal recurrente — pensado para
// "llego tarde mañana" o "no trabajo ese día en particular", no para un
// cambio permanente (eso ya lo cubre `horarios_disponibles`).
export async function listarExcepcionesDeBarberoProvisorias(barberoId) {
  const { excepciones_horario } = leerEstado()
  return excepciones_horario
    .filter((e) => e.barbero_id === barberoId)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export async function crearExcepcionProvisoria(barberoId, datos) {
  const estado = leerEstado()
  const nueva = {
    id: idNuevo('prov-excepcion'),
    barbero_id: barberoId,
    cerrado: false,
    hora_inicio: null,
    hora_fin: null,
    ...datos,
  }
  estado.excepciones_horario = [
    ...estado.excepciones_horario.filter((e) => !(e.barbero_id === barberoId && e.fecha === nueva.fecha)),
    nueva,
  ]
  guardarEstado(estado)
  return nueva
}

export async function eliminarExcepcionProvisoria(id) {
  const estado = leerEstado()
  estado.excepciones_horario = estado.excepciones_horario.filter((e) => e.id !== id)
  guardarEstado(estado)
}

export async function listarReservasDelDiaProvisorias(barberoId, fechaISO) {
  const { reservas } = leerEstado()
  return reservas
    .filter(
      (r) =>
        r.barbero_id === barberoId &&
        r.estado !== 'cancelada' &&
        r.fecha_hora.slice(0, 10) === fechaISO
    )
    .map((r) => ({ fecha_hora: r.fecha_hora, servicio_id: r.servicio_id }))
}

export async function crearReservaProvisoria(reserva) {
  const estado = leerEstado()
  const nueva = { id: idNuevo('prov-reserva'), ...reserva }
  estado.reservas = [...estado.reservas, nueva]
  guardarEstado(estado)
  return nueva
}

// Arma el mismo shape que devuelve el select real con joins
// (`servicios(nombre, precio_clp)`, `barberos(nombre)`) a mano, buscando en
// las listas de esa barbería — en el mock no hay joins de verdad.
function conNombresProvisorios(reserva, barberia) {
  const servicio = barberia?.servicios.find((s) => s.id === reserva.servicio_id)
  const barbero = barberia?.barberos.find((b) => b.id === reserva.barbero_id)
  return {
    ...reserva,
    servicios: servicio ? { nombre: servicio.nombre, precio_clp: servicio.precio_clp } : null,
    barberos: barbero ? { nombre: barbero.nombre } : null,
  }
}

export async function listarReservasBandejaProvisorias(barberiaId) {
  const { barberias, reservas } = leerEstado()
  const barberia = barberias.find((b) => b.id === barberiaId)
  return reservas
    .filter((r) => r.barberia_id === barberiaId)
    .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))
    .map((r) => conNombresProvisorios(r, barberia))
}

// Mismo shape que la anterior, pero filtrado a un solo barbero — para su
// propio panel de reservas, no el del dueño (que ve todas las de la barbería).
export async function listarReservasDeBarberoProvisorias(barberoId) {
  const { barberias, reservas } = leerEstado()
  const barberia = barberias.find((b) => b.barberos?.some((x) => x.id === barberoId))
  return reservas
    .filter((r) => r.barbero_id === barberoId)
    .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))
    .map((r) => conNombresProvisorios(r, barberia))
}

export async function cancelarReservaProvisoria(id) {
  const estado = leerEstado()
  estado.reservas = estado.reservas.map((r) => (r.id === id ? { ...r, estado: 'cancelada' } : r))
  guardarEstado(estado)
}

// Para el selector temporal "Ver como" (dueño/barbero) del panel — no hay
// login real que resolver todavía, así que esto reemplaza a una consulta de
// `usuarios` por rol. Se lee de forma síncrona (sin awaits) porque
// `AuthContext` necesita el perfil disponible antes del primer render, igual
// que el resto del modo provisorio.
export function listarBarberosParaSelectorProvisorio() {
  const { barberias } = leerEstado()
  const barberia = barberias.find((b) => b.id === ID_BARBERIA_PROVISORIA)
  return (barberia?.barberos ?? []).map((b) => ({ id: b.id, nombre: b.nombre }))
}

export function perfilProvisorioParaBarbero(barberoId) {
  const { barberias } = leerEstado()
  const barberia = barberias.find((b) => b.id === ID_BARBERIA_PROVISORIA)
  const barbero = barberia?.barberos.find((b) => b.id === barberoId)
  if (!barbero) return null
  return {
    id: 'prov-usuario-barbero-' + barbero.id,
    usuario: barbero.usuario,
    nombre: `${barbero.nombre} (modo provisorio)`,
    rol_id: ROL_BARBERO,
    barberia_id: ID_BARBERIA_PROVISORIA,
    barbero_id: barbero.id,
    barberias: { estado_id: ESTADO_ACTIVO },
  }
}
