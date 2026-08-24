-- =====================================================================
-- booking.barber.cl — esquema completo
-- Plataforma SaaS multi-tenant de reservas para barberías chilenas
--
-- Convención de tipos:
--   integer  -> todo número, incluidos los booleanos lógicos (0/1)
--   text     -> toda cadena
--   nativos  -> timestamptz / date / time
--   uuid     -> ÚNICAMENTE usuarios.id (= auth.users.id)
--
-- Zona horaria de negocio: America/Santiago (fija, decisión tomada)
-- =====================================================================
  

-- =====================================================================
-- 1. EXTENSIONES Y TIPOS
-- =====================================================================

create extension if not exists btree_gist;

-- Postgres no trae un rango sobre `time`. Lo necesita la restricción de
-- exclusión que impide bloques de horario solapados.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'timerange') then
    create type timerange as range (subtype = time);
  end if;
end $$;


-- =====================================================================
-- 2. CATÁLOGOS
-- ids fijos: el frontend los conoce como constantes
-- =====================================================================

create table roles (
  id     integer primary key,
  nombre text not null unique
);

insert into roles (id, nombre) values
  (1, 'superadmin'),
  (2, 'admin'),
  (3, 'barbero');


create table estados_barberia (
  id     integer primary key,
  nombre text not null unique
);

insert into estados_barberia (id, nombre) values
  (1, 'Activo'),
  (2, 'Inactivo'),
  (3, 'Suspendido por pago'),
  (4, 'Pendiente de activación');


create table planes (
  id           integer primary key,
  nombre       text not null,
  precio_clp   integer not null check (precio_clp >= 0),
  max_barberos integer not null check (max_barberos > 0),
  orden        integer not null,
  -- [ARREGLO 6] permite retirar un plan de la página pública sin borrarlo:
  -- las barberías que ya lo contrataron lo conservan
  activo       integer not null default 1 check (activo in (0,1))
);

insert into planes (id, nombre, precio_clp, max_barberos, orden) values
  (1, 'Solo',    5000,  1, 1),
  (2, 'Equipo',  6000,  3, 2),
  (3, 'Estudio', 7000, 99, 3);


-- =====================================================================
-- 3. TABLAS DE NEGOCIO
-- =====================================================================

create table barberias (
  id                integer generated always as identity primary key,
  nombre            text not null,
  slug              text not null unique,
  estado_id         integer not null references estados_barberia(id) default 4,
  plan_id           integer not null references planes(id),
  telefono_whatsapp text not null default '',
  email_contacto    text not null default '',
  direccion         text not null default '',
  logo_url          text,
  fecha_alta        timestamptz,   -- primera entrada a Activo. NUNCA se pisa.
  fecha_activacion  timestamptz,   -- última entrada a Activo (alta o reactivación)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint barberias_slug_formato
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 60),

  -- [ARREGLO 4] Desacopla el slug de decisiones de ruteo futuras.
  -- Hoy las páginas viven en /barberias/:slug y no chocarían con /admin,
  -- pero sí chocarían con sub-rutas como /barberias/nuevo, y volverían a
  -- chocar si alguna vez se mueve el slug a la raíz del dominio.
  -- Mantener sincronizada con las rutas reales del frontend.
  constraint barberias_slug_no_reservado
    check (slug not in (
      'nuevo','nueva','crear','editar','buscar','listado',
      'admin','login','panel','api','app','www','auth',
      'demo','assets','static','public','404','health'
    ))
);


create table barberos (
  id                        integer generated always as identity primary key,
  barberia_id               integer not null references barberias(id) on delete cascade,
  nombre                    text not null,
  activo                    integer not null default 1 check (activo in (0,1)),
  foto_url                  text,
  especialidad              text not null default '',
  usa_catalogo_propio       integer not null default 0 check (usa_catalogo_propio in (0,1)),
  -- [ARREGLO 2] Lista blanca, no `> 0`. Un 0 causaría división por cero en la
  -- validación de rejilla; valores como 7 o 13 romperían la grilla de forma
  -- difícil de depurar. Debe coincidir con las opciones de la UI.
  intervalo_reserva_minutos integer not null default 30
    check (intervalo_reserva_minutos in (15,20,30,45,60,90)),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  -- clave candidata compuesta: la usan las FK de servicios, usuarios y reservas
  -- para garantizar que nada cruce de tenant
  unique (id, barberia_id)
);


-- Único uuid del esquema. id = auth.users.id, 1:1, nunca un PK propio.
create table usuarios (
  id            uuid primary key references auth.users(id) on delete cascade,
  usuario       text not null unique,
  email_tecnico text not null unique,
  nombre        text not null,
  rol_id        integer not null references roles(id),
  barberia_id   integer references barberias(id) on delete cascade,
  barbero_id    integer unique,
  created_at    timestamptz not null default now(),

  constraint usuarios_coherencia_rol check (
       (rol_id = 1 and barberia_id is null     and barbero_id is null)
    or (rol_id = 2 and barberia_id is not null and barbero_id is null)
    or (rol_id = 3 and barberia_id is not null and barbero_id is not null)
  ),

  -- MATCH SIMPLE: cuando barbero_id/barberia_id son null la FK no se evalúa,
  -- que es exactamente lo que queremos para superadmin y dueño.
  constraint usuarios_barbero_fk
    foreign key (barbero_id, barberia_id)
    references barberos(id, barberia_id) on delete cascade
);


