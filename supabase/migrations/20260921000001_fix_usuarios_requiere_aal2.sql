-- Arregla un candado que se trababa a sí mismo en la migración anterior
-- (20260921000000_exigir_2fa_superadmin.sql): `usuarios_requiere_aal2`
-- exigía aal2 para leer CUALQUIER fila de `usuarios`, incluida la fila
-- propia de quien está iniciando sesión — pero la app necesita leer esa
-- fila propia (para saber "esto es un superadmin, hay que pedirle el
-- código") ANTES de poder pasar por el desafío de 2FA (ver RutaProtegida.jsx
-- /obtenerPerfil() en authService.js, que se ejecuta apenas hay sesión, bien
-- antes de que exista la oportunidad de mostrar el desafío). Con la política
-- vieja, esa lectura inicial ya fallaba con 406 (0 filas visibles) y
-- `AuthContext` la trataba como sesión inválida — cerraba la sesión antes de
-- llegar a mostrar el código, en cualquier cuenta con el factor activo.
--
-- El arreglo: agregar `id = auth.uid()` como excepción, igual que ya hace
-- `usuarios_lectura` (la política permissive original) — leer la FILA
-- PROPIA siempre se permite, sin importar el aal. No abre ninguna puerta
-- nueva: la tabla nunca tuvo GRANT de insert/update/delete para
-- `authenticated` (`grant select on usuarios ... to authenticated`, ver
-- 20260819120000_schema.sql) — así que esta política nunca pudo afectar
-- nada más que el select, ni antes ni ahora.

drop policy usuarios_requiere_aal2 on usuarios;

create policy usuarios_requiere_aal2 on usuarios
  as restrictive
  for all
  to authenticated
  using (
    id = auth.uid()
    or (select rol_id from mi_perfil()) is distinct from 1
    or (auth.jwt() ->> 'aal') = 'aal2'
  );
