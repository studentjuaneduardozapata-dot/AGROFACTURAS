import { getFacturas } from '@/lib/actions/facturas'
import { FacturasList } from './_components/facturas-list'
import { UploadDialog } from './_components/upload-dialog'

export default async function FacturasPage() {
  const facturas = await getFacturas()

  const total = facturas.length
  const extraidas = facturas.filter((f) => f.estado === 'extraida').length
  const validadas = facturas.filter((f) => f.estado === 'validada').length
  const errores = facturas.filter((f) => f.estado === 'error').length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Facturas</h2>
          <p className="text-muted-foreground">
            Ingesta y validación de facturas electrónicas
          </p>
        </div>
        <UploadDialog />
      </div>

      {/* KPIs rápidos */}
      {total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="border rounded-lg p-3 bg-card">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
          <div className="border rounded-lg p-3 bg-card">
            <p className="text-xs text-muted-foreground">Por validar</p>
            <p className="text-2xl font-bold text-yellow-600">{extraidas}</p>
          </div>
          <div className="border rounded-lg p-3 bg-card">
            <p className="text-xs text-muted-foreground">Validadas</p>
            <p className="text-2xl font-bold text-blue-600">{validadas}</p>
          </div>
          <div className="border rounded-lg p-3 bg-card">
            <p className="text-xs text-muted-foreground">Con error</p>
            <p className="text-2xl font-bold text-red-600">{errores}</p>
          </div>
        </div>
      )}

      <FacturasList facturas={facturas} />
    </div>
  )
}
