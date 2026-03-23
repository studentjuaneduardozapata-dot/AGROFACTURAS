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
import { Switch } from '@/components/ui/switch'
import { createCentroCosto, updateCentroCosto } from '@/lib/actions/configuracion'
import type { CentroCosto } from '@/lib/supabase/types'

const PRESET_COLORS = [
  '#6ab04c', '#4a8a35', '#F59E0B', '#3B82F6',
  '#10B981', '#8B5CF6', '#EF4444', '#EC4899',
  '#F97316', '#06B6D4', '#64748B', '#1F2937',
]

interface CentroFormDialogProps {
  centro?: CentroCosto
  trigger?: React.ReactNode
}

export function CentroFormDialog({ centro, trigger }: CentroFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [color, setColor] = useState(centro?.color ?? '#6ab04c')
  const [activo, setActivo] = useState(centro?.activo ?? true)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set('color', color)
    formData.set('activo', String(activo))

    const result = centro
      ? await updateCentroCosto(centro.id, formData)
      : await createCentroCosto(formData)

    setLoading(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success(centro ? 'Centro actualizado' : 'Centro creado')
      setOpen(false)
      formRef.current?.reset()
    }
  }

  return (
    <>
      {/* Trigger — abre el dialog al hacer clic */}
      <span onClick={() => setOpen(true)} className="inline-flex cursor-pointer">
        {trigger ?? (
          <Button size="sm" className="bg-[#6ab04c] hover:bg-[#4a8a35] text-white">
            <Plus className="mr-1 h-4 w-4" />
            Agregar Centro
          </Button>
        )}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {centro ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'}
            </DialogTitle>
          </DialogHeader>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                defaultValue={centro?.nombre}
                placeholder="Ej: Granos"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      color === c ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: color }}
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#6ab04c"
                  className="flex-1 font-mono text-sm"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="activo"
                checked={activo}
                onCheckedChange={setActivo}
              />
              <Label htmlFor="activo">Activo</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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

export function EditCentroButton({ centro }: { centro: CentroCosto }) {
  return (
    <CentroFormDialog
      centro={centro}
      trigger={
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      }
    />
  )
}
