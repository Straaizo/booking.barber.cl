-- =====================================================================
-- Plan Estudio: máximo 10 barberos (antes 99, un valor "casi ilimitado"
-- puesto como placeholder al armar el plan). A pedido de Enzo: si una
-- barbería necesita más de 10, es un caso puntual que evalúa directo con
-- esa persona por WhatsApp — no un límite que la propia landing deba
-- publicitar como "ilimitado".
-- =====================================================================

update planes
set max_barberos = 10
where id = 3 and nombre = 'Estudio';
