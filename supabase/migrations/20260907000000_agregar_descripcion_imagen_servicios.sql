-- Hoy un servicio es solo nombre + precio + duración — sin nada visual, la
-- vidriera de servicios de la página pública es una tabla de precios plana.
-- Se agregan estas 2 columnas para que cada servicio pueda mostrarse como una
-- tarjeta real (imagen + qué incluye), el primer paso de la nueva vidriera de
-- "Nuestros servicios" (ver PanelServicios.jsx / VistaBarberia.jsx).
alter table servicios
  add column descripcion text not null default '',
  add column imagen_url  text;
