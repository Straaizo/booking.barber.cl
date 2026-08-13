// Datos de la barbería demo (/demo) — un tenant que no existe en Supabase.
// AsistenteReserva y sus hooks (useHorariosDisponibles, useReservasDelDia,
// useCrearReserva) detectan este ID y responden con datos locales en vez de
// consultar la base real, así el visitante prueba el flujo de reserva
// completo y genuino sin que dependa de que exista una fila real en la BD.
export const DEMO_BARBERO_ID = 'demo-barbero-1'
export const DEMO_BARBERIA_ID = 'demo-barberia-1'

export const BARBERIA_DEMO = {
  id: DEMO_BARBERIA_ID,
  slug: 'demo',
  nombre: 'Barbería El Andén',
  telefono_whatsapp: '+56912345678',
  direccion: 'Av. Providencia 1234, Providencia',
  logo_url: null,
  estado_id: 1,
  personalizacion: {
    color_primario: null,
    eslogan: 'Tradición porteña, cortes de siempre',
    descripcion:
      'Esta es una barbería de ejemplo — reserva una hora como lo haría cualquiera de tus clientes.',
  },
  servicios: [
    {
      id: 'demo-servicio-1',
      nombre: 'Corte clásico',
      duracion_minutos: 30,
      precio_clp: 9000,
      precio_oferta: null,
      oferta_activa: false,
      oferta_vence: null,
      activo: true,
    },
    {
      id: 'demo-servicio-2',
      nombre: 'Corte + Barba',
      duracion_minutos: 45,
      precio_clp: 14000,
      precio_oferta: 12000,
      oferta_activa: true,
      oferta_vence: null,
      activo: true,
    },
    {
      id: 'demo-servicio-3',
      nombre: 'Afeitado tradicional',
      duracion_minutos: 30,
      precio_clp: 8000,
      precio_oferta: null,
      oferta_activa: false,
      oferta_vence: null,
      activo: true,
    },
  ],
  barberos: [{ id: DEMO_BARBERO_ID, nombre: 'Javier Muñoz', activo: true, intervalo_reserva_minutos: 30 }],
}

// Lunes a sábado, 10:00–19:00 — igual para todos los días de la demo.
export const HORARIOS_DEMO = [1, 2, 3, 4, 5, 6].map((diaSemana) => ({
  id: `demo-horario-${diaSemana}`,
  dia_semana: diaSemana,
  hora_inicio: '10:00',
  hora_fin: '19:00',
}))

export function esBarberoDemo(barberoId) {
  return barberoId === DEMO_BARBERO_ID
}
