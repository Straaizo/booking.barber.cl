// Service worker de la app instalable (solo login y paneles — ver
// src/hooks/useModoApp.js). No cachea nada: su único trabajo es recibir los Web Push
// de `notificar-reserva` y abrir el panel al tocar la notificación.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (evento) => evento.waitUntil(self.clients.claim()))

self.addEventListener('push', (evento) => {
  let datos = {}
  try {
    datos = evento.data ? evento.data.json() : {}
  } catch {
    datos = { cuerpo: evento.data?.text() }
  }

  evento.waitUntil(
    self.registration.showNotification(datos.titulo || 'Booking Barber', {
      body: datos.cuerpo || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: datos.tag,
      renotify: Boolean(datos.tag),
      // Android/PC: vibra y queda en pantalla hasta que la toquen. iOS ignora
      // estas opciones y usa el sonido/vibración que el usuario tenga en
      // Ajustes → Notificaciones → Booking Barber.
      vibrate: [200, 100, 200, 100, 300],
      requireInteraction: true,
      silent: false,
      data: { url: datos.url || '/login' },
    })
  )
})

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  const url = new URL(evento.notification.data?.url || '/login', self.location.origin).href

  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      const abierta = ventanas.find((ventana) => ventana.url.startsWith(self.location.origin))
      if (abierta) {
        return abierta.focus().then((ventana) => ventana.navigate(url))
      }
      return self.clients.openWindow(url)
    })
  )
})
