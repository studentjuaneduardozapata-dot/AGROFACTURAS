'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, Building2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { updateProveedor, deleteProveedor, createProveedor, type ProveedorConFacturas } from '@/lib/actions/proveedores'

interface ProveedoresListProps {
  proveedores: ProveedorConFacturas[]
}

export function ProveedoresList({ proveedores }: ProveedoresListProps) {
  const [search, setSearch] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const filtered = proveedores.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.nit.includes(search) ||
      (p.razon_social ?? '').toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q)
    )
  })

  const editingProveedor = proveedores.find((p) => p.id === editId)

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteProveedor(id)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Proveedor eliminado')
        setDeleteId(null)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por NIT, nombre o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-sm h-9 px-3 text-sm border rounded-md bg-background outline-none focus:ring-2 focus:ring-ring"
        />
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Nuevo Proveedor
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>NIT</TableHead>
              <TableHead>Razón Social</TableHead>
              <TableHead>Régimen</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead className="text-center">Facturas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  {proveedores.length === 0
                    ? 'No hay proveedores registrados. Se crean automáticamente al procesar facturas.'
                    : 'No hay proveedores que coincidan con la búsqueda.'}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => (
              <TableRow key={p.id} className="hover:bg-muted/20">
                <TableCell className="font-mono text-sm">{p.nit}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">{p.razon_social ?? '—'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {p.regimen_tributario ?? '—'}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{p.email ?? '—'}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{p._count_facturas}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span onClick={() => setEditId(p.id)} className="inline-flex cursor-pointer">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </span>
                    <span onClick={() => setDeleteId(p.id)} className="inline-flex cursor-pointer">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {proveedores.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} de {proveedores.length} proveedor{proveedores.length !== 1 ? 'es' : ''}
        </p>
      )}

      {/* Dialog Crear */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Proveedor</DialogTitle>
          </DialogHeader>
          <form
            action={async (fd) => {
              startTransition(async () => {
                const result = await createProveedor(fd)
                if ('error' in result) {
                  toast.error(result.error)
                } else {
                  toast.success('Proveedor creado exitosamente')
                  setCreateOpen(false)
                }
              })
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="create_nit" className="text-xs">NIT *</Label>
                <Input
                  id="create_nit"
                  name="nit"
                  placeholder="Ej: 900123456-1"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="create_razon_social" className="text-xs">Razón Social *</Label>
                <Input
                  id="create_razon_social"
                  name="razon_social"
                  placeholder="Nombre o razón social"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="create_regimen_tributario" className="text-xs">Régimen Tributario</Label>
                <select
                  id="create_regimen_tributario"
                  name="regimen_tributario"
                  className="w-full h-9 text-sm border rounded-md px-2 bg-background outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">—</option>
                  <option value="Responsable IVA">Responsable IVA</option>
                  <option value="No responsable IVA">No responsable IVA</option>
                  <option value="Gran Contribuyente">Gran Contribuyente</option>
                  <option value="Régimen Simple">Régimen Simple</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="create_tipo_persona" className="text-xs">Tipo Persona</Label>
                <select
                  id="create_tipo_persona"
                  name="tipo_persona"
                  className="w-full h-9 text-sm border rounded-md px-2 bg-background outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">—</option>
                  <option value="Persona Jurídica">Persona Jurídica</option>
                  <option value="Persona Natural">Persona Natural</option>
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="create_direccion" className="text-xs">Dirección</Label>
                <Input id="create_direccion" name="direccion" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="create_telefono" className="text-xs">Teléfono</Label>
                <Input id="create_telefono" name="telefono" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="create_email" className="text-xs">Correo electrónico</Label>
                <Input id="create_email" name="email" type="email" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                Crear Proveedor
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      {editingProveedor && (
        <Dialog open={editId !== null} onOpenChange={(v) => { if (!v) setEditId(null) }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Proveedor — NIT {editingProveedor.nit}</DialogTitle>
            </DialogHeader>
            <form
              action={async (fd) => {
                startTransition(async () => {
                  const result = await updateProveedor(editId!, fd)
                  if ('error' in result) {
                    toast.error(result.error)
                  } else {
                    toast.success('Proveedor actualizado')
                    setEditId(null)
                  }
                })
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="razon_social" className="text-xs">Razón Social</Label>
                  <Input
                    id="razon_social"
                    name="razon_social"
                    defaultValue={editingProveedor.razon_social ?? ''}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="regimen_tributario" className="text-xs">Régimen Tributario</Label>
                  <select
                    id="regimen_tributario"
                    name="regimen_tributario"
                    defaultValue={editingProveedor.regimen_tributario ?? ''}
                    className="w-full h-9 text-sm border rounded-md px-2 bg-background outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">—</option>
                    <option value="Responsable IVA">Responsable IVA</option>
                    <option value="No responsable IVA">No responsable IVA</option>
                    <option value="Gran Contribuyente">Gran Contribuyente</option>
                    <option value="Régimen Simple">Régimen Simple</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tipo_persona" className="text-xs">Tipo Persona</Label>
                  <select
                    id="tipo_persona"
                    name="tipo_persona"
                    defaultValue={editingProveedor.tipo_persona ?? ''}
                    className="w-full h-9 text-sm border rounded-md px-2 bg-background outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">—</option>
                    <option value="Persona Jurídica">Persona Jurídica</option>
                    <option value="Persona Natural">Persona Natural</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="direccion" className="text-xs">Dirección</Label>
                  <Input
                    id="direccion"
                    name="direccion"
                    defaultValue={editingProveedor.direccion ?? ''}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="telefono" className="text-xs">Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    defaultValue={editingProveedor.telefono ?? ''}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs">Correo electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editingProveedor.email ?? ''}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditId(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  Guardar cambios
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Eliminar */}
      <Dialog open={deleteId !== null} onOpenChange={(v) => { if (!v) setDeleteId(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar proveedor</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar este proveedor? Solo es posible si no tiene facturas asociadas.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
