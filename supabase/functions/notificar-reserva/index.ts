// Edge Function: notificar-reserva
// ============================================================================
// La llama un Database Webhook de Supabase (Database → Webhooks) en cada
// INSERT sobre `reservas` — nunca el navegador, para que nadie pueda
// disparar notificaciones falsas. Manda un Web Push al barbero asignado y al
// dueño de la barbería, a cada dispositivo que tengan suscrito
// (`suscripciones_push`).
//
// Secretos requeridos (supabase secrets set ...):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (ej: mailto:soporte@...)
//   WEBHOOK_SECRET — el mismo valor va en el header `x-webhook-secret` del webhook.
//
// Desplegar con: supabase functions deploy notificar-reserva --no-verify-jwt
// (el webhook no manda un JWT de usuario; la autenticación es el secreto).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const ROL_ADMIN = 2

const FORMATO_FECHA = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

Deno.serve(async (req) => {
  if (req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) {
    return new Response('No autorizado', { status: 401 })
  }

  try {
    const { type, table, record: reserva } = await req.json()
    if (type !== 'INSERT' || table !== 'reservas' || reserva?.estado !== 'confirmada') {
      return new Response('Ignorado', { status: 200 })
    }

    const clienteAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: destinatarios, error: errorUsuarios } = await clienteAdmin
      .from('usuarios')
      .select('id, rol_id')
      .eq('barberia_id', reserva.barberia_id)
      .or(`rol_id.eq.${ROL_ADMIN},barbero_id.eq.${reserva.barbero_id}`)
    if (errorUsuarios) throw errorUsuarios
    if (!destinatarios?.length) return new Response('Sin destinatarios', { status: 200 })

    const { data: suscripciones, error: errorSuscripciones } = await clienteAdmin
      .from('suscripciones_push')
      .select('id, usuario_id, endpoint, p256dh, auth')
      .in('usuario_id', destinatarios.map((d) => d.id))
    if (errorSuscripciones) throw errorSuscripciones
    if (!suscripciones?.length) return new Response('Sin suscripciones', { status: 200 })

    const { data: barbero } = await clienteAdmin
      .from('barberos')
      .select('nombre')
      .eq('id', reserva.barbero_id)
      .maybeSingle()

    const rolPorUsuario = new Map(destinatarios.map((d) => [d.id, d.rol_id]))
    const fecha = FORMATO_FECHA.format(new Date(reserva.fecha_hora))
    const detalle = `${reserva.cliente_nombre} · ${reserva.servicio_nombre_snapshot}`

    const envios = suscripciones.map(async (suscripcion) => {
      const esDueno = rolPorUsuario.get(suscripcion.usuario_id) === ROL_ADMIN
      const payload = JSON.stringify({
        titulo: 'Nueva reserva',
        cuerpo: esDueno && barbero ? `${detalle}\n${fecha} con ${barbero.nombre}` : `${detalle}\n${fecha}`,
        url: esDueno ? '/panel/reservas' : '/panel/barbero/reservas',
        tag: `reserva-${reserva.id}`,
      })
      try {
        await webpush.sendNotification(
          { endpoint: suscripcion.endpoint, keys: { p256dh: suscripcion.p256dh, auth: suscripcion.auth } },
          payload
        )
      } catch (error) {
        // 404/410: el navegador dio de baja la suscripción (desinstaló la
        // app, borró datos, revocó el permiso) — no sirve guardarla más.
        const estado = (error as { statusCode?: number }).statusCode
        if (estado === 404 || estado === 410) {
          await clienteAdmin.from('suscripciones_push').delete().eq('id', suscripcion.id)
        } else {
          console.error('Fallo enviando push', suscripcion.id, error)
        }
      }
    })
    await Promise.all(envios)

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('notificar-reserva', error)
    return new Response('Error interno', { status: 500 })
  }
})