-- 1:1 con barberias. Se crea sola vía trigger.
create table personalizacion (
  barberia_id      integer primary key references barberias(id) on delete cascade,
  color_primario   text,
  color_header     text,
  fuente_display   text not null default 'fraunces',
  eslogan          text not null default '',
  descripcion      text not null default '',
  banner_url       text,
  secciones        jsonb not null default '[]',
  orden_equipo     jsonb not null default '[]',
  estilo_whatsapp  text not null default 'enlace'
    check (estilo_whatsapp in ('enlace','burbuja')),
  whatsapp_color   text,
  whatsapp_tamano  text not null default 'mediana'
    check (whatsapp_tamano in ('pequena','mediana','grande')),
  updated_at       timestamptz not null default now(),

  constraint personalizacion_secciones_es_array
    check (jsonb_typeof(secciones) = 'array'),
  constraint personalizacion_orden_equipo_es_array
    check (jsonb_typeof(orden_equipo) = 'array')
);


-- barbero_id nulo = catálogo compartido de la barbería
-- barbero_id con valor = catálogo propio de ese barbero
create table servicios (
  id               integer generated always as identity primary key,
  barberia_id      integer not null references barberias(id) on delete cascade,
  barbero_id       integer,
  nombre           text not null,
  duracion_minutos integer not null,
  precio_clp       integer not null,
  precio_oferta    integer,
  oferta_activa    integer not null default 0 check (oferta_activa in (0,1)),
  oferta_vence     date,
  activo           integer not null default 1 check (activo in (0,1)),

  unique (id, barberia_id),

  constraint servicios_precios_positivos
    check (precio_clp > 0 and duracion_minutos > 0 and duracion_minutos <= 480),

  constraint servicios_oferta_coherente check (
    oferta_activa = 0
    or (precio_oferta is not null and precio_oferta > 0 and precio_oferta < precio_clp)
  ),

  constraint servicios_barbero_fk
    foreign key (barbero_id, barberia_id)
    references barberos(id, barberia_id) on delete cascade
);


-- Bloques recurrentes por día de la semana (0 domingo .. 6 sábado)
create table horarios_disponibles (
  id          integer generated always as identity primary key,
  barbero_id  integer not null references barberos(id) on delete cascade,
  dia_semana  integer not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fin    time not null,
  activo      integer not null default 1 check (activo in (0,1)),

  constraint horarios_rango_valido check (hora_fin > hora_inicio),

  -- dos bloques activos del mismo barbero y día no pueden pisarse
  constraint horarios_sin_solape
    exclude using gist (
      barbero_id with =,
      dia_semana with =,
      timerange(hora_inicio, hora_fin) with &&
    ) where (activo = 1)
);


-- Una fecha puntual reemplaza por completo el horario semanal de ese día
create table excepciones_horario (
  id          integer generated always as identity primary key,
  barbero_id  integer not null references barberos(id) on delete cascade,
  fecha       date not null,
  hora_inicio time,
  hora_fin    time,
  cerrado     integer not null default 0 check (cerrado in (0,1)),

  unique (barbero_id, fecha),

  constraint excepciones_coherentes check (
       (cerrado = 1 and hora_inicio is null and hora_fin is null)
    or (cerrado = 0 and hora_inicio is not null and hora_fin is not null
        and hora_fin > hora_inicio)
  )
);


create table reservas (
  id                       integer generated always as identity primary key,
  barberia_id              integer not null references barberias(id) on delete restrict,
  barbero_id               integer not null,
  servicio_id              integer not null,
  cliente_nombre           text not null,
  cliente_telefono         text not null,            -- normalizado por trigger
  fecha_hora               timestamptz not null,
  -- Los tres snapshots los llena un trigger BEFORE INSERT, que corre antes de
  -- la verificación de constraints: por eso pueden ser NOT NULL sin default real.
  -- NOTA: reagendar (cambiar fecha_hora de una reserva existente) NO está
  -- soportado — no hay trigger de UPDATE que recalcule estos valores.
  -- El flujo correcto hoy es cancelar y crear una reserva nueva.
  duracion_minutos         integer not null,
  fecha_hora_fin           timestamptz not null,
  precio_cobrado_clp       integer not null default 0,   -- snapshot vía trigger
  servicio_nombre_snapshot text not null default '',     -- snapshot vía trigger
  estado                   text not null default 'confirmada'
    check (estado in ('confirmada','cancelada')),
  -- token opaco que viaja en el mensaje de confirmación al cliente.
  -- Permite cancelar sin exponer ningún SELECT público sobre esta tabla.
  token_cancelacion        text not null default replace(gen_random_uuid()::text, '-', ''),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  constraint reservas_barbero_fk
    foreign key (barbero_id, barberia_id)
    references barberos(id, barberia_id) on delete restrict,

  constraint reservas_servicio_fk
    foreign key (servicio_id, barberia_id)
    references servicios(id, barberia_id) on delete restrict
);

-- El doble-booking es imposible a nivel de motor, no de aplicación.
-- Al agregar estados como 'completada' en el futuro, revisar este filtro:
-- una cita completada probablemente también debe seguir bloqueando su franja.
alter table reservas
  add constraint reservas_sin_solape
  exclude using gist (
    barbero_id with =,
    tstzrange(fecha_hora, fecha_hora_fin) with &&
  ) where (estado = 'confirmada');

create unique index idx_reservas_token on reservas (token_cancelacion);


