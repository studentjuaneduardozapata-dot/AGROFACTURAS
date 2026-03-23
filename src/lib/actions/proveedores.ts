'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Proveedor } from '@/lib/supabase/types'

export type ProveedorConFacturas = Proveedor & {
  _count_facturas: number
}

export async function getProveedores(): Promise<ProveedorConFacturas[]> {
  const supabase = await createClient()

  // Obtener proveedores con conteo de facturas
  const { data: proveedores, error } = await supabase
    .from('proveedores')
    .select('*')
    .order('razon_social')

  if (error) throw new Error(error.message)

  // Obtener conteos de facturas por proveedor
  const { data: conteos } = await supabase
    .from('facturas')
    .select('proveedor_id')
    .not('proveedor_id', 'is', null)

  const conteoPorId: Record<string, number> = {}
  for (const f of conteos ?? []) {
    if (f.proveedor_id) {
      conteoPorId[f.proveedor_id] = (conteoPorId[f.proveedor_id] ?? 0) + 1
    }
  }

  return (proveedores ?? []).map((p) => ({
    ...p,
    _count_facturas: conteoPorId[p.id] ?? 0,
  }))
}

export async function getProveedor(id: string): Promise<Proveedor | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function updateProveedor(id: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('proveedores')
    .update({
      razon_social: (formData.get('razon_social') as string)?.trim() || null,
      regimen_tributario: (formData.get('regimen_tributario') as string)?.trim() || null,
      tipo_persona: (formData.get('tipo_persona') as string)?.trim() || null,
      direccion: (formData.get('direccion') as string)?.trim() || null,
      telefono: (formData.get('telefono') as string)?.trim() || null,
      email: (formData.get('email') as string)?.trim() || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/proveedores')
  return { success: true }
}

export async function deleteProveedor(id: string) {
  const supabase = await createClient()

  // Verificar que no tenga facturas
  const { count } = await supabase
    .from('facturas')
    .select('id', { count: 'exact', head: true })
    .eq('proveedor_id', id)

  if (count && count > 0) {
    return { error: `No se puede eliminar: tiene ${count} factura${count !== 1 ? 's' : ''} asociada${count !== 1 ? 's' : ''}` }
  }

  const { error } = await supabase.from('proveedores').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/proveedores')
  return { success: true }
}
