import { notFound } from 'next/navigation'
import { getFactura } from '@/lib/actions/facturas'
import { getCentrosCostoSimple, getConceptos } from '@/lib/actions/configuracion'
import { ValidacionForm } from './_components/validacion-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ValidarFacturaPage({ params }: Props) {
  const { id } = await params
  const [factura, centros, conceptos] = await Promise.all([
    getFactura(id),
    getCentrosCostoSimple(),
    getConceptos(),
  ])

  if (!factura) notFound()

  return (
    <div className="space-y-6 pb-10">
      <ValidacionForm factura={factura} centros={centros} conceptos={conceptos} />
    </div>
  )
}