create table historial_estados (
  id                      integer generated always as identity primary key,
  barberia_id             integer not null references barberias(id) on delete restrict,
  -- nullable a propósito: la auditoría sobrevive al actor
  usuario_id              uuid references usuarios(id) on delete set null,
  usuario_nombre_snapshot text not null default '',
  estado_anterior_id      integer not null references estados_barberia(id),
  estado_nuevo_id         integer not null references estados_barberia(id),
  motivo                  text not null,
  created_at              timestamptz not null default now()
);


create table pagos (
  id                 integer generated always as identity primary key,
  barberia_id        integer not null references barberias(id) on delete restrict,
  plan_id            integer not null references planes(id),
  monto_clp          integer not null check (monto_clp > 0),
  periodo_inicio     date not null,
  periodo_fin        date not null,
  pagado_at          timestamptz,
  metodo             text not null default '',
  referencia_externa text,
  estado             text not null default 'pendiente'
    check (estado in ('pendiente','pagado','vencido','anulado')),
  created_at         timestamptz not null default now(),

  constraint pagos_periodo_valido check (periodo_fin > periodo_inicio),

  constraint pagos_estado_coherente check (
       (estado =  'pagado' and pagado_at is not null)
    or (estado <> 'pagado' and pagado_at is null)
  ),

  -- un pago anulado y su reemplazo pueden convivir en el mismo período
  constraint pagos_sin_periodo_duplicado
    exclude using gist (
      barberia_id with =,
      daterange(periodo_inicio, periodo_fin, '[)') with &&
    ) where (estado in ('pendiente','pagado'))
);


-- =====================================================================
-- 4. FUNCIONES AUXILIARES
--
-- Todas las `security definer` fijan search_path explícitamente: sin eso,
-- un rol con permiso de crear objetos podría anteponer un esquema propio
-- y secuestrar la resolución de nombres dentro de la función.
-- =====================================================================

-- Resuelve el perfil de quien está autenticado.
-- Es `security definer` para poder leer `usuarios` sin que las policies de
-- esa misma tabla se evalúen recursivamente. Es `stable` para que el planner
-- la cachee dentro de una misma consulta.
create or replace function mi_perfil()
returns table (rol_id integer, barberia_id integer, barbero_id integer)
language sql
stable
security definer
set search_path = public
as $$
  select u.rol_id, u.barberia_id, u.barbero_id
  from usuarios u
  where u.id = auth.uid();
$$;


-- Único lugar que decide cuánto cuesta un servicio AHORA.
create or replace function precio_vigente(p_servicio_id integer)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case
    when s.oferta_activa = 1
     and s.precio_oferta is not null
     and (s.oferta_vence is null or s.oferta_vence >= current_date)
    then s.precio_oferta
    else s.precio_clp
  end
  from servicios s
  where s.id = p_servicio_id;
$$;


-- Devuelve el bloque de atención aplicable a un instante dado, o ninguna fila
-- si el barbero no atiende entonces. Una excepción para esa fecha reemplaza
-- por completo el horario semanal.
create or replace function bloque_atencion(
  p_barbero_id integer,
  p_momento    timestamptz
)
returns table (hora_inicio time, hora_fin time)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_local     timestamp := p_momento at time zone 'America/Santiago';
  v_fecha     date      := v_local::date;
  v_hora      time      := v_local::time;
  v_dia       integer   := extract(dow from v_local)::integer;
  v_excepcion record;
begin
  select e.cerrado, e.hora_inicio, e.hora_fin
    into v_excepcion
  from excepciones_horario e
  where e.barbero_id = p_barbero_id and e.fecha = v_fecha;

  if found then
    if v_excepcion.cerrado = 1 then
      return;  -- cerrado ese día: ninguna fila
    end if;
    if v_hora >= v_excepcion.hora_inicio and v_hora < v_excepcion.hora_fin then
      hora_inicio := v_excepcion.hora_inicio;
      hora_fin    := v_excepcion.hora_fin;
      return next;
    end if;
    return;  -- hay excepción pero la hora cae fuera de ella
  end if;

  return query
    select h.hora_inicio, h.hora_fin
    from horarios_disponibles h
    where h.barbero_id = p_barbero_id
      and h.dia_semana = v_dia
      and h.activo = 1
      and v_hora >= h.hora_inicio
      and v_hora <  h.hora_fin
    limit 1;
end;
$$;


-- ¿Cabe completo un rango [inicio, fin) dentro del horario de atención?
-- La usa tanto el trigger de validación como reservas_en_conflicto().
create or replace function existe_disponibilidad(
  p_barbero_id integer,
  p_inicio     timestamptz,
  p_fin        timestamptz
)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_bloque   record;
  v_hora_fin time := (p_fin at time zone 'America/Santiago')::time;
begin
  select * into v_bloque from bloque_atencion(p_barbero_id, p_inicio);

  if not found then
    return 0;
  end if;

  -- el servicio no puede desbordar el cierre del bloque
  if v_hora_fin > v_bloque.hora_fin then
    return 0;
  end if;

  return 1;
end;
$$;


-- =====================================================================
-- 5. TRIGGERS
-- =====================================================================

-- ---------- updated_at genérico ----------
create or replace function tocar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_updated_at_barberias
  before update on barberias
  for each row execute function tocar_updated_at();

create trigger trg_updated_at_barberos
  before update on barberos
  for each row execute function tocar_updated_at();

create trigger trg_updated_at_personalizacion
  before update on personalizacion
  for each row execute function tocar_updated_at();

