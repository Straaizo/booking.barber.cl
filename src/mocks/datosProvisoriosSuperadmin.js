import { ESTADO_ACTIVO, ESTADO_PENDIENTE_ACTIVACION } from '../utils/estados'
import { normalizarPersonalizacion } from '../utils/personalizacion'
import { ROL_ADMIN, ROL_BARBERO } from '../utils/roles'
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

// Credenciales de referencia para el aviso "modo de prueba" del login — las
// mismas que trae de fábrica la barbería semilla (Don Manuel), así el aviso
// nunca queda desincronizado del dato real. Cada barbería NUEVA que crea el
// superadmin arranca sin cuenta de dueño hasta que se la crean a mano desde
// "Usuarios" en su detalle — ya no hay un dueño único y global.
export const ADMIN_PROVISORIO = { usuario: 'demo', password_provisoria: 'demo1234' }

// Login de superadmin en modo de prueba — no pertenece a ninguna barbería
// (rol_id = 1, sin barberia_id/barbero_id), así que no vive en el arreglo de
// barberías como el resto de las cuentas. Ruta protegida (`/admin`) para que
// nadie entre por URL sin pasar por este login.
export const SUPERADMIN_PROVISORIO = { usuario: 'superadmin', password_provisoria: 'super1234' }

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
    dias_maximos_reserva: 3,
    logo_url: null,
    nombre_dueno: 'Demo',
    usuario_dueno: 'demo',
    password_dueno: 'demo1234',
    // Activada "hace 25 días" (a propósito, no `created_at`) para que el
    // aviso de "Próximos a pagar" del superadmin tenga algo real que mostrar
    // apenas se abre el panel, sin tener que simular un mes entero.
    fecha_activacion: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    // "Hace 200 días" — distinta de `fecha_activacion` a propósito, para que
    // se note que una nunca se pisa y la otra sí (ver el comentario en
    // `cambiar_estado_barberia()`, supabase/sql/001_cambiar_estado_barberia.sql).
    fecha_alta: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
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
    // Migración suave para sesiones guardadas antes de que la cuenta de dueño
    // viviera por barbería (`usuario_dueno`/`password_dueno`/`nombre_dueno`):
    // sin esto, un navegador con datos viejos se queda con la barbería semilla
    // sin cuenta de dueño y el login demo/demo1234 deja de encontrar
    // coincidencia — no es "credenciales incorrectas", es data vieja. Se
    // distingue `undefined` (el campo nunca existió, dato viejo) de `null`
    // (la cuenta se borró a propósito desde "Usuarios") a propósito: solo el
    // primer caso se migra.
    let huboMigracion = false
    estado.barberias = estado.barberias.map((b) => {
      if (b.usuario_dueno !== undefined) return b
      huboMigracion = true
      const esBarberiaSemilla = b.id === ID_BARBERIA_PROVISORIA
      return {
        ...b,
        usuario_dueno: esBarberiaSemilla ? ADMIN_PROVISORIO.usuario : null,
        password_dueno: esBarberiaSemilla ? ADMIN_PROVISORIO.password_provisoria : null,
        nombre_dueno: esBarberiaSemilla ? 'Demo' : '',
      }
    })
    // Misma idea para `fecha_activacion`: si una barbería ya estaba Activa
    // antes de que existiera este campo, no hay forma de saber cuándo se
    // activó de verdad — se usa "ahora" como aproximación (mejor eso que
    // dejarla afuera del aviso de "Próximos a pagar" para siempre).
    estado.barberias = estado.barberias.map((b) => {
      if (b.fecha_activacion !== undefined) return b
      huboMigracion = true
      return { ...b, fecha_activacion: b.estado_id === ESTADO_ACTIVO ? new Date().toISOString() : null }
    })
    // Misma idea otra vez para `fecha_alta` — se aproxima con `fecha_activacion`
    // si ya existe (mejor esa aproximación que dejarla en null para siempre).
    estado.barberias = estado.barberias.map((b) => {
      if (b.fecha_alta !== undefined) return b
      huboMigracion = true
      return { ...b, fecha_alta: b.fecha_activacion ?? null }
    })
    // Se persiste de una — si no, cada lectura futura tendría que volver a
    // migrar en memoria, y el archivo guardado se queda para siempre con la
    // forma vieja aunque la app ya esté funcionando con la nueva.
    if (huboMigracion) localStorage.setItem(CLAVE_STORAGE, JSON.stringify(estado))
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
        fecha_activacion: b.fecha_activacion ?? null,
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
    usuario_dueno: b.usuario_dueno ?? null,
    nombre_dueno: b.nombre_dueno ?? '',
    fecha_activacion: b.fecha_activacion ?? null,
  }
}

