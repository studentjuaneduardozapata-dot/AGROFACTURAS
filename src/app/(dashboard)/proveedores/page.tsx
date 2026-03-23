import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default function ProveedoresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Proveedores</h2>
        <p className="text-muted-foreground">Directorio y gestión de proveedores</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#eaf5e4] rounded-lg">
              <Users className="h-6 w-6 text-[#4a8a35]" />
            </div>
            <div>
              <CardTitle>Módulo de Proveedores</CardTitle>
              <CardDescription>Disponible en Fase 2</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este módulo incluirá: listado con búsqueda por nombre o NIT, vista detalle con historial de facturas,
            preferencias aprendidas (último concepto, categoría, distribución), y edición manual de datos.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