create trigger trg_updated_at_reservas
  before update on reservas
  for each row execute function tocar_updated_at();


-- ---------- personalización 1:1 automática ----------
create or replace function crear_personalizacion_default()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into personalizacion (barberia_id) values (new.id)
  on conflict (barberia_id) do nothing;
  return new;
end;
$$;

create trigger trg_crear_personalizacion
  after insert on barberias
  for each row execute function crear_personalizacion_default();


-- ---------- el estado de una barbería solo cambia por su función ----------
create or replace function proteger_estado_barberia()
returns trigger
language plpgsql
as $$
begin
  if new.estado_id is distinct from old.estado_id
     and current_setting('app.cambio_estado_autorizado', true) is distinct from 'si' then
    raise exception
      'El estado de una barbería solo puede cambiarse con cambiar_estado_barberia()';
  end if;
  return new;
end;
$$;

create trigger trg_proteger_estado
  before update on barberias
  for each row execute function proteger_estado_barberia();


-- ---------- límite de barberos según el plan ----------
create or replace function validar_limite_barberos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max      integer;
  v_actuales integer;
begin
  if new.activo = 0 then
    return new;
  end if;

  select p.max_barberos into v_max
  from barberias b
  join planes p on p.id = b.plan_id
  where b.id = new.barberia_id;

  select count(*) into v_actuales
  from barberos
  where barberia_id = new.barberia_id
    and activo = 1
    and id is distinct from new.id;

  if v_actuales >= v_max then
    raise exception
      'El plan contratado permite un máximo de % barbero(s) activo(s)', v_max;
  end if;

  return new;
end;
$$;

create trigger trg_validar_limite_barberos
  before insert or update on barberos
  for each row execute function validar_limite_barberos();


-- ---------- no se puede bajar de plan si ya se excede el límite nuevo ----------
create or replace function validar_baja_de_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max      integer;
  v_actuales integer;
begin
  if new.plan_id is not distinct from old.plan_id then
    return new;
  end if;

  select max_barberos into v_max from planes where id = new.plan_id;

  select count(*) into v_actuales
  from barberos where barberia_id = new.id and activo = 1;

  if v_actuales > v_max then
    raise exception
      'Esta barbería tiene % barberos activos y el plan nuevo permite %. Desactiva % antes de cambiar de plan.',
      v_actuales, v_max, v_actuales - v_max;
  end if;

  return new;
end;
$$;

create trigger trg_validar_baja_de_plan
  before update on barberias
  for each row execute function validar_baja_de_plan();


-- ---------- [ARREGLO 1] coherencia de usa_catalogo_propio ----------
-- Caso (b): un servicio solo puede asignarse a un barbero que efectivamente
-- tenga catálogo propio activado.
create or replace function validar_servicio_catalogo_propio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usa_propio integer;
begin
  if new.barbero_id is null then
    return new;
  end if;

  select usa_catalogo_propio into v_usa_propio
  from barberos where id = new.barbero_id;

  if v_usa_propio = 0 then
    raise exception
      'Este barbero no tiene catálogo propio activado. Actívalo antes de asignarle servicios.';
  end if;

  return new;
end;
$$;

create trigger trg_validar_servicio_catalogo
  before insert or update on servicios
  for each row execute function validar_servicio_catalogo_propio();


-- Caso inverso: apagar el catálogo propio de un barbero que ya tiene servicios
-- dejaría esos servicios huérfanos. Se bloquea, igual criterio que la baja de plan.
create or replace function validar_apagar_catalogo_propio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_servicios integer;
begin
  if new.usa_catalogo_propio = 1 or old.usa_catalogo_propio = 0 then
    return new;
  end if;

  select count(*) into v_servicios
  from servicios where barbero_id = new.id;

  if v_servicios > 0 then
    raise exception
      'Este barbero tiene % servicio(s) propio(s). Elimínalos o reasígnalos antes de desactivar su catálogo propio.',
      v_servicios;
  end if;

  return new;
end;
$$;

create trigger trg_validar_apagar_catalogo
  before update on barberos
  for each row execute function validar_apagar_catalogo_propio();


-- ---------- normalización de teléfono ----------
create or replace function normalizar_telefono()
returns trigger
language plpgsql
as $$
begin
  new.cliente_telefono := regexp_replace(new.cliente_telefono, '[^0-9]', '', 'g');

  -- 9 dígitos = celular chileno sin código de país
  if length(new.cliente_telefono) = 9 then
    new.cliente_telefono := '56' || new.cliente_telefono;
  end if;

  if length(new.cliente_telefono) <> 11
     or left(new.cliente_telefono, 3) <> '569' then
    raise exception
      'Teléfono inválido. Debe ser un celular chileno de 9 dígitos (9 XXXX XXXX).';
  end if;

  return new;
end;
$$;


-- ---------- snapshots de la reserva ----------
-- Siempre desde el servicio real, nunca desde lo que mande el cliente.
create or replace function calcular_datos_reserva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_servicio record;
begin
  select nombre, duracion_minutos into v_servicio
  from servicios
  where id = new.servicio_id and activo = 1;

  if not found then
    raise exception 'El servicio seleccionado no existe o no está disponible';
  end if;

  new.duracion_minutos         := v_servicio.duracion_minutos;
  new.servicio_nombre_snapshot := v_servicio.nombre;
  new.precio_cobrado_clp       := precio_vigente(new.servicio_id);
  new.fecha_hora_fin           := new.fecha_hora
                                  + make_interval(mins => v_servicio.duracion_minutos);
  return new;
