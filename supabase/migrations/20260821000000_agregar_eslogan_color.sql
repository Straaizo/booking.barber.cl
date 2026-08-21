-- Color propio para el eslogan del encabezado — antes heredaba solo el
-- contraste automático calculado a partir del color del header
-- (`claseEslogan` en VistaBarberia.jsx). `null` = sigue usando ese cálculo
-- automático; un valor explícito lo independiza — mismo patrón que ya usa
-- `whatsapp_color` frente a `color_primario`.
alter table personalizacion
  add column eslogan_color text;
