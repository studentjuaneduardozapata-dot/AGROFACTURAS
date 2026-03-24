'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DistribucionEditable } from '@/lib/actions/facturas'
import type { CentroCosto } from '@/lib/supabase/types'

const MAX = 4

interface DistribucionCostoProps {
  distribuciones: DistribucionEditable[]
  centros: CentroCosto[]
  totalNeto: number
  onChange: (distribuciones: DistribucionEditable[]) => void
}

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}

export function DistribucionCosto({
  distribuciones,
  centros,
  totalNeto,
  onChange,
}: DistribucionCostoProps) {
  const totalPorcentaje = distribuciones.reduce((sum, d) => sum + d.porcentaje, 0)
  const centrosActivos = centros.filter((c) => c.activo)
  const puedeAgregar = distribuciones.length < MAX && totalPorcentaje < 100

  function addDistribucion() {
    const newN = distribuciones.length + 1
    const perItem = parseFloat((100 / newN).toFixed(2))
    // Redistribuir existentes equitativamente
    let assigned = 0
    const adjusted = distribuciones.map((d, i) => {
      const isLast = i === distribuciones.length - 1
      const pct = isLast ? parseFloat((100 - perItem - assigned).toFixed(2)) : perItem
      if (!isLast) assigned += perItem
      return { ...d, porcentaje: pct, monto: (pct / 100) * totalNeto }
    })
    onChange([
      ...adjusted,
      {
        localId: `d-${Date.now()}`,
        centro_costo: '',
        sub_centro: '',
        porcentaje: perItem,
        monto: (perItem / 100) * totalNeto,
      },
    ])
  }

  function removeDistribucion(localId: string) {
    const remaining = distribuciones.filter((d) => d.localId !== localId)
    // Redistribuir porcentajes equitativamente entre los restantes
    if (remaining.length === 0) {
      onChange([])
      return
    }
    const perItem = parseFloat((100 / remaining.length).toFixed(2))
    let assigned = 0
    const adjusted = remaining.map((d, i) => {
      const isLast = i === remaining.length - 1
      const pct = isLast ? parseFloat((100 - assigned).toFixed(2)) : perItem
      if (!isLast) assigned += perItem
      return { ...d, porcentaje: pct, monto: (pct / 100) * totalNeto }
    })
    onChange(adjusted)
  }

  function updateCentro(localId: string, centro_costo: string) {
    onChange(
      distribuciones.map((d) =>
        d.localId === localId ? { ...d, centro_costo } : d
      )
    )
  }

  function updatePorcentaje(localId: string, newVal: number) {
    const clamped = Math.min(100, Math.max(0, newVal))
    const n = distribuciones.length

    if (n <= 1) {
      onChange(
        distribuciones.map((d) =>
          d.localId === localId
            ? { ...d, porcentaje: clamped, monto: (clamped / 100) * totalNeto }
            : d
        )
      )
      return
    }

    const remaining = Math.max(0, 100 - clamped)
    const perOther = parseFloat((remaining / (n - 1)).toFixed(2))
    const others = distribuciones.filter((d) => d.localId !== localId)
    let distributed = 0

    onChange(
      distribuciones.map((d) => {
        if (d.localId === localId) {
          return { ...d, porcentaje: clamped, monto: (clamped / 100) * totalNeto }
        }
        const isLast = d === others[others.length - 1]
        const pct = isLast
          ? parseFloat((remaining - distributed).toFixed(2))
          : perOther
        if (!isLast) distributed += perOther
        return { ...d, porcentaje: pct, monto: (pct / 100) * totalNeto }
      })
    )
  }

  const barColor =
    totalPorcentaje === 100
      ? 'bg-green-500'
      : totalPorcentaje > 100
      ? 'bg-red-500'
      : 'bg-primary'

  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Porcentaje asignado</span>
          <span
            className={
              totalPorcentaje === 100
                ? 'text-green-600 font-semibold'
                : totalPorcentaje > 100
                ? 'text-red-600 font-semibold'
                : 'text-muted-foreground'
            }
          >
            {totalPorcentaje.toFixed(1)}% / 100%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${barColor}`}
            style={{ width: `${Math.min(totalPorcentaje, 100)}%` }}
          />
        </div>
        {totalPorcentaje !== 100 && distribuciones.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {totalPorcentaje < 100
              ? `Faltan ${(100 - totalPorcentaje).toFixed(1)}% por asignar`
              : 'El total supera el 100%'}
          </p>
        )}
      </div>

      {/* Filas de distribución */}
      <div className="space-y-2">
        {distribuciones.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin distribución asignada. Agrega un centro de costo.
          </p>
        )}
        {distribuciones.map((dist) => (
          <div
            key={dist.localId}
            className="grid grid-cols-[1fr_auto_auto] gap-2 items-center"
          >
            {/* Centro de costo */}
            <select
              value={dist.centro_costo}
              onChange={(e) => updateCentro(dist.localId, e.target.value)}
              className="h-9 text-sm border rounded-md px-2 bg-background outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Seleccionar centro...</option>
              {centrosActivos.map((c) => (
                <option key={c.id} value={c.nombre}>
                  {c.nombre}
                </option>
              ))}
            </select>

            {/* Porcentaje + Monto */}
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={dist.porcentaje}
                onChange={(e) =>
                  updatePorcentaje(dist.localId, parseFloat(e.target.value) || 0)
                }
                className="h-9 w-20 text-right text-sm"
                min={0}
                max={100}
                step={0.1}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>

            {/* Monto + Delete */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                {formatCOP(dist.monto)}
              </span>
              <button
                onClick={() => removeDistribucion(dist.localId)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {puedeAgregar && (
        <Button
          variant="outline"
          size="sm"
          onClick={addDistribucion}
          className="gap-2"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar centro
        </Button>
      )}

      {distribuciones.length >= MAX && (
        <p className="text-xs text-muted-foreground">Máximo {MAX} centros de costo por factura.</p>
      )}
    </div>
  )
}
