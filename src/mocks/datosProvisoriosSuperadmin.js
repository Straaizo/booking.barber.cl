import { ESTADO_ACTIVO, ESTADO_PENDIENTE_ACTIVACION } from '../utils/estados'

// TEMPORAL: mientras no haya un Supabase real conectado (VITE_SUPABASE_URL
// en `.env` sigue siendo el placeholder de ejemplo), el panel superadmin y la
// página pública de barbería leen/escriben acá, respaldado en localStorage,
// en vez de contra la base real. Se autodesactiva solo — apenas `.env` tenga
// una URL real, `HAY_BACKEND_REAL` pasa a `true` y cada hook que lo consulta
// vuelve a usar su query original de Supabase sin que haya que tocar nada.
export const HAY_BACKEND_REAL = !String(import.meta.env.VITE_SUPABASE_URL ?? '').includes('tu-proyecto')

const CLAVE_STORAGE = 'booking_barber_datos_provisorios_v1'

const PLANES_SEED = [
  { id: 1, nombre: 'Solo', precio_clp: 5000, max_barberos: 1, orden: 1 },
  { id: 2, nombre: 'Equipo', precio_clp: 6000, max_barberos: 3, orden: 2 },
  { id: 3, nombre: 'Estudio', precio_clp: 7000, max_barberos: 99, orden: 3 },
]

const BARBERIAS_SEED = [
  {
    id: 'prov-barberia-1',
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
      eslogan: 'Corte de barrio, oficio de siempre',
      descripcion:
        'Barbería de prueba, cargada para revisar cómo se ve el panel y la página pública mientras no hay Supabase real conectado.',
      banner_url: null,
    },
    servicios: [
      { id: 'prov-servicio-1', nombre: 'Corte clásico', duracion_minutos: 30, precio_clp: 8000, precio_oferta: null, oferta_activa: false, oferta_vence: null, activo: true },
      { id: 'prov-servicio-2', nombre: 'Corte + Barba', duracion_minutos: 45, precio_clp: 13000, precio_oferta: 11000, oferta_activa: true, oferta_vence: null, activo: true },
      { id: 'prov-servicio-3', nombre: 'Afeitado a la antigua', duracion_minutos: 25, precio_clp: 7500, precio_oferta: null, oferta_activa: false, oferta_vence: null, activo: true },
    ],
    barberos: [
      { id: 'prov-barbero-1', nombre: 'Manuel Rojas', activo: true },
      { id: 'prov-barbero-2', nombre: 'Ignacio Soto', activo: true },
    ],
    historial: [],
  },
]

function leerEstado() {
  try {
    const crudo = localStorage.getItem(CLAVE_STORAGE)
    if (!crudo) throw new Error('sin datos guardados todavía')
    return JSON.parse(crudo)
  } catch {
    const inicial = { barberias: BARBERIAS_SEED, planes: PLANES_SEED }
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(inicial))
    return inicial
  }
}

function guardarEstado(estado) {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(estado))
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
  return { id, slug, nombre, telefono_whatsapp, email_contacto, direccion, logo_url, estado_id, personalizacion, servicios, barberos }
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
    personalizacion: { color_primario: null, eslogan: '', descripcion: '', banner_url: null },
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
