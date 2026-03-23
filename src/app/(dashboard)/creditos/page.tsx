import { createClient } from '@/lib/supabase/server'
import { CreditosList } from './_components/creditos-list'
import type { FacturaConProveedor } from '@/lib/actions/facturas'

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function CreditosPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('facturas')
    .select('*, proveedores(id, nit, razon_social)')
    .eq('forma_pago', 'CRÉDITO')
    .order('fecha_emision', { ascending: true })

  const facturas = (data ?? []) as FacturaConProveedor[]

  const pendientes = facturas.filter((f) => f.estado_pago === 'pendiente')
  const pagadas = facturas.filter((f) => f.estado_pago === 'pagada')
  const totalPendiente = pendientes.reduce((s, f) => s + (f.total_neto ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Seguimiento de Créditos</h2>
        <p className="text-muted-foreground">
          Facturas con forma de pago CRÉDITO — marcar como pagadas con un clic
        </p>
      </div>

      {facturas.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="border rounded-lg p-3 bg-card">
            <p className="text-xs text-muted-foreground">Pendientes de pago</p>
            <p className="text-2xl font-bold text-orange-600">{pendientes.length}</p>
            <p className="text-xs font-mono text-orange-600 mt-0.5">{formatCOP(totalPendiente)}</p>
          </div>
          <div className="border rounded-lg p-3 bg-card">
            <p className="text-xs text-muted-foreground">Pagadas</p>
            <p className="text-2xl font-bold text-green-600">{pagadas.length}</p>
          </div>
          <div className="border rounded-lg p-3 bg-card">
            <p className="text-xs text-muted-foreground">Total créditos</p>
            <p className="text-2xl font-bold">{facturas.length}</p>
          </div>
        </div>
      )}

      <CreditosList facturas={facturas} />
    </div>
  )
}
