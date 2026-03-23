-- ============================================================
-- AGROFACTURAS / FacturIA - Schema de Base de Datos
-- Ejecutar en el SQL Editor de Supabase Dashboard
-- ============================================================

-- -------------------------------------------------------
-- EXTENSIONES
-- -------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------
-- FUNCIONES COMPARTIDAS
-- -------------------------------------------------------

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para validar distribución de costos
-- Reglas: max 5 filas por factura, suma de porcentajes <= 100
CREATE OR REPLACE FUNCTION validar_distribucion_porcentaje()
RETURNS trigger AS $$
DECLARE
  total_porcentaje numeric;
  conteo_filas integer;
BEGIN
  -- Verificar máximo 5 centros de costo por factura
  SELECT COUNT(*) INTO conteo_filas
  FROM distribuciones_costo
  WHERE factura_id = NEW.factura_id
    AND id IS DISTINCT FROM NEW.id;

  IF conteo_filas >= 5 THEN
    RAISE EXCEPTION 'Una factura no puede tener más de 5 centros de costo (actual: %)', conteo_filas;
  END IF;

  -- Verificar que la suma no supere 100%
  SELECT COALESCE(SUM(porcentaje), 0) INTO total_porcentaje
  FROM distribuciones_costo
  WHERE factura_id = NEW.factura_id
    AND id IS DISTINCT FROM NEW.id;

  total_porcentaje := total_porcentaje + NEW.porcentaje;

  IF total_porcentaje > 100 THEN
    RAISE EXCEPTION 'La suma de porcentajes excede 100%% para esta factura (suma actual: %)', total_porcentaje;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para generar número de OC auto-incremental: AI-YY-NNN
CREATE OR REPLACE FUNCTION generar_numero_oc()
RETURNS text AS $$
DECLARE
  anio_actual text;
  ultimo_consecutivo integer;
  nuevo_numero text;
BEGIN
  anio_actual := TO_CHAR(NOW(), 'YY');

  SELECT COALESCE(
    MAX(CAST(SPLIT_PART(numero_oc, '-', 3) AS integer)),
    0
  ) INTO ultimo_consecutivo
  FROM ordenes_compra
  WHERE numero_oc LIKE 'AI-' || anio_actual || '-%';

  ultimo_consecutivo := ultimo_consecutivo + 1;
  nuevo_numero := 'AI-' || anio_actual || '-' || LPAD(ultimo_consecutivo::text, 3, '0');

  RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------
