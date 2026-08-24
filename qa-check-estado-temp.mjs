import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import ws from 'ws'

function leerEnv() {
  const texto = readFileSync(new URL('./.env', import.meta.url), 'utf8')
  const env = {}
  for (const linea of texto.split('\n')) {
    const match = linea.match(/^([A-Z_]+)=(.*)$/)
    if (match) env[match[1]] = match[2].trim()
  }
  return env
}
const env = leerEnv()
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { realtime: { transport: ws } })

await supabase.auth.signInWithPassword({ email: 'jluis@usuarios.booking.barber.cl', password: 'Jluis2026' })
const { data, error } = await supabase
  .from('reservas')
  .select('id, cliente_nombre, fecha_hora, fecha_hora_fin, estado')
  .order('fecha_hora', { ascending: true })
if (error) throw error
console.log(data)