export async function obtenerBarberiaProvisoriaPorSlug(slug) {
  const { barberias } = leerEstado()
  const b = barberias.find((x) => x.slug === slug)
  if (!b) throw new Error('Barbería provisoria no encontrada para el slug: ' + slug)
  const { id, nombre, telefono_whatsapp, email_contacto, direccion, dias_maximos_reserva, logo_url, estado_id, plan_id, personalizacion, servicios, barberos } = b
  return {
    id,
    slug,
    nombre,
    telefono_whatsapp,
    email_contacto,
    direccion,
    dias_maximos_reserva: dias_maximos_reserva ?? 3,
    logo_url,
    estado_id,
    plan_id,
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
    dias_maximos_reserva: 3,
    logo_url: null,
    nombre_dueno: '',
    usuario_dueno: null,
    password_dueno: null,
    fecha_activacion: null,
    fecha_alta: null,
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

// Mismo límite que impone `validar_limite_barberos` del lado real (000_schema.sql):
// no se puede bajar a un plan cuyo máximo de barberos ya está superado por
// los barberos activos que la barbería tiene hoy.
export async function cambiarPlanProvisorio(id, planId) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === id)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + id)
  const planNuevo = estado.planes.find((p) => p.id === planId)
  const activos = (barberia.barberos ?? []).filter((b) => b.activo).length
  if (planNuevo && activos > planNuevo.max_barberos) {
    throw new Error(
      `Esta barbería tiene ${activos} barberos activos — el plan ${planNuevo.nombre} permite máximo ${planNuevo.max_barberos}.`
    )
  }
  barberia.plan_id = planId
  guardarEstado(estado)
}

export async function cambiarEstadoProvisorio(barberiaId, estadoNuevoId, motivo) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  const estadoAnteriorId = barberia.estado_id
  barberia.estado_id = estadoNuevoId
  // Cada vez que ENTRA a Activo (primera vez o reactivación tras una
  // suspensión) queda como el nuevo día de cobro — si estuvo suspendida por
  // pago, lo lógico es que el próximo vencimiento se cuente desde que volvió
  // a pagar, no desde la fecha original de hace meses. `fecha_alta`, en
  // cambio, nunca se pisa: solo se llena la primera vez.
  if (estadoNuevoId === ESTADO_ACTIVO) {
    barberia.fecha_activacion = new Date().toISOString()
    if (!barberia.fecha_alta) barberia.fecha_alta = barberia.fecha_activacion
  }
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
    dias_maximos_reserva: b.dias_maximos_reserva ?? 3,
    plan_id: b.plan_id,
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
  if ('dias_maximos_reserva' in cambios) barberia.dias_maximos_reserva = cambios.dias_maximos_reserva
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
  const usuariosDeDuenos = estado.barberias.map((b) => b.usuario_dueno)
  return [SUPERADMIN_PROVISORIO.usuario, ...usuariosDeDuenos, ...usuariosDeBarberos].filter(Boolean)
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

// Mismo límite que impone `validar_limite_barberos` del lado real
// (000_schema.sql) — no solo al crear un barbero nuevo, también al
// reactivar uno con el interruptor "Activo/Inactivo": sin este chequeo acá,
// alguien podía desactivar a un barbero y reactivar a otro para colarse por
// arriba del límite del plan sin pasar por el formulario de "Nuevo barbero".
export async function actualizarBarberoProvisorio(barberiaId, id, cambios) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  if (cambios.activo === true) {
    const plan = estado.planes.find((p) => p.id === barberia.plan_id)
    const activos = (barberia.barberos ?? []).filter((b) => b.activo && b.id !== id).length
    if (plan && activos >= plan.max_barberos) {
      throw new Error(`El plan ${plan.nombre} permite un máximo de ${plan.max_barberos} barbero(s) activo(s).`)
    }
  }
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

