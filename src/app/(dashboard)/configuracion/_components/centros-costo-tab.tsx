'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CentroFormDialog, EditCentroButton } from './centro-form-dialog'
import {
  deleteCentroCosto,
  toggleActivoCentroCosto,
} from '@/lib/actions/configuracion'
import type { CentroCosto } from '@/lib/supabase/types'

interface CentrosCostoTabProps {
  centros: CentroCosto[]
}

export function CentrosCostoTab({ centros }: CentrosCostoTabProps) {
  async function handleDeleteCentro(id: string, nombre: string) {
    const result = await deleteCentroCosto(id)
    if ('error' in result) toast.error(result.error)
    else toast.success(`Centro "${nombre}" eliminado`)
  }

  async function handleToggleActivo(id: string, activo: boolean) {
    const result = await toggleActivoCentroCosto(id, activo)
    if ('error' in result) toast.error(result.error)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {centros.length}/4 centro{centros.length !== 1 ? 's' : ''} de costo configurado{centros.length !== 1 ? 's' : ''}
          {centros.length >= 4 && ' · máximo alcanzado'}
        </p>
        {centros.length < 4 && <CentroFormDialog />}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nombre</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {centros.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No hay centros de costo. Agrega el primero.
                </TableCell>
              </TableRow>
            )}
            {centros.map((centro) => (
              <TableRow key={centro.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{centro.nombre}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full border"
                      style={{ backgroundColor: centro.color }}
                    />
                    <span className="text-xs font-mono text-muted-foreground">{centro.color}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={centro.activo}
                    onCheckedChange={(checked) => handleToggleActivo(centro.id, checked)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <EditCentroButton centro={centro} />
                    <DeleteConfirmDialog
                      title="Eliminar centro de costo"
                      description={`¿Eliminar "${centro.nombre}"? Esta acción no se puede deshacer.`}
                      onConfirm={() => handleDeleteCentro(centro.id, centro.nombre)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function DeleteConfirmDialog({
  title,
  description,
  onConfirm,
}: {
  title: string
  description: string
  onConfirm: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <span onClick={() => setOpen(true)} className="inline-flex cursor-pointer">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => {
                onConfirm()
                setOpen(false)
              }}
            >
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
