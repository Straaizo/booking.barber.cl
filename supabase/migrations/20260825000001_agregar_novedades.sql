-- "Novedades" — actualizaciones/funcionalidades nuevas de la plataforma,
-- mostradas como carrusel en el landing (Home) para transmitir que el
-- producto está vivo y mejorando. El superadmin las agrega/edita/oculta
-- desde /admin/novedades — mismo patrón de `activo` que ya usa `planes`
-- (ARREGLO 6): ocultar sin borrar, por si se quiere reactivar después.
create table novedades (
  id          integer generated always as identity primary key,
  titulo      text not null,
  descripcion text not null,
  -- Badge corta opcional sobre la card (ej: "Nuevo", "Mejora") — libre, no
  -- un enum fijo, para no tener que migrar cada vez que se quiera una
  -- categoría nueva.
  etiqueta    text,
  fecha       date not null default current_date,
  orden       integer not null default 0,
  activo      integer not null default 1 check (activo in (0,1))
);

alter table novedades enable row level security;

-- Público (landing, sin sesión): solo las activas.
create policy novedades_publico on novedades
  for select to anon
  using (activo = 1);

-- Cualquier autenticado ve las activas; el superadmin ve todas (para poder
-- reactivar una que ocultó) — mismo criterio que `barberias_lectura_auth`.
create policy novedades_lectura_auth on novedades
  for select to authenticated
  using (
    activo = 1
    or (select rol_id from mi_perfil()) = 1
  );

create policy novedades_insert_superadmin on novedades
  for insert to authenticated
  with check ((select rol_id from mi_perfil()) = 1);

create policy novedades_update_superadmin on novedades
  for update to authenticated
  using ((select rol_id from mi_perfil()) = 1);

create policy novedades_delete_superadmin on novedades
  for delete to authenticated
  using ((select rol_id from mi_perfil()) = 1);
