-- Requerido por src/pages/panel/hooks/useBarberiasSuperadmin.js. El panel
-- superadmin exige un motivo al activar/desactivar una barbería, y ese motivo
-- se guarda en `historial_estados` junto con el estado anterior y el nuevo.
-- Se hace como función (en vez de dos llamadas sueltas desde el cliente:
-- update a barberias + insert a historial_estados) para que ambas escrituras
-- ocurran como una sola transacción — si algo falla, no queda el estado
-- cambiado sin su registro de auditoría correspondiente.
--
-- La función es `security definer`, así que valida ella misma que quien la
-- llama sea superadmin (rol_id = 1): al ser security definer, salta las
-- políticas RLS normales sobre `barberias`/`historial_estados`, por lo que
-- sin este chequeo cualquier usuario autenticado podría cambiar el estado de
-- cualquier barbería.
--
-- Ejecutar una vez en el SQL editor del proyecto de Supabase (después de
-- 001_login_por_usuario.sql).

create or replace function public.cambiar_estado_barberia(
  p_barberia_id uuid,
  p_estado_nuevo_id smallint,
  p_motivo text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado_anterior_id smallint;
  v_rol_id smallint;
begin
  select rol_id into v_rol_id from usuarios where id = auth.uid();
  if v_rol_id is distinct from 1 then
    raise exception 'No autorizado';
  end if;

  select estado_id into v_estado_anterior_id from barberias where id = p_barberia_id;

  update barberias set estado_id = p_estado_nuevo_id where id = p_barberia_id;

  insert into historial_estados (barberia_id, usuario_id, estado_anterior_id, estado_nuevo_id, motivo)
  values (p_barberia_id, auth.uid(), v_estado_anterior_id, p_estado_nuevo_id, p_motivo);
end;
$$;

grant execute on function public.cambiar_estado_barberia(uuid, smallint, text) to authenticated;
