-- =====================================================================
-- Storage real para imágenes de barbería (logo, fotos de barbero, galería,
-- imágenes de sección) — reemplaza guardarlas como data URL de texto directo
-- en columnas de `barberias`/`barberos`/`personalizacion`. Ver entrada (31)
-- de la bitácora: eso hacía que CUALQUIER guardado de Personalización
-- reenviara el `secciones` completo con todas las fotos adentro (~1.6MB,
-- 2-3 segundos), con riesgo real de perder el cambio si la página se
-- recargaba o cerraba antes de que terminara.
--
-- Carpeta = barberia_id (ver `subirImagenBarberia` en
-- src/services/storageImagenes.js): cada archivo vive en
-- `{barberia_id}/{uuid}.jpg`, así la policy de escritura puede exigir que la
-- primera carpeta del path coincida con la propia barbería del que sube,
-- igual que ya hace cada tabla de este esquema.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagenes-barberias', 'imagenes-barberias', true, 5242880, array['image/jpeg'])
on conflict (id) do nothing;

-- Lectura pública: son las fotos de la página pública de cada barbería,
-- tienen que verse sin sesión — igual criterio que `barberos_publico`,
-- `servicios_publico`, etc. en 20260819120000_schema.sql.
create policy imagenes_barberias_lectura on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'imagenes-barberias');

-- Escritura: superadmin en cualquier carpeta, o cualquier cuenta autenticada
-- (dueño o barbero) dentro de la carpeta de SU PROPIA barbería. No hace
-- falta distinguir rol_id = 2 vs 3 acá: ambos tienen su propio barberia_id
-- en mi_perfil(), así que la comparación de carpeta ya alcanza sola.
create policy imagenes_barberias_insertar on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'imagenes-barberias'
    and (
      (select rol_id from public.mi_perfil()) = 1
      or (storage.foldername(name))[1] = (select barberia_id from public.mi_perfil())::text
    )
  );

create policy imagenes_barberias_actualizar on storage.objects
  for update to authenticated
  using (
    bucket_id = 'imagenes-barberias'
    and (
      (select rol_id from public.mi_perfil()) = 1
      or (storage.foldername(name))[1] = (select barberia_id from public.mi_perfil())::text
    )
  );

create policy imagenes_barberias_borrar on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'imagenes-barberias'
    and (
      (select rol_id from public.mi_perfil()) = 1
      or (storage.foldername(name))[1] = (select barberia_id from public.mi_perfil())::text
    )
  );
