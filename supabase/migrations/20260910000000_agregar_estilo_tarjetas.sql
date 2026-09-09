-- Cómo se ven las tarjetas/tablas de toda la página pública (testimonios,
-- equipo, horario, servicios, el asistente de reserva) — un solo valor que
-- las afecta a todas a la vez, para que la página se sienta de una sola
-- pieza en vez de una mezcla de estilos sueltos.
alter table personalizacion
  add column estilo_tarjetas text not null default 'bordes'
    check (estilo_tarjetas in ('bordes', 'flotante', 'plano'));
