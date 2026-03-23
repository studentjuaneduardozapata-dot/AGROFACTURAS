'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Eye, CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { marcarPagada } from '@/lib/actions/facturas'
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

function diasDesde(fecha: string | null): number | null {
  if (!fecha) return null
  const emision = new Date(fecha)
  const hoy = new Date()
  return Math.floor((hoy.getTime() - emision.getTime()) / (1000 * 60 * 60 * 24))
}

interface CreditosListProps {
  facturas: FacturaConProveedor[]
}

export function CreditosList({ facturas }: CreditosListProps) {
  const [filtro, setFiltro] = useState<'pendiente' | 'pagada' | 'todas'>('pendiente')
  const [isPending, startTransition] = useTransition()

  const filtered = facturas.filter((f) => {
    if (filtro === 'todas') return true
    return f.estado_pago === filtro
  })

  const totalPendiente = facturas
    .filter((f) => f.estado_pago === 'pendiente')
    .reduce((s, f) => s + (f.total_neto ?? 0), 0)

  function handleTogglePago(factura: FacturaConProveedor) {
    const nuevoEstado = factura.estado_pago === 'pendiente' ? 'pagada' : 'pendiente'
    startTransition(async () => {
      const result = await marcarPagada(factura.id, nuevoEstado)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(nuevoEstado === 'pagada' ? 'Marcada como pagada' : 'Marcada como pendiente')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2">
        {(['pendiente', 'pagada', 'todas'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              filtro === f
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-input hover:bg-muted'
            }`}
          >
            {f === 'pendiente' ? 'Pendientes' : f === 'pagada' ? 'Pagadas' : 'Todas'}
            <span className="ml-1.5 text-xs opacity-70">
              ({facturas.filter((x) => f === 'todas' || x.estado_pago === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>N° Factura</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Fecha Emisión</TableHead>
              <TableHead>Días</TableHead>
              <TableHead className="text-right">Total Neto</TableHead>
              <TableHead className="text-center">Estado Pago</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  {filtro === 'pendiente'
                    ? 'Sin créditos pendientes. Bien hecho.'
                    : 'No hay facturas en este estado.'}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((factura) => {
              const dias = diasDesde(factura.fecha_emision)
              const vencida = dias !== null && dias > 30 && factura.estado_pago === 'pendiente'
              return (
                <TableRow
                  key={factura.id}
                  className={`hover:bg-muted/20 ${vencida ? 'bg-red-50/50' : ''}`}
                >
                  <TableCell className="font-mono text-sm font-medium">
                    {factura.numero_factura}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{factura.proveedores?.razon_social ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">NIT {factura.proveedores?.nit ?? '—'}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatFecha(factura.fecha_emision)}</TableCell>
                  <TableCell>
                    {dias !== null ? (
                      <span className={`text-sm font-medium ${vencida ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {dias}d {vencida && '⚠'}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {formatCOP(factura.total_neto)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={
                        factura.estado_pago === 'pagada'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }
                    >
                      {factura.estado_pago === 'pagada' ? 'Pagada' : 'Pendiente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/facturas/${factura.id}/validar`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isPending}
                        onClick={() => handleTogglePago(factura)}
                        title={factura.estado_pago === 'pendiente' ? 'Marcar como pagada' : 'Marcar como pendiente'}
                      >
                        {factura.estado_pago === 'pagada'
                          ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                          : <Circle className="h-4 w-4 text-orange-500" />
                        }
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Resumen */}
      {facturas.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {filtered.length} de {facturas.length} factura{facturas.length !== 1 ? 's' : ''} a crédito
          </span>
          {filtro !== 'pagada' && (
            <span className="font-semibold">
              Total pendiente: <span className="text-orange-700 font-mono">{formatCOP(totalPendiente)}</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
