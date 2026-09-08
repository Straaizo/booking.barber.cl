-- Reemplaza el `barbero_id` único de `servicios` (un solo barbero puntual o
-- compartido) por una tabla puente many-to-many: un servicio puede quedar
-- asignado a varios barberos a la vez, no solo a uno. Sin filas en
-- `servicio_barberos` para un servicio, sigue siendo compartido (cualquier
-- barbero activo lo ofrece) — mismo comportamiento de antes, solo que ahora
-- "asignado" admite más de un barbero.

create table servicio_barberos (
  servicio_id integer not null,
  barberia_id integer not null,
  barbero_id  integer not null,

  primary key (servicio_id, barbero_id),

  constraint servicio_barberos_servicio_fk
    foreign key (servicio_id, barberia_id)
    references servicios(id, barberia_id) on delete cascade,

  constraint servicio_barberos_barbero_fk
    foreign key (barbero_id, barberia_id)
    references barberos(id, barberia_id) on delete cascade
);

create index idx_servicio_barberos_barbero on servicio_barberos (barbero_id);

-- Migra las asignaciones puntuales que ya existían.
insert into servicio_barberos (servicio_id, barberia_id, barbero_id)
select id, barberia_id, barbero_id from servicios where barbero_id is not null;


-- ---------- se saca el viejo esquema de "catálogo propio" ----------
drop trigger if exists trg_validar_servicio_catalogo on servicios;
drop function if exists validar_servicio_catalogo_propio();
drop trigger if exists trg_validar_apagar_catalogo on barberos;
drop function if exists validar_apagar_catalogo_propio();


-- ---------- la reserva ahora valida contra la tabla puente ----------
-- Reemplaza a la versión vieja (comparaba `usa_catalogo_propio` del barbero
-- contra el `barbero_id` único del servicio). La reutilizan sin cambios los
-- triggers `trg_reservas_30_validar_servicio` (insert) y `trg_reservas_u30`
-- (reprogramar, ver 20260824000002_reprogramar_reservas.sql).
create or replace function validar_servicio_barbero()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_restringido boolean;
  v_asignado    boolean;
begin
  select exists (select 1 from servicio_barberos where servicio_id = new.servicio_id)
    into v_restringido;

  if v_restringido then
    select exists (
      select 1 from servicio_barberos
      where servicio_id = new.servicio_id and barbero_id = new.barbero_id
    ) into v_asignado;

    if not v_asignado then
      raise exception 'Este barbero no ofrece el servicio seleccionado';
    end if;
  end if;

  return new;
end;
$$;


-- ---------- políticas de servicios: sacar la rama del barbero (rol 3) ----------
-- Hay que reemplazarlas ANTES de tocar la columna: las viejas la referencian
-- en su `using`/`with check` (rol 3 = barbero escribiendo su propio
-- catálogo), y Postgres no deja hacer `drop column` mientras una policy siga
-- dependiendo de ella. El barbero ya no administra su propio catálogo (ver
-- PanelBarberoServicios.jsx, ahora es de solo lectura).
drop policy if exists servicios_insert on servicios;
create policy servicios_insert on servicios
  for insert to authenticated
  with check (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
  );

drop policy if exists servicios_update on servicios;
create policy servicios_update on servicios
  for update to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
  )
  with check (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
  );

drop policy if exists servicios_delete on servicios;
create policy servicios_delete on servicios
  for delete to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
  );


-- ---------- ya no hacen falta las columnas del esquema viejo ----------
drop view if exists servicios_publicos;

alter table servicios drop constraint if exists servicios_barbero_fk;
drop index if exists idx_servicios_barbero;
alter table servicios drop column if exists barbero_id;

alter table barberos drop column if exists usa_catalogo_propio;

create view servicios_publicos
with (security_invoker = true) as
select
  s.id,
  s.barberia_id,
  s.nombre,
  s.duracion_minutos,
  s.precio_clp,
  case
    when s.oferta_activa = 1 and s.precio_oferta is not null
     and (s.oferta_vence is null or s.oferta_vence >= current_date)
    then s.precio_oferta else s.precio_clp
  end as precio_vigente_clp,
  case
    when s.oferta_activa = 1 and s.precio_oferta is not null
     and (s.oferta_vence is null or s.oferta_vence >= current_date)
    then 1 else 0
  end as tiene_oferta_vigente
from servicios s
where s.activo = 1;

grant select on servicios_publicos to anon, authenticated;


-- ---------- RLS de la tabla puente ----------
alter table servicio_barberos enable row level security;

create policy servicio_barberos_publico on servicio_barberos
  for select to anon
  using (
    exists (select 1 from barberias b
            where b.id = servicio_barberos.barberia_id and b.estado_id = 1)
  );

create policy servicio_barberos_lectura_auth on servicio_barberos
  for select to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or barberia_id = (select barberia_id from mi_perfil())
    or exists (select 1 from barberias b
               where b.id = servicio_barberos.barberia_id and b.estado_id = 1)
  );

create policy servicio_barberos_insert on servicio_barberos
  for insert to authenticated
  with check (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
  );

create policy servicio_barberos_delete on servicio_barberos
  for delete to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
  );

grant select on servicio_barberos to anon, authenticated;
grant insert, delete on servicio_barberos to authenticated;
