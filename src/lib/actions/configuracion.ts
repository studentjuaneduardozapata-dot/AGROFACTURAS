'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CentroCostoConSubs, DatosEmpresa, SolicitanteDefault, AutorizadorDefault } from '@/lib/supabase/types'

// -------------------------------------------------------
// CENTROS DE COSTO
// -------------------------------------------------------

export async function getCentrosCosto(): Promise<CentroCostoConSubs[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('centros_costo')
    .select('*, sub_centros(*)')
    .order('nombre')

  if (error) throw new Error(error.message)
  return (data ?? []) as CentroCostoConSubs[]
}

export async function createCentroCosto(formData: FormData) {
  const supabase = await createClient()

  const nombre = (formData.get('nombre') as string).trim()
  const color = formData.get('color') as string
  const activo = formData.get('activo') === 'true'

  if (!nombre) return { error: 'El nombre es requerido' }

  const { error } = await supabase
    .from('centros_costo')
    .insert({ nombre, color: color || '#6ab04c', activo })

  if (error) {
    if (error.code === '23505') return { error: 'Ya existe un centro de costo con ese nombre' }
    return { error: error.message }
  }

  revalidatePath('/configuracion')
  return { success: true }
}

export async function updateCentroCosto(id: string, formData: FormData) {
  const supabase = await createClient()

  const nombre = (formData.get('nombre') as string).trim()
  const color = formData.get('color') as string
  const activo = formData.get('activo') === 'true'

  if (!nombre) return { error: 'El nombre es requerido' }

  const { error } = await supabase
    .from('centros_costo')
    .update({ nombre, color: color || '#6ab04c', activo })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') return { error: 'Ya existe un centro de costo con ese nombre' }
    return { error: error.message }
  }

  revalidatePath('/configuracion')
  return { success: true }
}

export async function deleteCentroCosto(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('centros_costo')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/configuracion')
  return { success: true }
}

export async function toggleActivoCentroCosto(id: string, activo: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('centros_costo')
    .update({ activo })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/configuracion')
  return { success: true }
}

// -------------------------------------------------------
// SUB-CENTROS
// -------------------------------------------------------

export async function createSubCentro(formData: FormData) {
  const supabase = await createClient()

  const centro_costo_id = formData.get('centro_costo_id') as string
  const nombre = (formData.get('nombre') as string).trim()
  const activo = formData.get('activo') !== 'false'

  if (!nombre) return { error: 'El nombre es requerido' }
  if (!centro_costo_id) return { error: 'El centro de costo es requerido' }

  const { error } = await supabase
    .from('sub_centros')
    .insert({ centro_costo_id, nombre, activo })

  if (error) {
    if (error.code === '23505') return { error: 'Ya existe un sub-centro con ese nombre en este centro' }
    return { error: error.message }
  }

  revalidatePath('/configuracion')
  return { success: true }
}

export async function updateSubCentro(id: string, formData: FormData) {
  const supabase = await createClient()

  const nombre = (formData.get('nombre') as string).trim()
  const activo = formData.get('activo') === 'true'

  if (!nombre) return { error: 'El nombre es requerido' }

  const { error } = await supabase
    .from('sub_centros')
    .update({ nombre, activo })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') return { error: 'Ya existe un sub-centro con ese nombre en este centro' }
    return { error: error.message }
  }

  revalidatePath('/configuracion')
  return { success: true }
}

export async function deleteSubCentro(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sub_centros')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/configuracion')
  return { success: true }
}

// -------------------------------------------------------
// CONFIGURACIÓN (datos empresa, solicitante, autorizador)
// -------------------------------------------------------

export async function getConfiguracion(clave: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', clave)
    .single()

  if (error) return null
  return data?.valor ?? null
}

export async function upsertConfiguracion(clave: string, valor: object) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('configuracion')
    .upsert({ clave, valor }, { onConflict: 'clave' })

  if (error) return { error: error.message }

  revalidatePath('/configuracion')
  return { success: true }
}

export async function saveDatosEmpresa(formData: FormData) {
  const valor: DatosEmpresa = {
    nombre:    (formData.get('nombre') as string).trim(),
    nit:       (formData.get('nit') as string).trim(),
    direccion: (formData.get('direccion') as string).trim(),
    ciudad:    (formData.get('ciudad') as string).trim(),
    correo:    (formData.get('correo') as string).trim(),
    telefono:  (formData.get('telefono') as string).trim(),
  }

  return await upsertConfiguracion('datos_empresa', valor)
}

export async function saveSolicitanteDefault(formData: FormData) {
  const solicitante: SolicitanteDefault = {
    nombre: (formData.get('solicitante_nombre') as string).trim(),
    cargo:  (formData.get('solicitante_cargo') as string).trim(),
    correo: (formData.get('solicitante_correo') as string).trim(),
  }

  const autorizador: AutorizadorDefault = {
    nombre: (formData.get('autorizador_nombre') as string).trim(),
  }

  const [r1, r2] = await Promise.all([
    upsertConfiguracion('solicitante_default', solicitante),
    upsertConfiguracion('autorizador_default', autorizador),
  ])

  if (r1.error) return r1
  if (r2.error) return r2
  return { success: true }
}
