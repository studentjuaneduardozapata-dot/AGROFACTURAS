// Este archivo es generado automáticamente por Supabase CLI.
// Para regenerar, ejecuta:
//   npx supabase gen types typescript --project-id <TU_PROJECT_ID> --schema public > src/lib/supabase/types.ts
//
// Mientras no se genere, se usa este placeholder con los tipos base.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      configuracion: {
        Row: {
          id: string
          clave: string
          valor: Json
          updated_at: string | null
        }
        Insert: {
          id?: string
          clave: string
          valor: Json
          updated_at?: string | null
        }
        Update: {
          id?: string
          clave?: string
          valor?: Json
          updated_at?: string | null
        }
      }
      centros_costo: {
        Row: {
          id: string
          nombre: string
          color: string
          activo: boolean
        }
        Insert: {
          id?: string
          nombre: string
          color?: string
          activo?: boolean
        }
        Update: {
          id?: string
          nombre?: string
          color?: string
          activo?: boolean
        }
      }
      sub_centros: {
        Row: {
          id: string
          centro_costo_id: string
          nombre: string
          activo: boolean
        }
        Insert: {
          id?: string
          centro_costo_id: string
          nombre: string
          activo?: boolean
        }
        Update: {
          id?: string
          centro_costo_id?: string
          nombre?: string
          activo?: boolean
        }
      }
      proveedores: {
        Row: {
          id: string
          nit: string
          razon_social: string | null
          regimen_tributario: string | null
          tipo_persona: string | null
          direccion: string | null
          telefono: string | null
          email: string | null
          ultimo_concepto: Json | null
          ultima_categoria: string | null
          ultima_distribucion: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          nit: string
          razon_social?: string | null
          regimen_tributario?: string | null
          tipo_persona?: string | null
          direccion?: string | null
          telefono?: string | null
          email?: string | null
          ultimo_concepto?: Json | null
          ultima_categoria?: string | null
          ultima_distribucion?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nit?: string
          razon_social?: string | null
          regimen_tributario?: string | null
          tipo_persona?: string | null
          direccion?: string | null
          telefono?: string | null
          email?: string | null
          ultimo_concepto?: Json | null
          ultima_categoria?: string | null
          ultima_distribucion?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      facturas: {
        Row: {
          id: string
          numero_factura: string
          fecha_emision: string | null
          forma_pago: 'CONTADO' | 'CRÉDITO' | null
          proveedor_id: string | null
          subtotal: number | null
          iva: number | null
          inc: number | null
          rete_fuente: number | null
          rete_iva: number | null
          rete_ica: number | null
          total_impuestos: number | null
          total_neto: number | null
          informacion: string | null
          estado: 'extraida' | 'validada' | 'vinculada' | 'error'
          estado_pago: 'no_aplica' | 'pendiente' | 'pagada'
          hash_pdf: string | null
          archivo_original_path: string | null
          confianza_extraccion: number | null
          datos_json_crudo: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          numero_factura: string
          fecha_emision?: string | null
          forma_pago?: 'CONTADO' | 'CRÉDITO' | null
          proveedor_id?: string | null
          subtotal?: number | null
          iva?: number | null
          inc?: number | null
          rete_fuente?: number | null
          rete_iva?: number | null
          rete_ica?: number | null
          total_impuestos?: number | null
          total_neto?: number | null
          informacion?: string | null
          estado?: 'extraida' | 'validada' | 'vinculada' | 'error'
          estado_pago?: 'no_aplica' | 'pendiente' | 'pagada'
          hash_pdf?: string | null
          archivo_original_path?: string | null
          confianza_extraccion?: number | null
          datos_json_crudo?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          numero_factura?: string
          fecha_emision?: string | null
          forma_pago?: 'CONTADO' | 'CRÉDITO' | null
          proveedor_id?: string | null
          subtotal?: number | null
          iva?: number | null
          inc?: number | null
          rete_fuente?: number | null
          rete_iva?: number | null
          rete_ica?: number | null
          total_impuestos?: number | null
          total_neto?: number | null
          informacion?: string | null
          estado?: 'extraida' | 'validada' | 'vinculada' | 'error'
          estado_pago?: 'no_aplica' | 'pendiente' | 'pagada'
          hash_pdf?: string | null
          archivo_original_path?: string | null
          confianza_extraccion?: number | null
          datos_json_crudo?: Json | null
          created_at?: string | null
        }
      }
      lineas_factura: {
        Row: {
          id: string
          factura_id: string
          numero_linea: number
          codigo: string | null
          descripcion: string
          cantidad: number
          precio_unitario: number
          tipo_impuesto: string | null
          tarifa_impuesto: number | null
          monto_impuesto: number | null
          total_linea: number
        }
        Insert: {
          id?: string
          factura_id: string
          numero_linea: number
          codigo?: string | null
          descripcion: string
          cantidad: number
          precio_unitario: number
          tipo_impuesto?: string | null
          tarifa_impuesto?: number | null
          monto_impuesto?: number | null
          total_linea: number
        }
        Update: {
          id?: string
          factura_id?: string
          numero_linea?: number
          codigo?: string | null
          descripcion?: string
          cantidad?: number
          precio_unitario?: number
          tipo_impuesto?: string | null
          tarifa_impuesto?: number | null
          monto_impuesto?: number | null
          total_linea?: number
        }
      }
      distribuciones_costo: {
        Row: {
          id: string
          factura_id: string
          centro_costo: string
          sub_centro: string | null
          porcentaje: number
          monto: number
        }
        Insert: {
          id?: string
          factura_id: string
          centro_costo: string
          sub_centro?: string | null
          porcentaje: number
          monto: number
        }
        Update: {
          id?: string
          factura_id?: string
          centro_costo?: string
          sub_centro?: string | null
          porcentaje?: number
          monto?: number
        }
      }
      ordenes_compra: {
        Row: {
          id: string
          numero_oc: string
          factura_id: string
          concepto: Json | null
          categoria: string | null
          solicitante_nombre: string | null
          solicitante_cargo: string | null
          solicitante_correo: string | null
          autorizado_por: string | null
          fecha_generacion: string | null
        }
        Insert: {
          id?: string
          numero_oc: string
          factura_id: string
          concepto?: Json | null
          categoria?: string | null
          solicitante_nombre?: string | null
          solicitante_cargo?: string | null
          solicitante_correo?: string | null
          autorizado_por?: string | null
          fecha_generacion?: string | null
        }
        Update: {
          id?: string
          numero_oc?: string
          factura_id?: string
          concepto?: Json | null
          categoria?: string | null
          solicitante_nombre?: string | null
          solicitante_cargo?: string | null
          solicitante_correo?: string | null
          autorizado_por?: string | null
          fecha_generacion?: string | null
        }
      }
      log_procesamiento: {
        Row: {
          id: string
          factura_id: string
          evento: 'subido' | 'cola' | 'extrayendo' | 'extraido' | 'error' | 'reintento' | 'validado' | 'vinculado'
          detalle: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          factura_id: string
          evento: 'subido' | 'cola' | 'extrayendo' | 'extraido' | 'error' | 'reintento' | 'validado' | 'vinculado'
          detalle?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          factura_id?: string
          evento?: 'subido' | 'cola' | 'extrayendo' | 'extraido' | 'error' | 'reintento' | 'validado' | 'vinculado'
          detalle?: string | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generar_numero_oc: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Tipos de conveniencia
export type Configuracion = Database['public']['Tables']['configuracion']['Row']
export type CentroCosto = Database['public']['Tables']['centros_costo']['Row']
export type SubCentro = Database['public']['Tables']['sub_centros']['Row']
export type Proveedor = Database['public']['Tables']['proveedores']['Row']
export type Factura = Database['public']['Tables']['facturas']['Row']
export type LineaFactura = Database['public']['Tables']['lineas_factura']['Row']
export type DistribucionCosto = Database['public']['Tables']['distribuciones_costo']['Row']
export type OrdenCompra = Database['public']['Tables']['ordenes_compra']['Row']
export type LogProcesamiento = Database['public']['Tables']['log_procesamiento']['Row']

// Tipos extendidos con relaciones
export type CentroCostoConSubs = CentroCosto & { sub_centros: SubCentro[] }

// Tipos de config
export interface DatosEmpresa {
  nombre: string
  nit: string
  direccion: string
  ciudad: string
  correo: string
  telefono: string
}

export interface SolicitanteDefault {
  nombre: string
  cargo: string
  correo: string
}

export interface AutorizadorDefault {
  nombre: string
}

export interface ConceptoConfig {
  id: string
  nombre: string
  activo: boolean
}
