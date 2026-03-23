import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { extractInvoice } from '@/lib/ai/gemini'

export const maxDuration = 120 // 2 minutos — Gemini puede tardar en PDFs grandes

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Parsear multipart form data
  let file: File | null = null
  try {
    const formData = await req.formData()
    file = formData.get('pdf') as File | null
  } catch {
    return NextResponse.json({ error: 'Error al leer el archivo' }, { status: 400 })
  }

  if (!file || file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Se requiere un archivo PDF válido' }, { status: 400 })
  }

  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: 'El archivo no puede superar 15 MB' }, { status: 400 })
  }

  // Leer bytes
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Calcular hash SHA-256 para deduplicación
  const hashPdf = createHash('sha256').update(buffer).digest('hex')

  // Verificar si ya existe
  const { data: existing } = await supabase
    .from('facturas')
    .select('id, numero_factura, estado')
    .eq('hash_pdf', hashPdf)
    .single()

  if (existing) {
    return NextResponse.json(
      {
        error: `Esta factura ya fue procesada anteriormente (${existing.numero_factura})`,
        facturaId: existing.id,
        duplicado: true,
      },
      { status: 409 }
    )
  }

  // Subir PDF a Supabase Storage
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${timestamp}_${safeName}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('facturas')
    .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    return NextResponse.json(
      { error: `Error al subir el archivo: ${uploadError.message}` },
      { status: 500 }
    )
  }

  // Crear registro de factura placeholder
  const { data: factura, error: facturaError } = await supabase
    .from('facturas')
    .insert({
      numero_factura: 'PROCESANDO...',
      hash_pdf: hashPdf,
      archivo_original_path: uploadData.path,
      estado: 'extraida' as const,
    })
    .select('id')
    .single()

  if (facturaError || !factura) {
    return NextResponse.json(
      { error: `Error al registrar la factura: ${facturaError?.message}` },
      { status: 500 }
    )
  }

  const facturaId = factura.id

  // Log: subido
  await supabase.from('log_procesamiento').insert({
    factura_id: facturaId,
    evento: 'subido' as const,
    detalle: file.name,
  })

  // Extraer datos con Gemini
  let geminiData
  try {
    await supabase.from('log_procesamiento').insert({
      factura_id: facturaId,
      evento: 'extrayendo' as const,
    })

    const base64 = buffer.toString('base64')
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

  // Validar que sea una factura real
  if (!geminiData.numero_factura || !geminiData.nit_emisor) {
    await supabase.from('facturas').update({ estado: 'error' as const }).eq('id', facturaId)
    await supabase.from('log_procesamiento').insert({
      factura_id: facturaId,
      evento: 'error' as const,
      detalle: 'El PDF no parece ser una factura válida (sin número o NIT)',
    })
    return NextResponse.json(
      { error: 'El PDF no parece ser una factura electrónica válida', facturaId },
      { status: 422 }
    )
  }

  // Buscar o crear proveedor por NIT
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

  // Actualizar factura con datos extraídos
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

  // Verificar deduplicación lógica (mismo proveedor + mismo número de factura)
  if (proveedorId) {
    const { data: dupLogico } = await supabase
      .from('facturas')
      .select('id')
      .eq('proveedor_id', proveedorId)
      .eq('numero_factura', geminiData.numero_factura)
      .neq('id', facturaId)
      .single()

    if (dupLogico) {
      // Eliminar la factura recién creada y notificar
      await supabase.from('facturas').delete().eq('id', facturaId)
      return NextResponse.json(
        {
          error: `Ya existe una factura ${geminiData.numero_factura} de este proveedor`,
          facturaId: dupLogico.id,
          duplicado: true,
        },
        { status: 409 }
      )
    }
  }

  // Insertar líneas de factura
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
    detalle: `Proveedor: ${geminiData.nombre_emisor} | Factura: ${geminiData.numero_factura}`,
  })

  return NextResponse.json({ facturaId, numeroFactura: geminiData.numero_factura })
}
