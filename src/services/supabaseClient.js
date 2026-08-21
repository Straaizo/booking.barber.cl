import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. Revisa tu archivo .env'
  )
}

// La vista previa de Personalización (ver PreviewBarberia.jsx) carga esta
// misma app en un <iframe> del mismo origen — sin esto, `createClient()`
// arranca ahí un segundo GoTrueClient real (auto-refresh + listeners de
// `storage`) que compite con el de la pestaña real por el mismo token en el
// mismo localStorage, generando eventos de sesión espurios y, con ellos, un
// loop de desmontaje/remontaje (y de recarga) de esa pantalla. Esa ruta
// nunca usa `useAuth()`, así que no necesita sesión real en absoluto.
const esPreview = typeof window !== 'undefined' && window.location.pathname === '/_preview-barberia'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: esPreview
    ? { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
    : undefined,
})
