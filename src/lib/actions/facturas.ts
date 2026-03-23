'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Factura, Proveedor, LineaFactura, DistribucionCosto } from '@/lib/supabase/types'

// -------------------------------------------------------
// TIPOS EXTENDIDOS
// -------------------------------------------------------

export type FacturaConProveedor = Factura & {
  proveedores: Pick<Proveedor, 'id' | 'nit' | 'razon_social'> | null
}

export type FacturaDetallada = Factura & {
  proveedores: Proveedor | null
  lineas_factura: LineaFactura[]
  distribuciones_costo: DistribucionCosto[]
  ordenes_compra: import('@/lib/supabase/types').OrdenCompra[]
}

export interface LineaEditable {
  localId: string
  dbId?: string
  numero_linea: number
  codigo: string
  descripcion: string
  cantidad: number
  precio_unitario: number
  tipo_impuesto: string
  tarifa_impuesto: number
  monto_impuesto: number
  total_linea: number
}

export interface DistribucionEditable {
  localId: string
  dbId?: string
  centro_costo: string
  sub_centro: string
  porcentaje: number
  monto: number
}

export interface ConceptoItem {
  concepto: string
  porcentaje: number
}

export interface SaveValidacionInput {
  facturaId: string
  proveedorId: string | null
  proveedor: {
    razon_social: string
    regimen_tributario: string
    tipo_persona: string
    direccion: string
    telefono: string
    email: string
  }
  factura: {
    numero_factura: string
    fecha_emision: string
    forma_pago: 'CONTADO' | 'CRÉDITO'
    subtotal: number
    iva: number
    inc: number
    rete_fuente: number
    rete_iva: number
    rete_ica: number
    total_impuestos: number
    total_neto: number
    informacion: string
  }
  lineas: Omit<LineaEditable, 'localId' | 'dbId'>[]
  distribuciones: Omit<DistribucionEditable, 'localId' | 'dbId'>[]
  concepto: ConceptoItem[]
  categoria: string
  validar: boolean
}

// -------------------------------------------------------
// QUERIES
// -------------------------------------------------------

export async function getFacturas(): Promise<FacturaConProveedor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('facturas')
    .select('*, proveedores(id, nit, razon_social)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as FacturaConProveedor[]
}

export async function getFactura(id: string): Promise<FacturaDetallada | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('facturas')
    .select('*, proveedores(*), lineas_factura(*), distribuciones_costo(*), ordenes_compra(*)')
    .eq('id', id)
    .order('numero_linea', { referencedTable: 'lineas_factura', ascending: true })
    .single()

  if (error) return null
  return data as FacturaDetallada
}

export async function getSignedUrl(path: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.storage
    .from('facturas')
    .createSignedUrl(path, 3600) // 1 hora

  return data?.signedUrl ?? null
}

// -------------------------------------------------------
// MUTACIONES
// -------------------------------------------------------

export async function saveValidacion(input: SaveValidacionInput) {
  const supabase = await createClient()

  // 1. Actualizar datos del proveedor (si existe)
  if (input.proveedorId) {
    await supabase
      .from('proveedores')
      .update({
        razon_social: input.proveedor.razon_social || null,
        regimen_tributario: input.proveedor.regimen_tributario || null,
        tipo_persona: input.proveedor.tipo_persona || null,
        direccion: input.proveedor.direccion || null,
        telefono: input.proveedor.telefono || null,
        email: input.proveedor.email || null,
      })
      .eq('id', input.proveedorId)
  }

  // 2. Actualizar factura
  const facturaUpdate: Record<string, unknown> = {
    numero_factura: input.factura.numero_factura,
    fecha_emision: input.factura.fecha_emision || null,
    forma_pago: input.factura.forma_pago || null,
    subtotal: input.factura.subtotal,
    iva: input.factura.iva,
    inc: input.factura.inc,
    rete_fuente: input.factura.rete_fuente,
    rete_iva: input.factura.rete_iva,
    rete_ica: input.factura.rete_ica,
    total_impuestos: input.factura.total_impuestos,
    total_neto: input.factura.total_neto,
    informacion: input.factura.informacion || null,
  }

  if (input.validar) {
    facturaUpdate.estado = 'validada'
  }

  const { error: facturaError } = await supabase
    .from('facturas')
    .update(facturaUpdate)
    .eq('id', input.facturaId)

  if (facturaError) return { error: facturaError.message }

  // 3. Reemplazar líneas (delete all + insert)
  await supabase.from('lineas_factura').delete().eq('factura_id', input.facturaId)

  if (input.lineas.length > 0) {
    const { error: lineasError } = await supabase.from('lineas_factura').insert(
      input.lineas.map((l) => ({
        factura_id: input.facturaId,
        numero_linea: l.numero_linea,
        codigo: l.codigo || '',
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        tipo_impuesto: l.tipo_impuesto || '',
        tarifa_impuesto: l.tarifa_impuesto || 0,
        monto_impuesto: l.monto_impuesto || 0,
        total_linea: l.total_linea,
      }))
    )
    if (lineasError) return { error: `Error en líneas: ${lineasError.message}` }
  }

  // 4. Reemplazar distribuciones (delete all + insert)
  await supabase.from('distribuciones_costo').delete().eq('factura_id', input.facturaId)

  if (input.distribuciones.length > 0) {
    const { error: distError } = await supabase.from('distribuciones_costo').insert(
      input.distribuciones.map((d) => ({
        factura_id: input.facturaId,
        centro_costo: d.centro_costo,
        sub_centro: d.sub_centro || '',
        porcentaje: d.porcentaje,
        monto: d.monto,
      }))
    )
    if (distError) return { error: `Error en distribución: ${distError.message}` }
  }

  // 5. Si se valida, guardar memoria en proveedor y registrar log
  if (input.validar && input.proveedorId) {
    await supabase
      .from('proveedores')
      .update({
        ultimo_concepto: input.concepto.length > 0 ? input.concepto : null,
        ultima_categoria: input.categoria || null,
        ultima_distribucion: input.distribuciones.length > 0
          ? input.distribuciones.map(d => ({
              centro_costo: d.centro_costo,
              sub_centro: d.sub_centro,
              porcentaje: d.porcentaje,
            }))
          : null,
      })
      .eq('id', input.proveedorId)

    await supabase.from('log_procesamiento').insert({
      factura_id: input.facturaId,
      evento: 'validado' as const,
      detalle: `Validado por usuario`,
    })
  }

  revalidatePath('/facturas')
  revalidatePath(`/facturas/${input.facturaId}/validar`)
  return { success: true }
}

export async function deleteFactura(id: string) {
  const supabase = await createClient()

  // Obtener path del archivo para eliminarlo de Storage
  const { data: factura } = await supabase
    .from('facturas')
    .select('archivo_original_path')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('facturas').delete().eq('id', id)
  if (error) return { error: error.message }

  // Eliminar archivo de Storage si existe
  if (factura?.archivo_original_path) {
    await supabase.storage.from('facturas').remove([factura.archivo_original_path])
  }

  revalidatePath('/facturas')
  return { success: true }
}

export async function marcarPagada(id: string, estadoPago: 'pendiente' | 'pagada' | 'no_aplica') {
  const supabase = await createClient()
  const { error } = await supabase
    .from('facturas')
    .update({ estado_pago: estadoPago })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/facturas')
  return { success: true }
}
