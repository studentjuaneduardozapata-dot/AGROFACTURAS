'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Eye, Trash2, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { EstadoBadge, EstadoPagoBadge } from './estado-badge'
import { deleteFactura } from '@/lib/actions/facturas'
import type { FacturaConProveedor } from '@/lib/actions/facturas'

function formatCOP(value: number | null) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatFecha(fecha: string | null) {
  if (!fecha) return '—'
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

interface FacturasListProps {
  facturas: FacturaConProveedor[]
}

export function FacturasList({ facturas }: FacturasListProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const [isPending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [reprocesandoId, setReprocesandoId] = useState<string | null>(null)

  const filtered = facturas.filter((f) => {
    const matchSearch =
      search === '' ||
      f.numero_factura.toLowerCase().includes(search.toLowerCase()) ||
      (f.proveedores?.razon_social ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (f.proveedores?.nit ?? '').includes(search)

    const matchEstado = filterEstado === 'todos' || f.estado === filterEstado

    return matchSearch && matchEstado
  })

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteFactura(id)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Factura eliminada')
        setDeleteId(null)
      }
    })
  }

  async function handleReprocesar(id: string) {
    setReprocesandoId(id)
    try {
      const res = await fetch(`/api/facturas/${id}/reprocesar`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error al reprocesar')
      } else {
        toast.success(`Factura reprocesada: ${data.numeroFactura}`)
        router.refresh()
      }
    } catch {
      toast.error('Error de conexión al reprocesar')
    } finally {
      setReprocesandoId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por número, proveedor o NIT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 h-9 px-3 text-sm border rounded-md bg-background outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="h-9 px-3 text-sm border rounded-md bg-background outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="todos">Todos los estados</option>
          <option value="extraida">Extraída</option>
          <option value="validada">Validada</option>
          <option value="vinculada">Vinculada</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>N° Factura</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead className="max-w-[180px]">Descripción</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Total Neto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  {facturas.length === 0
                    ? 'No hay facturas. Sube la primera con el botón "Nueva Factura".'
                    : 'No hay facturas que coincidan con los filtros.'}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((factura) => (
              <TableRow key={factura.id} className="hover:bg-muted/20">
                <TableCell className="font-mono text-sm font-medium">
                  {factura.numero_factura}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">
                      {factura.proveedores?.razon_social ?? '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      NIT {factura.proveedores?.nit ?? '—'}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="max-w-[180px]">
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    {factura.informacion ?? '—'}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  {formatFecha(factura.fecha_emision)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCOP(factura.total_neto)}
                </TableCell>
                <TableCell>
                  <EstadoBadge estado={factura.estado} />
                </TableCell>
                <TableCell>
                  <EstadoPagoBadge estado={factura.estado_pago} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {factura.estado === 'error' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={reprocesandoId === factura.id}
                        onClick={() => handleReprocesar(factura.id)}
                        title="Reprocesar con IA"
                      >
                        {reprocesandoId === factura.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <RefreshCw className="h-4 w-4 text-amber-500" />
                        }
                      </Button>
                    )}
                    <Link href={`/facturas/${factura.id}/validar`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <span
                      onClick={() => setDeleteId(factura.id)}
                      className="inline-flex cursor-pointer"
                    >
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

      {/* Resumen */}
      {facturas.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Mostrando {filtered.length} de {facturas.length} factura{facturas.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Dialog confirmar eliminación */}
      <Dialog open={deleteId !== null} onOpenChange={(v) => { if (!v) setDeleteId(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar factura</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar esta factura y todos sus datos asociados? Esta acción no se puede deshacer.
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