// "Dar de baja" es una baja LÓGICA, nunca un borrado físico — un barbero que
// se va no debería llevarse su historial de reservas ni (si vuelve) obligar
// a rearmar sus horarios desde cero. Le saca la cuenta (ya no puede entrar)
// y lo pone `activo: 0` (desaparece de la página pública y del selector de
// reserva), pero deja intactos su horario, sus excepciones y su catálogo
// propio — quedan ahí, simplemente sin nadie mirándolos, hasta que alguien
// decida reactivarlo o borrar la barbería entera.
export async function darDeBajaBarberoProvisorio(barberiaId, id) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  barberia.barberos = (barberia.barberos ?? []).map((b) =>
    b.id === id ? { ...b, activo: false, usuario: null, password_provisoria: null } : b
  )
  guardarEstado(estado)
}

// Valida usuario+contraseña contra el dueño o cualquier barbero de CUALQUIER
// barbería provisoria (ya no una sola fija) — reemplaza al selector "Ver
// como" como la forma real de entrar, dentro de este modo de prueba. La
// contraseña vive en texto plano en `localStorage` porque no hay backend
// real que la resguarde todavía — aceptable solo porque esto es
// explícitamente modo de prueba, nunca producción.
export function validarCredencialesProvisorias(usuario, password) {
  const usuarioNormalizado = usuario.trim().toLowerCase()

  if (
    usuarioNormalizado === SUPERADMIN_PROVISORIO.usuario &&
    password === SUPERADMIN_PROVISORIO.password_provisoria
  ) {
    return { tipo: 'superadmin' }
  }

  const { barberias } = leerEstado()

  for (const barberia of barberias) {
    if (
      barberia.usuario_dueno?.toLowerCase() === usuarioNormalizado &&
      barberia.password_dueno === password
    ) {
      return { tipo: 'dueno', barberiaId: barberia.id }
    }
    const barbero = (barberia.barberos ?? []).find(
      (b) => b.usuario?.toLowerCase() === usuarioNormalizado && b.password_provisoria === password
    )
    if (barbero) return { tipo: 'barbero', barberoId: barbero.id, barberiaId: barberia.id }
  }
  return null
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
    .map((r) => ({ fecha_hora: r.fecha_hora, fecha_hora_fin: r.fecha_hora_fin, servicio_id: r.servicio_id }))
}

// Mismo cálculo que el trigger `calcular_fin_reserva`/`precio_vigente()` del
// lado real: el precio que se cobra es el de oferta solo si está activa, con
// precio puesto, y no vencida — nunca lo que mande el cliente.
function precioVigenteProvisorio(servicio) {
  if (!servicio) return 0
  const hoy = new Date().toISOString().slice(0, 10)
  const ofertaVigente = servicio.oferta_activa && servicio.precio_oferta && (!servicio.oferta_vence || servicio.oferta_vence >= hoy)
  return ofertaVigente ? servicio.precio_oferta : servicio.precio_clp
}

// Mismo criterio que el trigger `normalizar_telefono` del lado real: solo
// dígitos, y si quedan 9 (un celular chileno sin código de país) se le
// agrega el 56 adelante.
function normalizarTelefonoProvisorio(telefono) {
  let limpio = String(telefono ?? '').replace(/[^0-9]/g, '')
  if (limpio.length === 9) limpio = '56' + limpio
  return limpio
}

export async function crearReservaProvisoria(reserva) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === reserva.barberia_id)
  const servicio = barberia?.servicios.find((s) => s.id === reserva.servicio_id)
  const duracion = servicio?.duracion_minutos ?? 30
  const fechaHoraFin = new Date(new Date(reserva.fecha_hora).getTime() + duracion * 60000).toISOString()
  const nueva = {
    id: idNuevo('prov-reserva'),
    ...reserva,
    cliente_telefono: normalizarTelefonoProvisorio(reserva.cliente_telefono),
    duracion_minutos: duracion,
    fecha_hora_fin: fechaHoraFin,
    precio_cobrado_clp: precioVigenteProvisorio(servicio),
    servicio_nombre_snapshot: servicio?.nombre ?? '',
  }
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
// que el resto del modo provisorio. Recibe `barberiaId` (antes era fija a la
// única barbería sembrada) porque ahora el superadmin puede crear más de una.
export function listarBarberosParaSelectorProvisorio(barberiaId) {
  const { barberias } = leerEstado()
  const barberia = barberias.find((b) => b.id === barberiaId)
  return (barberia?.barberos ?? []).map((b) => ({ id: b.id, nombre: b.nombre }))
}

