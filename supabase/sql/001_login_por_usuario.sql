-- Requerido por src/services/authService.js: el login del panel es por
-- `usuario` (no email), pero Supabase Auth solo autentica con email/password.
-- Esta función resuelve `usuario` -> `email_tecnico` para un cliente SIN
-- sesión (anon), exponiendo únicamente ese email — nunca la fila completa de
-- `usuarios` — antes de intentar signInWithPassword.
--
-- Ejecutar una vez en el SQL editor del proyecto de Supabase.

create or replace function public.obtener_email_por_usuario(p_usuario text)
returns text
language sql
security definer
set search_path = public
as $$
  select email_tecnico
  from usuarios
  where usuario = p_usuario
  limit 1;
$$;

grant execute on function public.obtener_email_por_usuario(text) to anon, authenticated;
