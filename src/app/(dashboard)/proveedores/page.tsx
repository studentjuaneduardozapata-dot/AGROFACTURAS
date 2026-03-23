import { getProveedores } from '@/lib/actions/proveedores'
import { ProveedoresList } from './_components/proveedores-list'

export default async function ProveedoresPage() {
  const proveedores = await getProveedores()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Proveedores</h2>
        <p className="text-muted-foreground">
          Directorio de proveedores registrados automáticamente al procesar facturas
        </p>
      </div>

      {proveedores.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="border rounded-lg p-3 bg-card">
            <p className="text-xs text-muted-foreground">Total proveedores</p>
            <p className="text-2xl font-bold">{proveedores.length}</p>
          </div>
          <div className="border rounded-lg p-3 bg-card">
            <p className="text-xs text-muted-foreground">Personas jurídicas</p>
            <p className="text-2xl font-bold">
              {proveedores.filter((p) => p.tipo_persona === 'Persona Jurídica').length}
            </p>
          </div>
          <div className="border rounded-lg p-3 bg-card">
            <p className="text-xs text-muted-foreground">Total facturas</p>
            <p className="text-2xl font-bold">
              {proveedores.reduce((s, p) => s + p._count_facturas, 0)}
            </p>
          </div>
        </div>
      )}

      <ProveedoresList proveedores={proveedores} />
    </div>
  )
}
