// Punto único de integración para notificar una reserva nueva.
// Fase actual: solo deja constancia en consola. Más adelante se conecta
// a una Supabase Edge Function que dispare WhatsApp Cloud API / Resend,
// nunca se llama a esos servicios directo desde el navegador (requieren secretos).
export function onReservaCreada(reserva) {
  console.info('[evento] reserva creada, pendiente de notificar', reserva)
}
