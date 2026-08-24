-- =====================================================================
-- Reprogramar una reserva (cambiar hora y/o servicio) y reactivar una
-- cancelada, desde el panel del dueño — hasta ahora `reservas` solo
-- validaba/calculaba en el INSERT (bloques `before insert` en
-- 20260819120000_schema.sql); un UPDATE de `fecha_hora`/`servicio_id`/
-- `estado` pasaba sin revalidar nada.
--
-- Reutiliza `calcular_datos_reserva()` y `validar_servicio_barbero()` tal
-- cual (no referencian OLD, sirven para insert y update por igual) — el
-- único código nuevo es `validar_reprogramacion_reserva()`, que cubre DOS
-- casos con la misma función:
--   (a) reprogramar (cambia servicio_id y/o fecha_hora) — exige que la
--       reserva ya esté confirmada (no tiene sentido "reprogramar" una
--       cancelada sin reactivarla primero).
--   (b) reactivar (estado pasa de 'cancelada' a 'confirmada', sin tocar
--       fecha_hora/servicio_id) — el slot pudo haberse ocupado con otra
--       reserva mientras esta estaba cancelada, así que igual hay que
--       revalidar disponibilidad y choque de horario.
-- En ambos casos NO corre el freno antispam por teléfono de
-- `validar_disponibilidad_reserva()` (acá no aplica: no es un cliente
-- anónimo reservando, es el dueño operando una reserva ya existente), y sí
-- corre un chequeo de choque de horario con mensaje legible (la restricción
-- `reservas_sin_solape` también protege esto, pero con un error técnico de
-- Postgres, no uno que el dueño pueda leer).
--
-- Los triggers nuevos solo corren cuando de verdad cambia `servicio_id`,
-- `fecha_hora`, o el estado pasa de cancelada a confirmada — así cancelar
-- una reserva o editar cualquier otro campo no dispara ninguna
-- revalidación.
-- =====================================================================

create or replace function validar_reprogramacion_reserva()
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
begin
  -- Reprogramar (cambia servicio u horario) exige partir de una reserva
  -- confirmada. Reactivar (mismo servicio/horario, solo cambia el estado)
  -- es justamente el caso en que `old.estado = 'cancelada'`, así que este
  -- chequeo no debe bloquearlo.
  if (new.servicio_id is distinct from old.servicio_id or new.fecha_hora is distinct from old.fecha_hora)
     and old.estado <> 'confirmada' then
    raise exception 'Solo se puede reprogramar una reserva confirmada.';
  end if;

  if new.fecha_hora <= now() then
    raise exception 'No se puede reprogramar a una fecha/hora ya pasada.';
  end if;

  if new.fecha_hora > now() + interval '6 months' then
    raise exception 'No se puede reservar con más de 6 meses de anticipación.';
  end if;

  select * into v_bloque from bloque_atencion(new.barbero_id, new.fecha_hora);
  if not found then
    raise exception 'El barbero no atiende en ese horario.';
  end if;

  if (new.fecha_hora_fin at time zone 'America/Santiago')::time > v_bloque.hora_fin then
    raise exception 'La duración del servicio excede el horario de atención.';
  end if;

  select intervalo_reserva_minutos into v_intervalo
  from barberos where id = new.barbero_id;

  v_hora_ini := (new.fecha_hora at time zone 'America/Santiago')::time;
  v_minutos := (extract(epoch from (v_hora_ini - v_bloque.hora_inicio)) / 60)::integer;

  if v_minutos % v_intervalo <> 0 then
    raise exception 'La hora debe estar alineada a bloques de % minutos.', v_intervalo;
  end if;

  -- La restricción `reservas_sin_solape` también frena esto, pero con un
  -- error técnico de Postgres — este chequeo adelantado da un mensaje que el
  -- dueño puede leer y entender. Hace falta acá SOBRE TODO para reactivar:
  -- el slot pudo haberse ocupado con otra reserva mientras esta estaba
  -- cancelada.
  if exists (
    select 1 from reservas r
    where r.barbero_id = new.barbero_id
      and r.id <> new.id
      and r.estado = 'confirmada'
      and tstzrange(r.fecha_hora, r.fecha_hora_fin) && tstzrange(new.fecha_hora, new.fecha_hora_fin)
  ) then
    raise exception 'Ese barbero ya tiene otra reserva confirmada que se cruza con este horario.';
  end if;

  return new;
end;
$$;

create trigger trg_reservas_u20_calcular_datos
  before update on reservas
  for each row
  when (new.servicio_id is distinct from old.servicio_id or new.fecha_hora is distinct from old.fecha_hora)
  execute function calcular_datos_reserva();

create trigger trg_reservas_u30_validar_servicio
  before update on reservas
  for each row
  when (new.servicio_id is distinct from old.servicio_id or new.fecha_hora is distinct from old.fecha_hora)
  execute function validar_servicio_barbero();

create trigger trg_reservas_u40_validar_disponibilidad
  before update on reservas
  for each row
  when (
    new.servicio_id is distinct from old.servicio_id
    or new.fecha_hora is distinct from old.fecha_hora
    or (new.estado = 'confirmada' and old.estado = 'cancelada')
  )
  execute function validar_reprogramacion_reserva();