end;
$$;


-- ---------- el servicio debe ser reservable con ese barbero ----------
create or replace function validar_servicio_barbero()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usa_propio           integer;
  v_barbero_del_servicio integer;
begin
  select usa_catalogo_propio into v_usa_propio
  from barberos where id = new.barbero_id;

  select barbero_id into v_barbero_del_servicio
  from servicios where id = new.servicio_id;

  -- [ARREGLO 1] caso (a): si el barbero tiene catálogo propio, solo sus servicios.
  -- Sin esto seguiría siendo reservable con servicios del catálogo compartido,
  -- a precios que no son los suyos.
  if v_usa_propio = 1 and v_barbero_del_servicio is distinct from new.barbero_id then
    raise exception 'Este barbero solo atiende servicios de su propio catálogo';
  end if;

  -- un servicio propio de otro barbero nunca es reservable acá
  if v_barbero_del_servicio is not null
     and v_barbero_del_servicio <> new.barbero_id then
    raise exception 'Ese servicio pertenece al catálogo de otro barbero';
  end if;

  return new;
end;
$$;


-- ---------- disponibilidad real ----------
create or replace function validar_disponibilidad_reserva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bloque    record;
  v_intervalo integer;
  v_hora_ini  time;
  v_minutos   integer;
  v_recientes integer;
begin
  if new.fecha_hora <= now() then
    raise exception 'No se puede reservar en el pasado';
  end if;

  if new.fecha_hora > now() + interval '6 months' then
    raise exception 'No se puede reservar con más de 6 meses de anticipación';
  end if;

  select * into v_bloque from bloque_atencion(new.barbero_id, new.fecha_hora);
  if not found then
    raise exception 'El barbero no atiende en ese horario';
  end if;

  v_hora_ini := (new.fecha_hora at time zone 'America/Santiago')::time;

  if (new.fecha_hora_fin at time zone 'America/Santiago')::time > v_bloque.hora_fin then
    raise exception 'La duración del servicio excede el horario de atención';
  end if;

  -- Rejilla anclada al inicio del bloque real, no a la hora en punto.
  -- Un barbero que abre 09:30 con intervalo de 45 min tiene su grilla en
  -- 09:30, 10:15, 11:00... no en 09:00, 09:45, 10:30.
  select intervalo_reserva_minutos into v_intervalo
  from barberos where id = new.barbero_id;

  v_minutos := (extract(epoch from (v_hora_ini - v_bloque.hora_inicio)) / 60)::integer;

  if v_minutos % v_intervalo <> 0 then
    raise exception 'La hora debe estar alineada a bloques de % minutos', v_intervalo;
  end if;

  -- Antispam básico. No es una defensa real (el teléfono es autodeclarado),
  -- solo sube el costo del abuso. Ver pendiente de rate limiting.
  --
  -- [SUPERADO] Este bloque (5 por hora) quedó reemplazado por un
  -- enfriamiento de 12 minutos por teléfono — ver el `create or replace
  -- function` de esta misma función en
  -- 20260824000000_reforzar_seguridad_reservas.sql. Se deja este texto tal
  -- cual (es el de la migración original, ya corrida) en vez de reescribirlo
  -- acá, para no desincronizar este archivo del historial real.
  select count(*) into v_recientes
  from reservas
  where cliente_telefono = new.cliente_telefono
    and created_at > now() - interval '1 hour';

  if v_recientes >= 5 then
    raise exception 'Demasiadas reservas desde este número. Inténtalo más tarde.';
  end if;

  return new;
end;
$$;


-- IMPORTANTE: Postgres dispara los triggers BEFORE ROW en orden alfabético
-- por nombre de trigger. El prefijo numérico fija el orden correcto:
-- normalizar teléfono -> calcular snapshots (necesario para fecha_hora_fin)
-- -> validar servicio/barbero -> validar disponibilidad.
create trigger trg_reservas_10_normalizar_telefono
  before insert on reservas
  for each row execute function normalizar_telefono();

create trigger trg_reservas_20_calcular_datos
  before insert on reservas
  for each row execute function calcular_datos_reserva();

create trigger trg_reservas_30_validar_servicio
  before insert on reservas
  for each row execute function validar_servicio_barbero();

create trigger trg_reservas_40_validar_disponibilidad
  before insert on reservas
  for each row execute function validar_disponibilidad_reserva();


-- ---------- [ARREGLO 3] no cerrar un día con reservas confirmadas ----------
create or replace function advertir_reservas_afectadas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if new.cerrado = 0 then
    return new;
  end if;

  select count(*) into v_count
  from reservas
  where barbero_id = new.barbero_id
    and estado = 'confirmada'
    and fecha_hora > now()
    and (fecha_hora at time zone 'America/Santiago')::date = new.fecha;

  if v_count > 0 then
    raise exception
      'Hay % reserva(s) confirmada(s) ese día. Cancélalas y avisa a los clientes antes de cerrar la agenda.',
      v_count;
  end if;

  return new;
end;
$$;

create trigger trg_advertir_reservas_afectadas
  before insert or update on excepciones_horario
  for each row execute function advertir_reservas_afectadas();


-- Los demás cambios de horario (achicar un bloque, desactivarlo) no se bloquean
-- porque el caso es más ambiguo: se exponen para que el panel los muestre.
create or replace function reservas_en_conflicto(p_barbero_id integer)
returns setof reservas
language sql
stable
security definer
set search_path = public
as $$
  select r.*
  from reservas r
  where r.barbero_id = p_barbero_id
    and r.estado = 'confirmada'
    and r.fecha_hora > now()
    and existe_disponibilidad(r.barbero_id, r.fecha_hora, r.fecha_hora_fin) = 0;
