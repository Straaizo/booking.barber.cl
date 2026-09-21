-- Refuerza la verificación en dos pasos (TOTP) del superadmin a nivel de
-- base de datos, no solo en el panel (ver RutaProtegida.jsx/DesafioMFA.jsx
-- del lado del cliente). Sin esto, alguien con una sesión o un JWT robado de
-- superadmin (aal1, solo contraseña) podría igual leer/escribir todo si
-- llamara a la API de Supabase directo, saltándose la app entera — este
-- chequeo vive en la política, así que ninguna forma de acceso puede
-- esquivarlo.
--
-- Una política RESTRICTIVE por tabla: se combina con AND sobre las políticas
-- PERMISSIVE que ya existen (nunca las reemplaza, solo las puede volver más
-- estrictas) — así que dueño/barbero/anon no se ven afectados en absoluto
-- (`rol_id is distinct from 1` pasa siempre para ellos), y las políticas ya
-- escritas para superadmin (`... = 1`) siguen intactas.
--
-- `is distinct from` (no `!=`): si `mi_perfil()` no encuentra fila (una
-- sesión sin perfil válido, o ninguna sesión), `rol_id` da `null`, y
-- `null != 1` es `null` (ni true ni false — Postgres lo trata como "no
-- pasa"), lo que rompería silenciosamente cualquier acceso público. Mismo
-- patrón que ya usa el trigger de cambio de estado de barbería en
-- 20260819120000_schema.sql.
--
-- No afecta a `roles` ni `estados_barberia`: son catálogos 100% públicos
-- (`to anon, authenticated using (true)`) sin ninguna política específica
-- para superadmin — no hay nada ahí que reforzar.
--
-- Queda sin efecto hasta que el superadmin activa el factor desde su propia
-- cuenta (PanelCuenta.jsx) — sin un factor TOTP verificado, Supabase nunca
-- pide aal2, así que esta migración no bloquea a nadie el día que se corre.

create policy planes_requiere_aal2 on planes
  as restrictive
  for all
  to authenticated
  using (
    (select rol_id from mi_perfil()) is distinct from 1
    or (auth.jwt() ->> 'aal') = 'aal2'
  );

create policy barberias_requiere_aal2 on barberias
  as restrictive
  for all
  to authenticated
  using (
    (select rol_id from mi_perfil()) is distinct from 1
    or (auth.jwt() ->> 'aal') = 'aal2'
  );

create policy barberos_requiere_aal2 on barberos
  as restrictive
  for all
  to authenticated
  using (
    (select rol_id from mi_perfil()) is distinct from 1
    or (auth.jwt() ->> 'aal') = 'aal2'
  );

create policy usuarios_requiere_aal2 on usuarios
  as restrictive
  for all
  to authenticated
  using (
    (select rol_id from mi_perfil()) is distinct from 1
    or (auth.jwt() ->> 'aal') = 'aal2'
  );

create policy personalizacion_requiere_aal2 on personalizacion
  as restrictive
  for all
  to authenticated
  using (
    (select rol_id from mi_perfil()) is distinct from 1
    or (auth.jwt() ->> 'aal') = 'aal2'
  );

create policy servicios_requiere_aal2 on servicios
  as restrictive
  for all
  to authenticated
  using (
    (select rol_id from mi_perfil()) is distinct from 1
    or (auth.jwt() ->> 'aal') = 'aal2'
  );

create policy horarios_requiere_aal2 on horarios_disponibles
  as restrictive
  for all
  to authenticated
  using (
    (select rol_id from mi_perfil()) is distinct from 1
    or (auth.jwt() ->> 'aal') = 'aal2'
  );

create policy excepciones_requiere_aal2 on excepciones_horario
  as restrictive
  for all
  to authenticated
  using (
    (select rol_id from mi_perfil()) is distinct from 1
    or (auth.jwt() ->> 'aal') = 'aal2'
  );

create policy reservas_requiere_aal2 on reservas
  as restrictive
  for all
  to authenticated
  using (
    (select rol_id from mi_perfil()) is distinct from 1
    or (auth.jwt() ->> 'aal') = 'aal2'
  );

create policy historial_requiere_aal2 on historial_estados
  as restrictive
  for all
  to authenticated
  using (
    (select rol_id from mi_perfil()) is distinct from 1
    or (auth.jwt() ->> 'aal') = 'aal2'
  );

create policy pagos_requiere_aal2 on pagos
  as restrictive
  for all
  to authenticated
  using (
    (select rol_id from mi_perfil()) is distinct from 1
    or (auth.jwt() ->> 'aal') = 'aal2'
  );

create policy servicio_barberos_requiere_aal2 on servicio_barberos
  as restrictive
  for all
  to authenticated
  using (
    (select rol_id from mi_perfil()) is distinct from 1
    or (auth.jwt() ->> 'aal') = 'aal2'
  );

create policy novedades_requiere_aal2 on novedades
  as restrictive
  for all
  to authenticated
  using (
    (select rol_id from mi_perfil()) is distinct from 1
    or (auth.jwt() ->> 'aal') = 'aal2'
  );

-- Storage: acotada al bucket de este proyecto (`imagenes-barberias`) — no
-- toca ningún otro bucket que pueda existir en el proyecto de Supabase.
create policy imagenes_barberias_requiere_aal2 on storage.objects
  as restrictive
  for all
  to authenticated
  using (
    bucket_id != 'imagenes-barberias'
    or (select rol_id from public.mi_perfil()) is distinct from 1
    or (auth.jwt() ->> 'aal') = 'aal2'
  );
