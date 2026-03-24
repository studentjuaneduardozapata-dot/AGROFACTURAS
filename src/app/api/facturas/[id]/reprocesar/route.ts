import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractInvoice } from '@/lib/ai/gemini'

export const maxDuration = 120

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id: facturaId } = await params

  // Verificar que la factura existe y está en estado 'error'
  const { data: factura, error: fetchError } = await supabase
    .from('facturas')
    .select('id, estado, archivo_original_path')
    .eq('id', facturaId)
    .single()

  if (fetchError || !factura) {
    return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
  }

  if (factura.estado !== 'error') {
    return NextResponse.json(
      { error: 'Solo se pueden reprocesar facturas en estado "error"' },
      { status: 400 }
    )
  }

  if (!factura.archivo_original_path) {
    return NextResponse.json(
      { error: 'No hay archivo PDF asociado para reprocesar' },
      { status: 400 }
    )
  }

  // Descargar PDF desde Storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('facturas')
    .download(factura.archivo_original_path)

  if (downloadError || !fileData) {
    return NextResponse.json(
      { error: `Error al descargar el PDF: ${downloadError?.message}` },
      { status: 500 }
    )
  }

  // Convertir Blob → Buffer → base64
  const buffer = Buffer.from(await fileData.arrayBuffer())
  const base64 = buffer.toString('base64')

  // Log: reintento
  await supabase.from('log_procesamiento').insert({
    factura_id: facturaId,
    evento: 'reintento' as const,
    detalle: 'Reprocesamiento manual solicitado por usuario',
  })

  // Extraer datos con Gemini
  let geminiData
  try {
    await supabase.from('log_procesamiento').insert({
      factura_id: facturaId,
      evento: 'extrayendo' as const,
    })
    geminiData = await extractInvoice(base64)
  } catch (err) {
    const detalle = err instanceof Error ? err.message : 'Error desconocido en Gemini'
    await supabase.from('facturas').update({ estado: 'error' as const }).eq('id', facturaId)
    await supabase.from('log_procesamiento').insert({
      factura_id: facturaId,
      evento: 'error' as const,
      detalle,
    })
    return NextResponse.json({ error: `Error al procesar con IA: ${detalle}`, facturaId }, { status: 500 })
  }

  // Validar resultado mínimo
  if (!geminiData.numero_factura || !geminiData.nit_emisor) {
    await supabase.from('facturas').update({ estado: 'error' as const }).eq('id', facturaId)
    await supabase.from('log_procesamiento').insert({
      factura_id: facturaId,
      evento: 'error' as const,
      detalle: 'PDF no contiene número de factura o NIT',
    })
    return NextResponse.json(
      { error: 'El PDF no parece ser una factura electrónica válida', facturaId },
      { status: 422 }
    )
  }

  // Buscar o crear proveedor
  let proveedorId: string | null = null
  const { data: existingProveedor } = await supabase
    .from('proveedores')
    .select('id')
    .eq('nit', geminiData.nit_emisor)
    .single()

  if (existingProveedor) {
    proveedorId = existingProveedor.id
  } else {
    const { data: newProveedor } = await supabase
      .from('proveedores')
      .insert({
        nit: geminiData.nit_emisor,
        razon_social: geminiData.nombre_emisor || null,
        regimen_tributario: geminiData.regimen_tributario || null,
        tipo_persona: geminiData.tipo_persona || null,
        direccion: geminiData.direccion_emisor || null,
        telefono: geminiData.telefono_emisor || null,
        email: geminiData.email_emisor || null,
      })
      .select('id')
      .single()

    if (newProveedor) proveedorId = newProveedor.id
  }

  // Actualizar factura con datos nuevos
  await supabase
    .from('facturas')
    .update({
      numero_factura: geminiData.numero_factura,
      fecha_emision: geminiData.fecha_emision || null,
      forma_pago: geminiData.forma_pago || null,
      proveedor_id: proveedorId,
      subtotal: geminiData.subtotal ?? 0,
      iva: geminiData.iva ?? 0,
      inc: geminiData.inc ?? 0,
      rete_fuente: geminiData.rete_fuente ?? 0,
      rete_iva: geminiData.rete_iva ?? 0,
      rete_ica: geminiData.rete_ica ?? 0,
      total_impuestos: geminiData.total_impuestos ?? 0,
      total_neto: geminiData.total_neto ?? 0,
      informacion: geminiData.informacion || null,
      datos_json_crudo: geminiData as unknown as Record<string, unknown>,
      estado: 'extraida' as const,
    })
    .eq('id', facturaId)

  // Reemplazar líneas (delete + insert)
  await supabase.from('lineas_factura').delete().eq('factura_id', facturaId)

  if (geminiData.lineas && geminiData.lineas.length > 0) {
    await supabase.from('lineas_factura').insert(
      geminiData.lineas.map((l) => ({
        factura_id: facturaId,
        numero_linea: l.numero,
        codigo: l.codigo || '',
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        tipo_impuesto: l.tipo_impuesto || '',
        tarifa_impuesto: l.tarifa_impuesto || 0,
        monto_impuesto: l.monto_impuesto || 0,
        total_linea: l.total,
      }))
    )
  }

  // Log: extraído
  await supabase.from('log_procesamiento').insert({
    factura_id: facturaId,
    evento: 'extraido' as const,
    detalle: `Reprocesado: ${geminiData.nombre_emisor} | ${geminiData.numero_factura}`,
  })

  return NextResponse.json({ facturaId, numeroFactura: geminiData.numero_factura })
}
