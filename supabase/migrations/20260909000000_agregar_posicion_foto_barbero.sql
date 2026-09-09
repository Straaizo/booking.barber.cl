-- Foco de la foto de cada barbero dentro del círculo del avatar — el dueño
-- puede elegir qué parte de la foto queda visible en vez de que siempre se
-- recorte al centro (`object-position`, 0-100 en cada eje). 50/50 = centrado,
-- el mismo resultado que había antes de esta columna para cualquier foto ya
-- subida.
alter table barberos
  add column foto_posicion_x smallint not null default 50 check (foto_posicion_x between 0 and 100),
  add column foto_posicion_y smallint not null default 50 check (foto_posicion_y between 0 and 100);
