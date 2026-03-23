'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { LineaEditable } from '@/lib/actions/facturas'

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}

interface LineasTableProps {
  lineas: LineaEditable[]
  onChange: (lineas: LineaEditable[]) => void
}

export function LineasTable({ lineas, onChange }: LineasTableProps) {
  function addLinea() {
    const siguiente = lineas.length + 1
    onChange([
      ...lineas,
      {
        localId: `new-${Date.now()}`,
        numero_linea: siguiente,
        codigo: '',
        descripcion: '',
        cantidad: 1,
        precio_unitario: 0,
        tipo_impuesto: '',
        tarifa_impuesto: 0,
        monto_impuesto: 0,
        total_linea: 0,
      },
    ])
  }

  function removeLinea(localId: string) {
    onChange(lineas.filter((l) => l.localId !== localId))
  }

  function updateLinea(localId: string, field: keyof LineaEditable, value: string | number) {
    onChange(
      lineas.map((l) => {
        if (l.localId !== localId) return l
        const updated = { ...l, [field]: value }
        // Recalcular total_linea automáticamente
        if (field === 'cantidad' || field === 'precio_unitario' || field === 'monto_impuesto') {
          updated.total_linea = updated.cantidad * updated.precio_unitario + updated.monto_impuesto
        }
        return updated
      })
    )
  }

  const totalLineas = lineas.reduce((sum, l) => sum + l.total_linea, 0)

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-2 font-medium text-muted-foreground w-8">#</th>
              <th className="text-left p-2 font-medium text-muted-foreground w-20">Código</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Descripción</th>
              <th className="text-right p-2 font-medium text-muted-foreground w-20">Cant.</th>
              <th className="text-right p-2 font-medium text-muted-foreground w-28">P. Unitario</th>
              <th className="text-right p-2 font-medium text-muted-foreground w-24">IVA/INC</th>
              <th className="text-right p-2 font-medium text-muted-foreground w-28">Total</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {lineas.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-6 text-muted-foreground">
                  Sin líneas. Agrega una manualmente.
                </td>
              </tr>
            )}
            {lineas.map((linea) => (
              <tr key={linea.localId} className="border-b hover:bg-muted/20">
                <td className="p-1 text-center text-muted-foreground">
                  {linea.numero_linea}
                </td>
                <td className="p-1">
                  <Input
                    value={linea.codigo}
                    onChange={(e) => updateLinea(linea.localId, 'codigo', e.target.value)}
                    className="h-7 text-xs font-mono"
                    placeholder="—"
                  />
                </td>
                <td className="p-1">
                  <Input
                    value={linea.descripcion}
                    onChange={(e) => updateLinea(linea.localId, 'descripcion', e.target.value)}
                    className="h-7 text-xs"
                    placeholder="Descripción del ítem"
                  />
                </td>
                <td className="p-1">
                  <Input
                    type="number"
                    value={linea.cantidad}
                    onChange={(e) => updateLinea(linea.localId, 'cantidad', parseFloat(e.target.value) || 0)}
                    className="h-7 text-xs text-right"
                    min={0}
                  />
                </td>
                <td className="p-1">
                  <Input
                    type="number"
                    value={linea.precio_unitario}
                    onChange={(e) => updateLinea(linea.localId, 'precio_unitario', parseFloat(e.target.value) || 0)}
                    className="h-7 text-xs text-right font-mono"
                    min={0}
                  />
                </td>
                <td className="p-1">
                  <div className="flex items-center gap-1">
                    <select
                      value={linea.tipo_impuesto}
                      onChange={(e) => updateLinea(linea.localId, 'tipo_impuesto', e.target.value)}
                      className="h-7 text-xs border rounded px-1 bg-background flex-1"
                    >
                      <option value="">—</option>
                      <option value="IVA">IVA</option>
                      <option value="INC">INC</option>
                    </select>
                  </div>
                </td>
                <td className="p-1 text-right font-mono text-xs">
                  {formatCOP(linea.total_linea)}
                </td>
                <td className="p-1">
                  <button
                    onClick={() => removeLinea(linea.localId)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {lineas.length > 0 && (
            <tfoot>
              <tr className="border-t bg-muted/30">
                <td colSpan={6} className="p-2 text-right text-sm font-medium">
                  Total líneas:
                </td>
                <td className="p-2 text-right font-mono text-sm font-bold">
                  {formatCOP(totalLineas)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <Button variant="outline" size="sm" onClick={addLinea} className="gap-2">
        <Plus className="h-3.5 w-3.5" />
        Agregar línea
      </Button>
    </div>
  )
}
