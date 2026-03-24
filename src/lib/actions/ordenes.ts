'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Factura, Proveedor, LineaFactura, DistribucionCosto, OrdenCompra } from '@/lib/supabase/types'

export type FacturaParaOC = Factura & {
  proveedores: Proveedor | null
  lineas_factura: LineaFactura[]
  distribuciones_costo: DistribucionCosto[]
  ordenes_compra: OrdenCompra[]
}

export interface DatosEmpresaConfig {
  nombre: string
  nit: string
  direccion: string
  ciudad: string
  correo: string
  telefono: string
}

export interface SolicitanteConfig {
  nombre: string
  cargo: string
  correo: string
}

export interface OCPageData {
  factura: FacturaParaOC
  oc: OrdenCompra
  empresa: DatosEmpresaConfig | null
}

// -------------------------------------------------------
// QUERIES
// -------------------------------------------------------

export async function getOrdenCompraData(facturaId: string): Promise<OCPageData | null> {
  const supabase = await createClient()

  const [facturaRes, ocRes, empresaRes] = await Promise.all([
    supabase
      .from('facturas')
      .select('*, proveedores(*), lineas_factura(*), distribuciones_costo(*)')
      .eq('id', facturaId)
      .single(),
    supabase
      .from('ordenes_compra')
      .select('*')
      .eq('factura_id', facturaId)
      .single(),
    supabase.from('configuracion').select('valor').eq('clave', 'datos_empresa').single(),
  ])

  if (facturaRes.error || !facturaRes.data) {
    console.error('[getOrdenCompraData] Error fetching factura:', facturaRes.error)
    return null
  }

  if (ocRes.error || !ocRes.data) {
    console.error('[getOrdenCompraData] Error fetching OC:', ocRes.error)
    return null
  }

  const factura = facturaRes.data as Omit<FacturaParaOC, 'ordenes_compra'>
  const oc = ocRes.data as OrdenCompra

  // Ordenar líneas
  if (Array.isArray(factura.lineas_factura)) {
    factura.lineas_factura.sort((a, b) => (a.numero_linea ?? 0) - (b.numero_linea ?? 0))
  }

  return {
    factura: factura as FacturaParaOC,
    oc,
    empresa: (empresaRes.data?.valor as DatosEmpresaConfig) ?? null,
  }
}

// -------------------------------------------------------
// GENERACIÓN DE ORDEN DE COMPRA
// -------------------------------------------------------

export async function generarOrdenCompra(facturaId: string) {
  const supabase = await createClient()

  // Obtener factura con proveedor
  const { data: factura, error: facturaError } = await supabase
    .from('facturas')
    .select('*, proveedores(*)')
    .eq('id', facturaId)
    .single()

  if (facturaError || !factura) return { error: 'Factura no encontrada' }
  if (factura.estado !== 'validada') {
    return { error: 'La factura debe estar en estado "validada" para generar una OC' }
  }

  // Verificar si ya tiene OC
  const { data: existingOC } = await supabase
    .from('ordenes_compra')
    .select('id, numero_oc')
    .eq('factura_id', facturaId)
    .single()

  if (existingOC) {
    return {
      error: `Ya existe una OC para esta factura: ${existingOC.numero_oc}`,
      ocExistente: true,
    }
  }

  // Obtener configuración solicitante + autorizador
  const [{ data: solConf }, { data: autConf }] = await Promise.all([
    supabase.from('configuracion').select('valor').eq('clave', 'solicitante_default').single(),
    supabase.from('configuracion').select('valor').eq('clave', 'autorizador_default').single(),
  ])

  const solicitante = solConf?.valor as { nombre: string; cargo: string; correo: string } | null
  const autorizador = autConf?.valor as { nombre: string } | null

  // Generar número OC via función SQL
  const { data: numeroOc, error: rpcError } = await supabase.rpc('generar_numero_oc')
  if (rpcError || !numeroOc) {
    return { error: `Error al generar número de OC: ${rpcError?.message ?? 'RPC falló'}` }
  }

  // Obtener concepto y categoría desde memoria del proveedor
  const proveedor = factura.proveedores as Proveedor | null
  const concepto = proveedor?.ultimo_concepto ?? null
  const categoria = proveedor?.ultima_categoria ?? null

  // Crear la orden de compra
  const { data: oc, error: ocError } = await supabase
    .from('ordenes_compra')
    .insert({
      numero_oc: numeroOc as string,
      factura_id: facturaId,
      concepto,
      categoria,
      solicitante_nombre: solicitante?.nombre ?? null,
      solicitante_cargo: solicitante?.cargo ?? null,
      solicitante_correo: solicitante?.correo ?? null,
      autorizado_por: autorizador?.nombre ?? null,
    })
    .select('id, numero_oc')
    .single()

  if (ocError || !oc) {
    return { error: `Error al crear la OC: ${ocError?.message}` }
  }

  // Actualizar estado de la factura
  const nuevoEstadoPago = factura.forma_pago === 'CRÉDITO' ? 'pendiente' : 'no_aplica'
  await supabase
    .from('facturas')
    .update({ estado: 'vinculada', estado_pago: nuevoEstadoPago })
    .eq('id', facturaId)

  // Log
  await supabase.from('log_procesamiento').insert({
    factura_id: facturaId,
    evento: 'vinculado' as const,
    detalle: `Orden de compra generada: ${oc.numero_oc}`,
  })

  revalidatePath('/facturas')
  revalidatePath(`/facturas/${facturaId}/validar`)

  return { success: true, numeroOc: oc.numero_oc as string }
}
