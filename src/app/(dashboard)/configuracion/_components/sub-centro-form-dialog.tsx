'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSubCentro, updateSubCentro } from '@/lib/actions/configuracion'
import type { SubCentro } from '@/lib/supabase/types'

interface SubCentroFormDialogProps {
  centroCostoId: string
  centroCostoNombre: string
  subCentro?: SubCentro
  trigger?: React.ReactNode
}

export function SubCentroFormDialog({
  centroCostoId,
  centroCostoNombre,
  subCentro,
  trigger,
}: SubCentroFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set('centro_costo_id', centroCostoId)
    formData.set('activo', 'true')

    const result = subCentro
      ? await updateSubCentro(subCentro.id, formData)
      : await createSubCentro(formData)

    setLoading(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success(subCentro ? 'Sub-centro actualizado' : 'Sub-centro creado')
      setOpen(false)
      formRef.current?.reset()
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="inline-flex cursor-pointer">
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Plus className="mr-1 h-3 w-3" />
            Agregar Sub-centro
          </Button>
        )}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {subCentro ? 'Editar Sub-centro' : 'Nuevo Sub-centro'}
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground -mt-2">
            Centro de costo: <span className="font-medium text-foreground">{centroCostoNombre}</span>
          </p>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre-sub">Nombre</Label>
              <Input
                id="nombre-sub"
                name="nombre"
                defaultValue={subCentro?.nombre}
                placeholder="Ej: Planta Zaragoza"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#6ab04c] hover:bg-[#4a8a35] text-white"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function EditSubCentroButton({
  subCentro,
  centroCostoId,
  centroCostoNombre,
}: {
  subCentro: SubCentro
  centroCostoId: string
  centroCostoNombre: string
}) {
  return (
    <SubCentroFormDialog
      centroCostoId={centroCostoId}
      centroCostoNombre={centroCostoNombre}
      subCentro={subCentro}
      trigger={
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Pencil className="h-3 w-3" />
        </Button>
      }
    />
  )
}
