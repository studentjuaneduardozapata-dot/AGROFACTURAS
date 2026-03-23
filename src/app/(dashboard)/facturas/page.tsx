import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function FacturasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Facturas</h2>
        <p className="text-muted-foreground">Gestión y procesamiento de facturas electrónicas</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#eaf5e4] rounded-lg">
              <FileText className="h-6 w-6 text-[#4a8a35]" />
            </div>
            <div>
              <CardTitle>Módulo de Facturas</CardTitle>
              <CardDescription>Disponible en Fase 2</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este módulo incluirá: subida de PDFs con drag &amp; drop, procesamiento IA con Gemini,
            validación human-in-the-loop, distribución de centros de costo, y generación de órdenes de compra.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
