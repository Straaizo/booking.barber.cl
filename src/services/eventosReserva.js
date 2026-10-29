// Punto único de integración para notificar una reserva nueva.
// Fase actual: no hace nada (el aviso al barbero/dueño lo dispara el webhook
// de la base). Más adelante se conecta a una Supabase Edge Function que
// dispare WhatsApp Cloud API / Resend, nunca se llama a esos servicios directo
// desde el navegador (requieren secretos).
// eslint-disable-next-line no-unused-vars
export function onReservaCreada(reserva) {}
