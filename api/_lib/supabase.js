import { createClient } from '@supabase/supabase-js'

// Clave pública (misma que usa el cliente, `sb_publishable_...`), NUNCA la
// de servicio: la política `barberias_publico` (RLS) ya deja leer, sin
// sesión, cualquier barbería con `estado_id = 1` — no hace falta más
// privilegio que ese para esta función. Variables de entorno propias
// (`SUPABASE_URL`/`SUPABASE_ANON_KEY`, sin el prefijo `VITE_`) porque estas
// funciones corren en el servidor: `import.meta.env` no existe acá, esas
// solo se inyectan en el bundle del navegador en build time.
const cliente = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
})

const TIMEOUT_MS = 2500

// Nunca deja la consulta colgada: WhatsApp/Facebook abandonan la petición
// de previsualización en pocos segundos, así que si Supabase no responde a
// tiempo hay que degradar a metadatos genéricos ya, no esperar más.
//
// Devuelve `null` tanto si el slug no existe COMO si la barbería existe
// pero no está activa (`estado_id != 1`) — la misma política RLS que
// permite leer sin sesión ya filtra por `estado_id = 1`, así que un slug de
// una barbería suspendida simplemente no aparece: nunca hay que acordarse
// de chequear el estado a mano acá, y es imposible filtrarlo por error.
export async function buscarBarberiaPorSlug(slug) {
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS)
  try {
    const { data, error } = await cliente
      .from('barberias')
      .select('nombre, direccion, logo_url, personalizacion(eslogan)')
      .eq('slug', slug)
      .abortSignal(controlador.signal)
      .maybeSingle()

    if (error || !data) return null
    return {
      nombre: data.nombre,
      direccion: data.direccion || '',
      logo_url: data.logo_url || null,
      eslogan: data.personalizacion?.eslogan || '',
    }
  } catch {
    return null
  } finally {
    clearTimeout(temporizador)
  }
}
