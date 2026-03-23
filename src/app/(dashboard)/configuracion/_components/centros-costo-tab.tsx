'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { SubCentroFormDialog, EditSubCentroButton } from './sub-centro-form-dialog'
import {
  deleteCentroCosto,
  deleteSubCentro,
  toggleActivoCentroCosto,
} from '@/lib/actions/configuracion'
import type { CentroCostoConSubs } from '@/lib/supabase/types'

interface CentrosCostoTabProps {
  centros: CentroCostoConSubs[]
}

export function CentrosCostoTab({ centros }: CentrosCostoTabProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleDeleteCentro(id: string, nombre: string) {
    const result = await deleteCentroCosto(id)
    if ('error' in result) toast.error(result.error)
    else toast.success(`Centro "${nombre}" eliminado`)
  }

  async function handleDeleteSubCentro(id: string, nombre: string) {
    const result = await deleteSubCentro(id)
    if ('error' in result) toast.error(result.error)
    else toast.success(`Sub-centro "${nombre}" eliminado`)
  }

  async function handleToggleActivo(id: string, activo: boolean) {
    const result = await toggleActivoCentroCosto(id, activo)
    if ('error' in result) toast.error(result.error)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {centros.length} centro{centros.length !== 1 ? 's' : ''} de costo configurado{centros.length !== 1 ? 's' : ''}
        </p>
        <CentroFormDialog />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-8" />
              <TableHead>Nombre</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Sub-centros</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {centros.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No hay centros de costo. Agrega el primero.
                </TableCell>
              </TableRow>
            )}
            {centros.map((centro) => (
              <>
                <TableRow key={centro.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleExpand(centro.id)}
                    >
                      {expanded.has(centro.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
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
                  <TableCell>
                    <Badge variant="secondary">{centro.sub_centros.length}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <EditCentroButton centro={centro} />
                      <DeleteConfirmDialog
                        title="Eliminar centro de costo"
                        description={`¿Eliminar "${centro.nombre}"? También se eliminarán todos sus sub-centros.`}
                        onConfirm={() => handleDeleteCentro(centro.id, centro.nombre)}
                      />
                    </div>
                  </TableCell>
                </TableRow>

                {/* Sub-centros expandibles */}
                {expanded.has(centro.id) && (
                  <TableRow key={`${centro.id}-subs`} className="bg-muted/20">
                    <TableCell colSpan={6} className="py-3 pl-12">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Sub-centros de {centro.nombre}
                          </span>
                          <SubCentroFormDialog
                            centroCostoId={centro.id}
                            centroCostoNombre={centro.nombre}
                          />
                        </div>

                        {centro.sub_centros.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Sin sub-centros aún.</p>
                        ) : (
                          <div className="space-y-1">
                            {centro.sub_centros.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between py-1 px-2 rounded bg-background border text-sm"
                              >
                                <span>{sub.nombre}</span>
                                <div className="flex items-center gap-1">
                                  <EditSubCentroButton
                                    subCentro={sub}
                                    centroCostoId={centro.id}
                                    centroCostoNombre={centro.nombre}
                                  />
                                  <DeleteConfirmDialog
                                    title="Eliminar sub-centro"
                                    description={`¿Eliminar "${sub.nombre}"?`}
                                    onConfirm={() => handleDeleteSubCentro(sub.id, sub.nombre)}
                                    small
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Diálogo de confirmación de eliminación reutilizable (sin asChild)
function DeleteConfirmDialog({
  title,
  description,
  onConfirm,
  small = false,
}: {
  title: string
  description: string
  onConfirm: () => void
  small?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <span onClick={() => setOpen(true)} className="inline-flex cursor-pointer">
        <Button variant="ghost" size="icon" className={small ? 'h-7 w-7' : 'h-8 w-8'}>
          <Trash2 className={small ? 'h-3 w-3 text-destructive' : 'h-4 w-4 text-destructive'} />
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
