-- Modo claro/oscuro de la página pública de la barbería (Personalización →
-- Identidad). Solo cambia la paleta de fondo/superficies/texto del cuerpo de
-- la página vía tokens CSS (ver VistaBarberia.jsx) — no toca el color de
-- marca ni el color del header, que siguen siendo elecciones independientes.
alter table personalizacion
  add column tema text not null default 'claro'
  check (tema in ('claro', 'oscuro'));