export function perfilProvisorioParaBarbero(barberoId) {
  const { barberias } = leerEstado()
  const barberia = barberias.find((b) => (b.barberos ?? []).some((barbero) => barbero.id === barberoId))
  const barbero = barberia?.barberos.find((b) => b.id === barberoId)
  if (!barbero || !barberia) return null
  return {
    id: 'prov-usuario-barbero-' + barbero.id,
    usuario: barbero.usuario,
    nombre: `${barbero.nombre} (modo provisorio)`,
    rol_id: ROL_BARBERO,
    barberia_id: barberia.id,
    barbero_id: barbero.id,
    barberias: { estado_id: barberia.estado_id },
  }
}

// Análoga a la anterior, pero para el dueño de una barbería puntual — ya no
// existe un solo "dueño global": cada barbería tiene la suya propia (o
// ninguna todavía, si el superadmin no le creó la cuenta).
export function perfilProvisorioParaDueno(barberiaId) {
  const { barberias } = leerEstado()
  const barberia = barberias.find((b) => b.id === barberiaId)
  if (!barberia || !barberia.usuario_dueno) return null
  return {
    id: 'prov-usuario-dueno-' + barberia.id,
    usuario: barberia.usuario_dueno,
    nombre: `${barberia.nombre_dueno || barberia.nombre} (modo provisorio)`,
    rol_id: ROL_ADMIN,
    barberia_id: barberia.id,
    barbero_id: null,
    barberias: { estado_id: barberia.estado_id },
  }
}

// --- Gestión de cuentas (usuarios) desde el panel de superadmin ---

// Crea la cuenta de dueño de una barbería que todavía no tenía una — el
// nombre lo escribe el superadmin, el usuario se genera solo (mismo criterio
// que para un barbero), la contraseña la escribe el superadmin a mano por el
// mismo motivo de siempre: tiene que ser algo que se le pueda pasar al dueño
// de inmediato, no una cadena al azar.
export async function crearCuentaDuenoProvisoria(barberiaId, { nombre, password }) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  if (barberia.usuario_dueno) throw new Error('Esta barbería ya tiene una cuenta de dueño')
  const usuario = generarUsuarioDesdeNombre(nombre, usuariosOcupadosProvisorios(estado))
  barberia.usuario_dueno = usuario
  barberia.password_dueno = password
  barberia.nombre_dueno = nombre
  guardarEstado(estado)
  return { usuario, nombre }
}

export async function establecerContrasenaDuenoProvisoria(barberiaId, password) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  if (!barberia.usuario_dueno) throw new Error('Esta barbería todavía no tiene cuenta de dueño')
  barberia.password_dueno = password
  guardarEstado(estado)
  return { usuario: barberia.usuario_dueno }
}

// "Eliminar cuenta" le quita el login (usuario/contraseña) — no borra a la
// barbería ni sus datos, exactamente como al barbero de abajo: es una acción
// sobre el ACCESO, no sobre el negocio.
export async function eliminarCuentaDuenoProvisoria(barberiaId) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  barberia.usuario_dueno = null
  barberia.password_dueno = null
  barberia.nombre_dueno = ''
  guardarEstado(estado)
}

// Le quita el login al barbero (usuario/contraseña) sin tocar su ficha de
// negocio (servicios, horarios, especialidad) — distinto de
// `eliminarBarberoProvisorio`, que borra al barbero entero. Pensada para el
// panel de superadmin ("Usuarios"), no para el panel del dueño.
export async function eliminarCuentaBarberoProvisoria(barberiaId, barberoId) {
  const estado = leerEstado()
  const barberia = estado.barberias.find((b) => b.id === barberiaId)
  if (!barberia) throw new Error('Barbería provisoria no encontrada: ' + barberiaId)
  barberia.barberos = (barberia.barberos ?? []).map((b) =>
    b.id === barberoId ? { ...b, usuario: null, password_provisoria: null } : b
  )
  guardarEstado(estado)
}
