-- =====================================================================
-- Límite de anticipación configurable por barbería — a pedido de Enzo:
-- hoy un cliente puede reservar cualquier día hasta 6 meses adelante (el
-- único freno real, fijo, en validar_disponibilidad_reserva()), y eso le
-- resta seriedad al calendario para ambos lados. Cada barbería define
-- ahora hasta cuántos días hacia adelante puede reservar un cliente en su
-- página pública; el dueño lo edita desde Personalización. El frontend
-- (proximosDiasConHorario) usa el mismo valor para no ofrecer siquiera
-- días que igual rebotarían acá — esta función queda como el freno real,
-- el frontend es solo para no mostrar una opción que después falla.
--
-- Deliberadamente NO se toca validar_reprogramacion_reserva() (reprogramar
-- desde el panel del dueño) — ese sigue con el tope fijo de 6 meses: es el
-- dueño moviendo su propia agenda, no un cliente anónimo navegando la
-- página pública, no tiene sentido atarlo a la misma ventana.
-- =====================================================================

alter table barberias
  add column dias_maximos_reserva integer not null default 3
    check (dias_maximos_reserva in (1,2,3,5,7,10,14,21,30));

-- Redefine completa (Postgres no permite parchar una sola parte) — igual a
-- la versión vigente (20260824000000_reforzar_seguridad_reservas.sql),
-- solo cambia el tope fijo de 6 meses por el de la barbería del barbero.
create or replace function validar_disponibilidad_reserva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bloque        record;
  v_intervalo     integer;
  v_hora_ini      time;
  v_minutos       integer;
  v_recientes     integer;
  v_dias_maximos  integer;
begin
  if new.fecha_hora <= now() then
    raise exception 'No se puede reservar en el pasado';
  end if;

  select b.dias_maximos_reserva into v_dias_maximos
  from barberos bb
  join barberias b on b.id = bb.barberia_id
  where bb.id = new.barbero_id;

  if new.fecha_hora > now() + (v_dias_maximos || ' days')::interval then
    raise exception 'Esta barbería solo recibe reservas hasta % días de anticipación', v_dias_maximos;
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