$$;


-- =====================================================================
-- 6. VISTA PÚBLICA DE SERVICIOS
--
-- security_invoker = true hace que respete las policies RLS de quien
-- consulta, no las del dueño de la vista. Sin esto sería un agujero.
-- =====================================================================

create view servicios_publicos
with (security_invoker = true) as
select
  s.id,
  s.barberia_id,
  s.barbero_id,
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


-- =====================================================================
-- 7. FUNCIONES RPC
-- =====================================================================

-- Devuelve solo los rangos ocupados de un barbero en una fecha.
-- Nunca expone nombre ni teléfono de los clientes.
create or replace function horas_ocupadas(
  p_barbero_id integer,
  p_fecha      date
)
returns table (inicio timestamptz, fin timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select r.fecha_hora, r.fecha_hora_fin
  from reservas r
  where r.barbero_id = p_barbero_id
    and r.estado = 'confirmada'
    and (r.fecha_hora at time zone 'America/Santiago')::date = p_fecha
  order by r.fecha_hora;
$$;


-- Cambia el estado de una barbería y escribe la auditoría en una transacción.
create or replace function cambiar_estado_barberia(
  p_barberia_id     integer,
  p_estado_nuevo_id integer,
  p_motivo          text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil   record;
  v_actual   integer;
  v_nombre   text;
begin
  select * into v_perfil from mi_perfil();

  if v_perfil.rol_id is distinct from 1 then
    raise exception 'Solo un superadmin puede cambiar el estado de una barbería';
  end if;

  if coalesce(trim(p_motivo), '') = '' then
    raise exception 'El motivo del cambio de estado es obligatorio';
  end if;

  select estado_id into v_actual from barberias where id = p_barberia_id;

  if v_actual is null then
    raise exception 'La barbería % no existe', p_barberia_id;
  end if;

  -- [ARREGLO 7] sin esta guarda, llamar con el mismo estado llenaría el
  -- historial de filas que no representan ningún cambio
  if v_actual = p_estado_nuevo_id then
    return;
  end if;

  select nombre into v_nombre from usuarios where id = auth.uid();

  -- habilita el trigger protector solo dentro de esta transacción
  perform set_config('app.cambio_estado_autorizado', 'si', true);

  update barberias
     set estado_id        = p_estado_nuevo_id,
         fecha_activacion = case when p_estado_nuevo_id = 1
                                 then now() else fecha_activacion end,
         fecha_alta       = case when p_estado_nuevo_id = 1 and fecha_alta is null
                                 then now() else fecha_alta end
   where id = p_barberia_id;

  perform set_config('app.cambio_estado_autorizado', 'no', true);

  insert into historial_estados (
    barberia_id, usuario_id, usuario_nombre_snapshot,
    estado_anterior_id, estado_nuevo_id, motivo
  ) values (
    p_barberia_id, auth.uid(), coalesce(v_nombre, ''),
    v_actual, p_estado_nuevo_id, trim(p_motivo)
  );
end;
$$;


-- Cancelación por parte del cliente, sin ningún SELECT público sobre reservas.
-- El token viaja en el mensaje de confirmación.
create or replace function cancelar_reserva_por_token(p_token text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id integer;
begin
  update reservas
     set estado = 'cancelada'
   where token_cancelacion = p_token
     and estado = 'confirmada'
     and fecha_hora > now() + interval '2 hours'
  returning id into v_id;

  if v_id is null then
    raise exception
      'No se pudo cancelar. La reserva ya fue cancelada, no existe, o falta menos de 2 horas.';
  end if;

  return v_id;
end;
$$;


-- =====================================================================
-- 8. ÍNDICES
--
-- Postgres NO crea índices automáticamente sobre las FK del lado que
-- referencia. Las restricciones de exclusión sí crean su índice GiST,
-- que ya cubre el acceso de horas_ocupadas() por (barbero_id, rango).
-- =====================================================================

create index idx_reservas_barberia_fecha  on reservas (barberia_id, fecha_hora desc);
create index idx_reservas_barbero_estado  on reservas (barbero_id, estado);
create index idx_barberos_barberia        on barberos (barberia_id);
create index idx_servicios_barberia       on servicios (barberia_id) where activo = 1;
create index idx_servicios_barbero        on servicios (barbero_id) where barbero_id is not null;
create index idx_horarios_barbero         on horarios_disponibles (barbero_id) where activo = 1;
create index idx_excepciones_barbero      on excepciones_horario (barbero_id, fecha);
create index idx_usuarios_barberia        on usuarios (barberia_id) where barberia_id is not null;
create index idx_historial_barberia       on historial_estados (barberia_id, created_at desc);
create index idx_pagos_barberia           on pagos (barberia_id, periodo_inicio desc);
create index idx_barberias_estado         on barberias (estado_id);


-- =====================================================================
-- 9. PERMISOS DE ESQUEMA
--
-- El proyecto se creó con "Automatically expose new tables" DESACTIVADO,
-- así que los grants son explícitos. Sin grant, ninguna policy sirve:
-- son dos capas distintas y se necesitan ambas.
-- =====================================================================

grant usage on schema public to anon, authenticated;

-- catálogos: lectura para todos
grant select on roles, estados_barberia, planes to anon, authenticated;

-- lectura pública de la vitrina
grant select on barberias, barberos, servicios, servicios_publicos,
                horarios_disponibles, excepciones_horario, personalizacion
  to anon, authenticated;

-- el público solo inserta reservas; nunca las lee (usa horas_ocupadas)
grant insert on reservas to anon, authenticated;
grant select, update on reservas to authenticated;

grant select on usuarios, historial_estados, pagos to authenticated;

grant insert, update, delete on
  barberias, barberos, servicios, horarios_disponibles,
  excepciones_horario, personalizacion, pagos
  to authenticated;

grant execute on function
  mi_perfil(), precio_vigente(integer),
  bloque_atencion(integer, timestamptz),
  existe_disponibilidad(integer, timestamptz, timestamptz),
  horas_ocupadas(integer, date),
  reservas_en_conflicto(integer),
  cambiar_estado_barberia(integer, integer, text)
  to authenticated;

grant execute on function
  horas_ocupadas(integer, date),
  cancelar_reserva_por_token(text)
  to anon;


-- =====================================================================
-- 10. ROW LEVEL SECURITY
--
-- Activar RLS y escribir policies son cosas separadas: una tabla con
-- policies pero sin `enable` queda completamente abierta, sin ningún
-- error visible. Por eso van juntas, tabla por tabla.
-- =====================================================================

alter table roles                enable row level security;
alter table estados_barberia     enable row level security;
alter table planes               enable row level security;
alter table barberias            enable row level security;
alter table barberos             enable row level security;
alter table usuarios             enable row level security;
alter table personalizacion      enable row level security;
alter table servicios            enable row level security;
alter table horarios_disponibles enable row level security;
alter table excepciones_horario  enable row level security;
alter table reservas             enable row level security;
alter table historial_estados    enable row level security;
alter table pagos                enable row level security;


-- ---------- catálogos: lectura para cualquiera ----------
create policy cat_roles_lectura   on roles            for select to anon, authenticated using (true);
create policy cat_estados_lectura on estados_barberia for select to anon, authenticated using (true);
create policy cat_planes_lectura  on planes           for select to anon, authenticated using (true);


-- ---------- barberias ----------
create policy barberias_publico on barberias
  for select to anon
  using (estado_id = 1);

create policy barberias_lectura_auth on barberias
  for select to authenticated
  using (
    estado_id = 1
    or (select rol_id from mi_perfil()) = 1
    or id = (select barberia_id from mi_perfil())
  );

create policy barberias_insert_superadmin on barberias
  for insert to authenticated
  with check ((select rol_id from mi_perfil()) = 1);

create policy barberias_update on barberias
  for update to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and id = (select barberia_id from mi_perfil()))
  )
  with check (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and id = (select barberia_id from mi_perfil()))
  );

