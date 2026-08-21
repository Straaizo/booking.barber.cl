-- La vidriera de "Servicios y precios" (VistaBarberia.jsx) pasa a poder
-- ocultarse desde Personalización, para el dueño que sienta que repite lo
-- que ya ve en el asistente de reserva. El encabezado de su tabla usa el
-- color de marca (`color_primario`) que ya existe. `default 1` (visible)
-- para no cambiarle el comportamiento a nadie.
--
-- "Horario de atención" NO tiene columna propia — a diferencia de
-- servicios, pasó a ser una sección más dentro de `secciones` (jsonb, sin
-- necesidad de migración), con posición e imagen propia, igual que
-- "Equipo". Ver utils/personalizacion.js.
alter table personalizacion
  add column mostrar_servicios integer not null default 1
    check (mostrar_servicios in (0, 1));
