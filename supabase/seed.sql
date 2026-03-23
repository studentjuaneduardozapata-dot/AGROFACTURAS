-- ============================================================
-- AGROFACTURAS / FacturIA - Datos Iniciales (Seed)
-- Ejecutar DESPUÉS del schema.sql en el SQL Editor de Supabase
-- ============================================================

-- -------------------------------------------------------
-- CENTROS DE COSTO INICIALES
-- -------------------------------------------------------
INSERT INTO centros_costo (nombre, color, activo) VALUES
  ('Granos',    '#F59E0B', true),
  ('Procesos',  '#3B82F6', true),
  ('Insumos',   '#10B981', true),
  ('Soya',      '#8B5CF6', true),
  ('Stara',     '#EF4444', true)
ON CONFLICT (nombre) DO NOTHING;

-- -------------------------------------------------------
-- SUB-CENTROS INICIALES (ejemplos editables)
-- -------------------------------------------------------
INSERT INTO sub_centros (centro_costo_id, nombre, activo)
SELECT cc.id, sc.nombre, true
FROM (VALUES
  ('Granos',   'Planta Zaragoza'),
  ('Procesos', 'Vehículo SXG'),
  ('Insumos',  'Planta Cartago')
) AS sc(centro, nombre)
JOIN centros_costo cc ON cc.nombre = sc.centro
ON CONFLICT (centro_costo_id, nombre) DO NOTHING;

-- -------------------------------------------------------
-- CONFIGURACIÓN INICIAL DE LA EMPRESA
-- -------------------------------------------------------
INSERT INTO configuracion (clave, valor) VALUES
  (
    'datos_empresa',
    '{
      "nombre":    "AGROINSUMOS SAS",
      "nit":       "836 000 548 - 7",
      "direccion": "Calle 13 # 56-20 barrio villa Daniel - Zaragoza",
      "ciudad":    "Cartago - Valle",
      "correo":    "f.electronica@agroinsumossa.com",
      "telefono":  "(602) 214 99 10"
    }'::jsonb
  ),
  (
    'solicitante_default',
    '{
      "nombre": "Andres Felipe Celis Bernal",
      "cargo":  "Jefe De Planta",
      "correo": "andres.celis@agroinsumossa.com"
    }'::jsonb
  ),
  (
    'autorizador_default',
    '{
      "nombre": "Juan Esteban Castaño"
    }'::jsonb
  )
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor;