-- sin policy de DELETE: nadie borra barberías (además de las FK en restrict)


-- ---------- barberos ----------
create policy barberos_publico on barberos
  for select to anon
  using (
    activo = 1
    and exists (select 1 from barberias b
                where b.id = barberos.barberia_id and b.estado_id = 1)
  );

create policy barberos_lectura_auth on barberos
  for select to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or barberia_id = (select barberia_id from mi_perfil())
    or exists (select 1 from barberias b
               where b.id = barberos.barberia_id and b.estado_id = 1)
  );

create policy barberos_escritura on barberos
  for insert to authenticated
  with check (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
  );

create policy barberos_update on barberos
  for update to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
    -- un barbero puede editar únicamente su propia ficha
    or ((select rol_id from mi_perfil()) = 3
        and id = (select barbero_id from mi_perfil()))
  )
  with check (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
    or ((select rol_id from mi_perfil()) = 3
        and id = (select barbero_id from mi_perfil()))
  );

create policy barberos_delete on barberos
  for delete to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
  );


-- ---------- usuarios ----------
-- Escritura exclusivamente por la Edge Function (service_role omite RLS).
-- Sin policies de insert/update/delete = denegado para todos los demás.
create policy usuarios_lectura on usuarios
  for select to authenticated
  using (
    id = auth.uid()
    or (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
  );


-- ---------- personalizacion ----------
create policy personalizacion_publico on personalizacion
  for select to anon
  using (
    exists (select 1 from barberias b
            where b.id = personalizacion.barberia_id and b.estado_id = 1)
  );

create policy personalizacion_lectura_auth on personalizacion
  for select to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or barberia_id = (select barberia_id from mi_perfil())
    or exists (select 1 from barberias b
               where b.id = personalizacion.barberia_id and b.estado_id = 1)
  );

create policy personalizacion_update on personalizacion
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


-- ---------- servicios ----------
create policy servicios_publico on servicios
  for select to anon
  using (
    activo = 1
    and exists (select 1 from barberias b
                where b.id = servicios.barberia_id and b.estado_id = 1)
  );

create policy servicios_lectura_auth on servicios
  for select to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or barberia_id = (select barberia_id from mi_perfil())
    or (activo = 1 and exists (select 1 from barberias b
                               where b.id = servicios.barberia_id and b.estado_id = 1))
  );

create policy servicios_insert on servicios
  for insert to authenticated
  with check (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
    -- el barbero solo puede crear servicios de su propio catálogo
    or ((select rol_id from mi_perfil()) = 3
        and barberia_id = (select barberia_id from mi_perfil())
        and barbero_id  = (select barbero_id from mi_perfil()))
  );

