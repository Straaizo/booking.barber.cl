-- =====================================================================
-- Refuerzo de seguridad — auditoría 2026-08-24
--
-- (1) Freno de inundación por barbería, además del freno por teléfono que
--     ya existía en validar_disponibilidad_reserva(). El freno por teléfono
--     es trivial de evadir desde un script: el teléfono es un campo de texto
--     autodeclarado por quien reserva, así que alcanza con variar los
--     dígitos en cada insert para saltárselo por completo. Sin un freno
--     adicional que mire el total de la barbería (sin importar qué teléfono
--     se use), cualquiera podría ocupar con reservas falsas toda la agenda
--     real de una barbería (hasta 6 meses hacia adelante, el máximo que
--     permite validar_disponibilidad_reserva) y dejarla sin cupos para
--     clientes de verdad — un insert público no requiere ninguna cuenta,
--     solo pasar por RLS (reservas_insert_publico), así que esta es
--     exactamente el tipo de ruta que hay que frenar a nivel de base de
--     datos, no solo confiando en el frontend.
--
-- (1b) A pedido de Enzo: cambia el antispam por teléfono de "máximo 5 por
--      hora" a un enfriamiento simple — después de reservar, ese mismo
--      número no puede reservar otra vez hasta que pasen 12 minutos. No
--      busca evitar el registro de cuentas (sigue sin haber cuentas para
--      reservar, a propósito, para que siga siendo lo más accesible
--      posible) — busca que, si alguien se equivocó o quiere cambiar algo,
--      tenga que llamar directamente a la barbería en vez de generar otra
--      reserva encima. Reemplaza por completo el chequeo anterior (5 por
--      hora) dentro de la misma función, `validar_disponibilidad_reserva()`.
--
-- (2) Tope de tamaño en los campos que guardan imágenes como data URL
--     (logo, foto de barbero, banner y las imágenes dentro de `secciones`).
--     Hoy el frontend comprime antes de subir (ver utils/imagenes.js), pero
--     eso es solo disciplina del cliente: cualquier cuenta autenticada
--     (dueño o barbero) podría llamar la API de Supabase directamente y
--     mandar un valor arbitrariamente grande — RLS ya limita ESO a su
--     propia fila, así que el riesgo real es solo inflar su propia
--     barbería (no fuga de datos de otro tenant), pero igual conviene un
--     tope duro: sin él, una fila así de pesada se sirve completa en cada
--     visita a la página pública (nunca cachea como haría una URL de imagen
--     real) y puede degradar el servicio para esa barbería y, en el peor
--     caso, para el resto si la tabla crece mucho. El límite es generoso
--     (~2MB reales por imagen) — muy por encima de lo que produce la
--     compresión real del frontend (1200x1200 JPEG calidad 0.85, unos
--     cientos de KB), así que ningún uso legítimo se ve afectado.
-- =====================================================================

create or replace function limitar_reservas_por_barberia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recientes integer;
begin
  select count(*) into v_recientes
  from reservas
  where barberia_id = new.barberia_id
    and created_at > now() - interval '10 minutes';

  if v_recientes >= 20 then
    raise exception
      'Demasiadas reservas nuevas para esta barbería en poco tiempo. Inténtalo en unos minutos.';
  end if;

  return new;
end;
$$;

-- Corre primero (prefijo 05, antes que normalizar/calcular/validar) para
-- fallar rápido sin gastar el resto de las validaciones si ya se superó el
-- freno.
create trigger trg_reservas_05_limitar_por_barberia
  before insert on reservas
  for each row execute function limitar_reservas_por_barberia();


-- Redefine la función completa (Postgres no permite "parchar" solo una
-- parte) — todo el resto queda idéntico a como estaba en
-- 20260819120000_schema.sql, solo cambia el bloque final de antispam.
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

  -- Enfriamiento por teléfono: no es una verificación de identidad real (el
  -- teléfono es autodeclarado), pero evita reservas repetidas por apuro o
  -- error y empuja a resolver cualquier cambio hablando directo con la
  -- barbería, en vez de encimar una reserva nueva sobre la anterior.
  select count(*) into v_recientes
  from reservas
  where cliente_telefono = new.cliente_telefono
    and created_at > now() - interval '12 minutes';

  if v_recientes >= 1 then
    raise exception
      'Ya registramos una reserva reciente con este número. Si necesitas hacer un cambio, comunícate directamente con la barbería.';
  end if;

  return new;
end;
$$;


alter table barberias
  add constraint barberias_logo_tamano_razonable
    check (logo_url is null or length(logo_url) <= 3000000);

alter table barberos
  add constraint barberos_foto_tamano_razonable
    check (foto_url is null or length(foto_url) <= 3000000);

alter table personalizacion
  add constraint personalizacion_banner_tamano_razonable
    check (banner_url is null or length(banner_url) <= 3000000),
  add constraint personalizacion_secciones_tamano_razonable
    check (length(secciones::text) <= 15000000);