-- TABLA: configuracion
-- Almacena configuraciones del sistema (empresa, solicitante, etc.)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracion (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clave      text UNIQUE NOT NULL,
  valor      jsonb NOT NULL,
  updated_at timestamptz DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_configuracion
  BEFORE UPDATE ON configuracion
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- -------------------------------------------------------
-- TABLA: centros_costo
-- Centros de costo disponibles para distribución
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS centros_costo (
  id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text UNIQUE NOT NULL,
  color  text NOT NULL DEFAULT '#6ab04c',
  activo boolean NOT NULL DEFAULT true
);

-- -------------------------------------------------------
-- TABLA: sub_centros
-- Sub-centros vinculados a un centro de costo
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS sub_centros (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  centro_costo_id uuid NOT NULL REFERENCES centros_costo(id) ON DELETE CASCADE,
  nombre          text NOT NULL,
  activo          boolean NOT NULL DEFAULT true,
  UNIQUE(centro_costo_id, nombre)
);

CREATE INDEX IF NOT EXISTS idx_sub_centros_centro_id ON sub_centros(centro_costo_id);

-- -------------------------------------------------------
-- TABLA: proveedores
-- Proveedores con memoria de configuraciones usadas
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS proveedores (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nit                 text UNIQUE NOT NULL,
  razon_social        text,
  regimen_tributario  text,
  tipo_persona        text,
  direccion           text,
  telefono            text,
  email               text,
  ultimo_concepto     jsonb,   -- [{concepto: string, porcentaje: number}]
  ultima_categoria    text,
  ultima_distribucion jsonb,   -- [{centro_costo: string, sub_centro: string, porcentaje: number}]
  created_at          timestamptz DEFAULT NOW(),
  updated_at          timestamptz DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_proveedores
  BEFORE UPDATE ON proveedores
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- -------------------------------------------------------
-- TABLA: facturas
-- Facturas electrónicas colombianas procesadas
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS facturas (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_factura        text NOT NULL,
  fecha_emision         date,
  forma_pago            text CHECK (forma_pago IN ('CONTADO', 'CRÉDITO')),
  proveedor_id          uuid REFERENCES proveedores(id) ON DELETE SET NULL,
  subtotal              numeric(18,2) DEFAULT 0,
  iva                   numeric(18,2) DEFAULT 0,
  inc                   numeric(18,2) DEFAULT 0,
  rete_fuente           numeric(18,2) DEFAULT 0,
  rete_iva              numeric(18,2) DEFAULT 0,
  rete_ica              numeric(18,2) DEFAULT 0,
  total_impuestos       numeric(18,2) DEFAULT 0,
  total_neto            numeric(18,2) DEFAULT 0,
  informacion           text,
  estado                text NOT NULL DEFAULT 'extraida'
                          CHECK (estado IN ('extraida', 'validada', 'vinculada', 'error')),
  estado_pago           text NOT NULL DEFAULT 'no_aplica'
                          CHECK (estado_pago IN ('no_aplica', 'pendiente', 'pagada')),
  hash_pdf              text UNIQUE,
  archivo_original_path text,
  confianza_extraccion  numeric(5,2),
  datos_json_crudo      jsonb,
  created_at            timestamptz DEFAULT NOW(),

  -- Deduplicación lógica: mismo proveedor + mismo número de factura
  UNIQUE(proveedor_id, numero_factura)
);

CREATE INDEX IF NOT EXISTS idx_facturas_proveedor_id ON facturas(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha_emision ON facturas(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_facturas_estado_pago ON facturas(estado_pago);
CREATE INDEX IF NOT EXISTS idx_facturas_forma_pago ON facturas(forma_pago);

-- -------------------------------------------------------
-- TABLA: lineas_factura
-- Líneas/ítems de cada factura
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS lineas_factura (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id      uuid NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  numero_linea    integer NOT NULL,
  codigo          text DEFAULT '',
  descripcion     text NOT NULL,
  cantidad        numeric(18,4) NOT NULL DEFAULT 1,
  precio_unitario numeric(18,2) NOT NULL DEFAULT 0,
  tipo_impuesto   text DEFAULT '',
  tarifa_impuesto numeric(6,2) DEFAULT 0,
  monto_impuesto  numeric(18,2) DEFAULT 0,
  total_linea     numeric(18,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_lineas_factura_factura_id ON lineas_factura(factura_id);

-- -------------------------------------------------------
-- TABLA: distribuciones_costo
-- Distribución de costos de una factura entre centros
-- Máx. 5 centros por factura, suma <= 100 (validado en app)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS distribuciones_costo (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id   uuid NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  centro_costo text NOT NULL,
  sub_centro   text DEFAULT '',
  porcentaje   numeric(6,2) NOT NULL CHECK (porcentaje > 0 AND porcentaje <= 100),
  monto        numeric(18,2) NOT NULL DEFAULT 0
);

CREATE TRIGGER validar_distribucion
  BEFORE INSERT OR UPDATE ON distribuciones_costo
  FOR EACH ROW EXECUTE FUNCTION validar_distribucion_porcentaje();

CREATE INDEX IF NOT EXISTS idx_distribuciones_factura_id ON distribuciones_costo(factura_id);

-- -------------------------------------------------------
-- TABLA: ordenes_compra
-- Órdenes de compra generadas (1:1 con facturas)
-- Formato número OC: AI-YY-NNN (ej: AI-25-001)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS ordenes_compra (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_oc            text UNIQUE NOT NULL,
  factura_id           uuid UNIQUE NOT NULL REFERENCES facturas(id) ON DELETE RESTRICT,
  concepto             jsonb,   -- [{nombre: string, porcentaje: number}]
  categoria            text,
  solicitante_nombre   text,
  solicitante_cargo    text,
  solicitante_correo   text,
  autorizado_por       text,
  fecha_generacion     date DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_ordenes_factura_id ON ordenes_compra(factura_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_numero_oc ON ordenes_compra(numero_oc);

-- -------------------------------------------------------
-- TABLA: log_procesamiento
-- Auditoría de eventos de procesamiento de facturas
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS log_procesamiento (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id uuid NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  evento     text NOT NULL
               CHECK (evento IN ('subido', 'cola', 'extrayendo', 'extraido', 'error', 'reintento', 'validado', 'vinculado')),
  detalle    text DEFAULT '',
  created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_log_factura_id ON log_procesamiento(factura_id);
CREATE INDEX IF NOT EXISTS idx_log_created_at ON log_procesamiento(created_at);

-- -------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- Solo usuarios autenticados pueden acceder
-- -------------------------------------------------------

ALTER TABLE configuracion      ENABLE ROW LEVEL SECURITY;
ALTER TABLE centros_costo      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_centros        ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineas_factura     ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribuciones_costo ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra     ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_procesamiento  ENABLE ROW LEVEL SECURITY;

-- Políticas: acceso total para usuarios autenticados
CREATE POLICY "Acceso total autenticados" ON configuracion
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso total autenticados" ON centros_costo
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso total autenticados" ON sub_centros
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso total autenticados" ON proveedores
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso total autenticados" ON facturas
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso total autenticados" ON lineas_factura
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso total autenticados" ON distribuciones_costo
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso total autenticados" ON ordenes_compra
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso total autenticados" ON log_procesamiento
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
