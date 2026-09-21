-- Arregla otro candado mal puesto de la migración de 2FA
-- (20260921000000_exigir_2fa_superadmin.sql): `reservas_requiere_aal2` se
-- creó `for all`, que incluye INSERT — pero insertar una reserva es
-- exactamente el camino PÚBLICO y anónimo que usa cualquier cliente desde
-- el asistente de reserva (`reservas_insert_publico`, sin sesión de
-- ningún tipo). No hay ninguna razón para exigirle un segundo factor de
-- superadmin a esa ruta — nunca fue una acción privilegiada, es la que
-- usa cualquiera.
--
-- Efecto real: bloqueaba TODAS las reservas nuevas hechas por clientes
-- reales (celular, PC, cualquiera) desde que se corrió la migración
-- original — el 401 "new row violates row-level security policy for
-- table reservas" que reportó Enzo.
--
-- El arreglo: acotar la política a los comandos donde superadmin SÍ tiene
-- un privilegio de más que reforzar — leer y modificar reservas de
-- cualquier barbería (select/update), y borrar el historial si hiciera
-- falta (delete, aunque hoy no hay ninguna ruta de borrado real). Insert
-- queda completamente afuera, gobernado solo por `reservas_insert_publico`
-- como siempre.

drop policy reservas_requiere_aal2 on reservas;

create policy reservas_requiere_aal2 on reservas
  as restrictive
  for select
  to authenticated
  using (
    (select rol_id from mi_perfil()) is distinct from 1
    or (auth.jwt() ->> 'aal') = 'aal2'
  );

create policy reservas_update_requiere_aal2 on reservas
  as restrictive
  for update
  to authenticated
  using (
    (select rol_id from mi_perfil()) is distinct from 1
    or (auth.jwt() ->> 'aal') = 'aal2'
  );