create policy servicios_update on servicios
  for update to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
    or ((select rol_id from mi_perfil()) = 3
        and barbero_id = (select barbero_id from mi_perfil()))
  )
  with check (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
    or ((select rol_id from mi_perfil()) = 3
        and barbero_id = (select barbero_id from mi_perfil()))
  );

create policy servicios_delete on servicios
  for delete to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
    or ((select rol_id from mi_perfil()) = 3
        and barbero_id = (select barbero_id from mi_perfil()))
  );


-- ---------- horarios_disponibles ----------
create policy horarios_publico on horarios_disponibles
  for select to anon
  using (
    activo = 1
    and exists (select 1 from barberos b
                join barberias ba on ba.id = b.barberia_id
                where b.id = horarios_disponibles.barbero_id
                  and b.activo = 1 and ba.estado_id = 1)
  );

create policy horarios_lectura_auth on horarios_disponibles
  for select to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or exists (select 1 from barberos b
               where b.id = horarios_disponibles.barbero_id
                 and (b.barberia_id = (select barberia_id from mi_perfil())
                      or b.activo = 1))
  );

create policy horarios_escritura on horarios_disponibles
  for all to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or exists (select 1 from barberos b
               where b.id = horarios_disponibles.barbero_id
                 and b.barberia_id = (select barberia_id from mi_perfil())
                 and ((select rol_id from mi_perfil()) = 2
                      or b.id = (select barbero_id from mi_perfil())))
  )
  with check (
    (select rol_id from mi_perfil()) = 1
    or exists (select 1 from barberos b
               where b.id = horarios_disponibles.barbero_id
                 and b.barberia_id = (select barberia_id from mi_perfil())
                 and ((select rol_id from mi_perfil()) = 2
                      or b.id = (select barbero_id from mi_perfil())))
  );


-- ---------- excepciones_horario ----------
create policy excepciones_publico on excepciones_horario
  for select to anon
  using (
    exists (select 1 from barberos b
            join barberias ba on ba.id = b.barberia_id
            where b.id = excepciones_horario.barbero_id
              and b.activo = 1 and ba.estado_id = 1)
  );

create policy excepciones_escritura on excepciones_horario
  for all to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or exists (select 1 from barberos b
               where b.id = excepciones_horario.barbero_id
                 and b.barberia_id = (select barberia_id from mi_perfil())
                 and ((select rol_id from mi_perfil()) = 2
                      or b.id = (select barbero_id from mi_perfil())))
  )
  with check (
    (select rol_id from mi_perfil()) = 1
    or exists (select 1 from barberos b
               where b.id = excepciones_horario.barbero_id
                 and b.barberia_id = (select barberia_id from mi_perfil())
                 and ((select rol_id from mi_perfil()) = 2
                      or b.id = (select barbero_id from mi_perfil())))
  );


-- ---------- reservas ----------
-- El público inserta pero NUNCA lee: expondría nombre y teléfono de los
-- clientes de cualquier barbería. La disponibilidad se consulta con
-- horas_ocupadas(), que devuelve solo los rangos.
create policy reservas_insert_publico on reservas
  for insert to anon, authenticated
  with check (
    exists (select 1 from barberias b
            where b.id = reservas.barberia_id and b.estado_id = 1)
  );

create policy reservas_lectura on reservas
  for select to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
    or ((select rol_id from mi_perfil()) = 3
        and barbero_id = (select barbero_id from mi_perfil()))
  );

create policy reservas_update on reservas
  for update to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
    or ((select rol_id from mi_perfil()) = 3
        and barbero_id = (select barbero_id from mi_perfil()))
  )
  with check (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
    or ((select rol_id from mi_perfil()) = 3
        and barbero_id = (select barbero_id from mi_perfil()))
  );


-- ---------- historial_estados ----------
-- Escribe únicamente cambiar_estado_barberia(). Sin policy de insert.
create policy historial_lectura on historial_estados
  for select to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
  );


-- ---------- pagos ----------
create policy pagos_lectura on pagos
  for select to authenticated
  using (
    (select rol_id from mi_perfil()) = 1
    or ((select rol_id from mi_perfil()) = 2
        and barberia_id = (select barberia_id from mi_perfil()))
  );

create policy pagos_escritura on pagos
  for all to authenticated
  using ((select rol_id from mi_perfil()) = 1)
  with check ((select rol_id from mi_perfil()) = 1);


-- =====================================================================
-- FIN DEL ESQUEMA
--
-- Pendientes conocidos (no bloquean la creación del proyecto):
--   - Rate limiting real del INSERT público (hoy límite por teléfono +
--     freno por barbería, ver 20260824000000_reforzar_seguridad_reservas.sql
--     — sigue sin haber CAPTCHA ni bloqueo por IP, que requieren un servicio
--     externo (Turnstile/hCaptcha) y no se agregan sin decidirlo con Enzo)
--   - Canal de notificación de reserva nueva: al definirlo, agregar a
--     `reservas` las columnas notificado_at / notificacion_error para
--     poder reintentar envíos fallidos sin perder ninguno
--   - Conectar el frontend a la vista servicios_publicos
--   - Denormalizar barberia_id en horarios/excepciones si RLS resulta lento
--   - Estados 'completada' / 'no_asistio' (requiere UI nueva). Al agregarlos,
--     revisar el filtro de la restricción reservas_sin_solape
--   - Tabla `clientes` completa (por ahora solo se normaliza el teléfono)
-- =====================================================================
