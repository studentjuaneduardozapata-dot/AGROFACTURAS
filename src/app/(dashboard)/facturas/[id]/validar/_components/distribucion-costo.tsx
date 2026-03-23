'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DistribucionEditable } from '@/lib/actions/facturas'
import type { CentroCostoConSubs } from '@/lib/supabase/types'

interface DistribucionCostoProps {
  distribuciones: DistribucionEditable[]
  centros: CentroCostoConSubs[]
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
  const restante = 100 - totalPorcentaje
  const puedeAgregar = distribuciones.length < 5 && totalPorcentaje < 100

  // Solo centros activos
  const centrosActivos = centros.filter((c) => c.activo)

  function addDistribucion() {
    onChange([
      ...distribuciones,
      {
        localId: `d-${Date.now()}`,
        centro_costo: '',
        sub_centro: '',
        porcentaje: Math.max(0, restante),
        monto: (Math.max(0, restante) / 100) * totalNeto,
      },
    ])
  }

  function removeDistribucion(localId: string) {
    onChange(distribuciones.filter((d) => d.localId !== localId))
  }

  function updateDistribucion(
    localId: string,
    field: 'centro_costo' | 'sub_centro' | 'porcentaje',
    value: string | number
  ) {
    onChange(
      distribuciones.map((d) => {
        if (d.localId !== localId) return d
        const updated = { ...d, [field]: value }
        // Si cambia el centro, limpiar sub_centro
        if (field === 'centro_costo') updated.sub_centro = ''
        // Recalcular monto
        updated.monto = (updated.porcentaje / 100) * totalNeto
        return updated
      })
    )
  }

  const getSubCentros = (centroNombre: string) => {
    const centro = centrosActivos.find((c) => c.nombre === centroNombre)
    return centro?.sub_centros.filter((s) => s.activo) ?? []
  }

  // Color de la barra de progreso
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
              ? `Faltan ${restante.toFixed(1)}% por asignar`
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
        {distribuciones.map((dist) => {
          const subCentros = getSubCentros(dist.centro_costo)
          return (
            <div
              key={dist.localId}
              className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center"
            >
              {/* Centro de costo */}
              <select
                value={dist.centro_costo}
                onChange={(e) => updateDistribucion(dist.localId, 'centro_costo', e.target.value)}
                className="h-9 text-sm border rounded-md px-2 bg-background outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Seleccionar centro...</option>
                {centrosActivos.map((c) => (
                  <option key={c.id} value={c.nombre}>
                    {c.nombre}
                  </option>
                ))}
              </select>

              {/* Sub-centro */}
              <select
                value={dist.sub_centro}
                onChange={(e) => updateDistribucion(dist.localId, 'sub_centro', e.target.value)}
                disabled={subCentros.length === 0}
                className="h-9 text-sm border rounded-md px-2 bg-background outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                <option value="">{subCentros.length === 0 ? '(sin sub-centros)' : 'Sin sub-centro'}</option>
                {subCentros.map((s) => (
                  <option key={s.id} value={s.nombre}>
                    {s.nombre}
                  </option>
                ))}
              </select>

              {/* Porcentaje + Monto */}
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={dist.porcentaje}
                  onChange={(e) => {
                    const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                    updateDistribucion(dist.localId, 'porcentaje', val)
                  }}
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
          )
        })}
      </div>

      {puedeAgregar && (
        <Button
          variant="outline"
          size="sm"
          onClick={addDistribucion}
          className="gap-2"
          disabled={distribuciones.length >= 5}
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar centro {distribuciones.length >= 5 ? '(máx. 5)' : ''}
        </Button>
      )}

      {distribuciones.length >= 5 && (
        <p className="text-xs text-muted-foreground">Máximo 5 centros de costo por factura.</p>
      )}
    </div>
  )
}
