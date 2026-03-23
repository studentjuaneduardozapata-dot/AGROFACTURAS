import { Badge } from '@/components/ui/badge'

type EstadoFactura = 'extraida' | 'validada' | 'vinculada' | 'error'
type EstadoPago = 'no_aplica' | 'pendiente' | 'pagada'

const ESTADO_CONFIG: Record<EstadoFactura, { label: string; className: string }> = {
  extraida:  { label: 'Extraída',  className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  validada:  { label: 'Validada',  className: 'bg-blue-100 text-blue-800 border-blue-200' },
  vinculada: { label: 'Vinculada', className: 'bg-green-100 text-green-800 border-green-200' },
  error:     { label: 'Error',     className: 'bg-red-100 text-red-800 border-red-200' },
}

const PAGO_CONFIG: Record<EstadoPago, { label: string; className: string }> = {
  no_aplica: { label: 'Contado',   className: 'bg-gray-100 text-gray-600 border-gray-200' },
  pendiente: { label: 'Pendiente', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  pagada:    { label: 'Pagada',    className: 'bg-green-100 text-green-800 border-green-200' },
}

export function EstadoBadge({ estado }: { estado: EstadoFactura }) {
  const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.error
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  )
}

export function EstadoPagoBadge({ estado }: { estado: EstadoPago }) {
  const cfg = PAGO_CONFIG[estado] ?? PAGO_CONFIG.no_aplica
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  )
}
