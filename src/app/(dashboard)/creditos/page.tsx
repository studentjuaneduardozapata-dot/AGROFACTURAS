import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'

export default function CreditosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Seguimiento de Créditos</h2>
        <p className="text-muted-foreground">Facturas a crédito y su estado de pago</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#eaf5e4] rounded-lg">
              <CreditCard className="h-6 w-6 text-[#4a8a35]" />
            </div>
            <div>
              <CardTitle>Módulo de Créditos</CardTitle>
              <CardDescription>Disponible en Fase 3</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este módulo mostrará todas las facturas con forma de pago CRÉDITO,
            con su estado de pago (Pendiente / Pagada) y un toggle para marcar como pagada con un clic.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
