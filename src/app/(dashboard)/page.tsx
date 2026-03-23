import Link from 'next/link'
import { FileText, Clock, AlertCircle, TrendingUp, ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

function formatCOP(value: number) {
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

export default async function DashboardPage() {
  const supabase = await createClient()

  // Primer día del mes actual
  const ahora = new Date()
  const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()

  const [
    { data: facturasAll },
    { data: facturasMes },
    { data: creditosPendientes },
    { data: empresa },
  ] = await Promise.all([
    supabase
      .from('facturas')
      .select('id, estado, total_neto, numero_factura, fecha_emision, proveedores(razon_social)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('facturas')
      .select('id, total_neto')
      .gte('created_at', primerDiaMes),
    supabase
      .from('facturas')
      .select('id, total_neto')
      .eq('forma_pago', 'CRÉDITO')
      .eq('estado_pago', 'pendiente'),
    supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'datos_empresa')
      .single(),
  ])

  const todas = facturasAll ?? []
  const mes = facturasMes ?? []
  const creditos = creditosPendientes ?? []

  const porValidar = todas.filter((f) => f.estado === 'extraida').length
  const totalMes = mes.reduce((s, f) => s + (f.total_neto ?? 0), 0)
  const totalCreditos = creditos.reduce((s, f) => s + (f.total_neto ?? 0), 0)
  const nombreEmpresa = (empresa?.valor as { nombre?: string } | null)?.nombre ?? 'AGROINSUMOS SAS'

  const estadoColor: Record<string, string> = {
    extraida:  'text-yellow-700 bg-yellow-50',
    validada:  'text-blue-700 bg-blue-50',
    vinculada: 'text-green-700 bg-green-50',
    error:     'text-red-700 bg-red-50',
  }
  const estadoLabel: Record<string, string> = {
    extraida: 'Extraída', validada: 'Validada', vinculada: 'Vinculada', error: 'Error',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">{nombreEmpresa} — Resumen del sistema</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border rounded-lg p-4 bg-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Facturas este mes</span>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{mes.length}</div>
          <div className="text-xs font-mono text-muted-foreground">{formatCOP(totalMes)}</div>
        </div>

        <div className="border rounded-lg p-4 bg-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Por validar</span>
            <Clock className={`h-4 w-4 ${porValidar > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
          </div>
          <div className={`text-2xl font-bold ${porValidar > 0 ? 'text-yellow-600' : ''}`}>
            {porValidar}
          </div>
          <Link href="/facturas" className="text-xs text-primary hover:underline">
            Ver facturas →
          </Link>
        </div>

        <div className="border rounded-lg p-4 bg-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Créditos pendientes</span>
            <AlertCircle className={`h-4 w-4 ${creditos.length > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
          </div>
          <div className={`text-2xl font-bold ${creditos.length > 0 ? 'text-orange-600' : ''}`}>
            {creditos.length}
          </div>
          <div className="text-xs font-mono text-orange-600">
            {creditos.length > 0 ? formatCOP(totalCreditos) : '—'}
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total procesadas</span>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{todas.length}</div>
          <div className="text-xs text-muted-foreground">desde el inicio</div>
        </div>
      </div>

      {/* Últimas facturas */}
      {todas.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Últimas facturas procesadas</h3>
            <Link href="/facturas" className="text-xs text-primary hover:underline">
              Ver todas →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium text-muted-foreground">N° Factura</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Proveedor</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Fecha</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Total</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {todas.map((f) => {
                const prov = f.proveedores as unknown as { razon_social: string | null } | null
                return (
                  <tr key={f.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-3">
                      <Link
                        href={`/facturas/${f.id}/validar`}
                        className="font-mono font-medium hover:text-primary"
                      >
                        {f.numero_factura}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground truncate max-w-[160px]">
                      {prov?.razon_social ?? '—'}
                    </td>
                    <td className="p-3 text-muted-foreground">{formatFecha(f.fecha_emision)}</td>
                    <td className="p-3 text-right font-mono">{formatCOP(f.total_neto ?? 0)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[f.estado] ?? ''}`}
                      >
                        {estadoLabel[f.estado] ?? f.estado}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border rounded-lg p-12 text-center">
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-medium text-muted-foreground">Sin facturas procesadas aún</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ve a{' '}
            <Link href="/facturas" className="text-primary hover:underline">
              Facturas
            </Link>{' '}
            y sube tu primera factura PDF.
          </p>
        </div>
      )}
    </div>
  )
}
