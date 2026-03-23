import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clock, AlertCircle, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Bienvenido a FacturIA</h2>
        <p className="text-muted-foreground">
          Sistema de procesamiento de facturas electrónicas colombianas — AGROINSUMOS SAS
        </p>
      </div>

      {/* KPI placeholders */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas del Mes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Disponible en Fase 3</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Validar</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Disponible en Fase 3</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Disponible en Fase 3</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos Abiertos</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Disponible en Fase 3</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado del Proyecto</CardTitle>
          <CardDescription>Fases de implementación de FacturIA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#6ab04c]" />
              <span className="text-sm font-medium">Fase 1: Fundación</span>
              <span className="text-xs text-muted-foreground ml-auto bg-[#eaf5e4] text-[#4a8a35] px-2 py-0.5 rounded-full">Completada</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-sm text-muted-foreground">Fase 2: Core del negocio (ingesta, validación, distribución)</span>
              <span className="text-xs text-muted-foreground ml-auto bg-muted px-2 py-0.5 rounded-full">Pendiente</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-sm text-muted-foreground">Fase 3: Salidas y visualización (OC, dashboard, créditos)</span>
              <span className="text-xs text-muted-foreground ml-auto bg-muted px-2 py-0.5 rounded-full">Pendiente</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
