-- `planes` tiene RLS activo desde el esquema original pero solo llegó a
-- tener política de lectura (`cat_planes_lectura`) — nunca de insert/update.
-- Con RLS activo y sin esas políticas, Postgres deniega por defecto: el
-- formulario "Crear plan"/editar precio de `PanelSuperadminPlanes.jsx`
-- viene fallando en silencio (error de RLS) desde que existe esa pantalla.
-- Sin policy de delete a propósito: un plan no se borra, se retira con
-- `activo = 0` (ver columna `activo`, "ARREGLO 6" en el esquema original).
create policy planes_insert_superadmin on planes
  for insert to authenticated
  with check ((select rol_id from mi_perfil()) = 1);

create policy planes_update_superadmin on planes
  for update to authenticated
  using ((select rol_id from mi_perfil()) = 1)
  with check ((select rol_id from mi_perfil()) = 1);
