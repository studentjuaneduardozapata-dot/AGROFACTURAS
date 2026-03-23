import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { getOrdenCompraData } from '@/lib/actions/ordenes'
import type { ConceptoItem } from '@/lib/actions/facturas'

interface Props {
  params: Promise<{ id: string }>
}

function formatCOP(value: number | null) {
  if (value === null || value === undefined || value === 0) return '$0'
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

export default async function OCPage({ params }: Props) {
  const { id } = await params
  const data = await getOrdenCompraData(id)

  if (!data) notFound()

  const { factura, oc, empresa } = data
  const proveedor = factura.proveedores
  const lineas = factura.lineas_factura
  const distribuciones = factura.distribuciones_costo
  const concepto = (oc.concepto as ConceptoItem[] | null) ?? []

  return (
    <>
      {/* Botones flotantes — ocultos al imprimir */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 print:hidden">
        <Link
          href={`/facturas/${id}/validar`}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded-md shadow hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-[#6ab04c] text-white rounded-md shadow hover:bg-[#4a8a35]"
        >
          <Printer className="h-4 w-4" />
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* Fondo de pantalla */}
      <div className="min-h-screen bg-gray-100 print:bg-white py-8 print:py-0 flex justify-center print:block">

        {/* Hoja OC */}
        <div
          className="bg-white shadow-lg print:shadow-none w-[210mm] min-h-[297mm] print:w-full print:min-h-0"
          style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', padding: '12mm' }}
        >

          {/* ── HEADER ─────────────────────────────────────── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0 }}>
            <tbody>
              <tr>
                {/* Logo + Empresa */}
                <td style={{ width: '55%', border: '1px solid #333', padding: '8px 10px', verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.svg" alt="Logo" style={{ height: '48px', width: 'auto' }} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '12pt', color: '#4a8a35' }}>
                        {empresa?.nombre ?? 'AGROINSUMOS SAS'}
                      </div>
                      <div style={{ fontSize: '9pt', color: '#555', marginTop: '2px' }}>
                        NIT {empresa?.nit ?? '836 000 548 - 7'}
                      </div>
                      <div style={{ fontSize: '9pt', color: '#555' }}>
                        {empresa?.direccion ?? ''}
                      </div>
                      <div style={{ fontSize: '9pt', color: '#555' }}>
                        {empresa?.ciudad ?? 'Cartago - Valle'} · {empresa?.telefono ?? ''}
                      </div>
                      <div style={{ fontSize: '9pt', color: '#555' }}>
                        {empresa?.correo ?? ''}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Número y fecha OC */}
                <td style={{ width: '45%', border: '1px solid #333', borderLeft: 'none', padding: '8px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                  <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#333', letterSpacing: '1px' }}>
                    ORDEN DE COMPRA
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '13pt', fontWeight: 'bold', color: '#4a8a35' }}>
                    N° {oc.numero_oc}
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '9pt', color: '#555' }}>
                    Fecha: {formatFecha(oc.fecha_generacion)}
                  </div>
                  <div style={{ marginTop: '2px', fontSize: '9pt', color: '#555' }}>
                    Forma de pago:{' '}
                    <strong>{factura.forma_pago ?? '—'}</strong>
                  </div>
                </td>
              </tr>

              {/* ── PROVEEDOR | CENTROS DE COSTO ─────────────── */}
              <tr>
                <td style={{ border: '1px solid #333', borderTop: 'none', padding: '8px 10px', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase', color: '#4a8a35', marginBottom: '4px' }}>
                    Datos del Proveedor
                  </div>
                  <table style={{ width: '100%', fontSize: '9pt' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '35%', color: '#666', paddingBottom: '2px' }}>Razón social:</td>
                        <td style={{ fontWeight: '500', paddingBottom: '2px' }}>{proveedor?.razon_social ?? '—'}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#666', paddingBottom: '2px' }}>NIT:</td>
                        <td style={{ fontFamily: 'monospace', paddingBottom: '2px' }}>{proveedor?.nit ?? '—'}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#666', paddingBottom: '2px' }}>Régimen:</td>
                        <td style={{ paddingBottom: '2px' }}>{proveedor?.regimen_tributario ?? '—'}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#666', paddingBottom: '2px' }}>Dirección:</td>
                        <td style={{ paddingBottom: '2px' }}>{proveedor?.direccion ?? '—'}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#666', paddingBottom: '2px' }}>Teléfono:</td>
                        <td style={{ paddingBottom: '2px' }}>{proveedor?.telefono ?? '—'}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#666' }}>Email:</td>
                        <td>{proveedor?.email ?? '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>

                <td style={{ border: '1px solid #333', borderTop: 'none', borderLeft: 'none', padding: '8px 10px', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase', color: '#4a8a35', marginBottom: '4px' }}>
                    Distribución Centros de Costo
                  </div>
                  {distribuciones.length === 0 ? (
                    <p style={{ fontSize: '9pt', color: '#999' }}>Sin distribución asignada</p>
                  ) : (
                    <table style={{ width: '100%', fontSize: '9pt' }}>
                      <tbody>
                        {distribuciones.map((d, i) => (
                          <tr key={i}>
                            <td style={{ color: '#444', paddingBottom: '2px' }}>
                              {d.centro_costo}{d.sub_centro ? ` › ${d.sub_centro}` : ''}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', paddingBottom: '2px', whiteSpace: 'nowrap' }}>
                              {d.porcentaje}%
                            </td>
                            <td style={{ textAlign: 'right', color: '#555', paddingBottom: '2px', paddingLeft: '8px', whiteSpace: 'nowrap' }}>
                              {formatCOP(d.monto)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </td>
              </tr>

              {/* ── CONCEPTO | CATEGORÍA + INFORMACIÓN ───────── */}
              <tr>
                <td style={{ border: '1px solid #333', borderTop: 'none', padding: '8px 10px', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase', color: '#4a8a35', marginBottom: '4px' }}>
                    Concepto
                  </div>
                  {concepto.length === 0 ? (
                    <p style={{ fontSize: '9pt', color: '#999' }}>—</p>
                  ) : (
                    <table style={{ width: '100%', fontSize: '9pt' }}>
                      <tbody>
                        {concepto.map((c, i) => (
                          <tr key={i}>
                            <td style={{ color: '#444', paddingBottom: '2px' }}>{c.concepto}</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', paddingBottom: '2px' }}>{c.porcentaje}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </td>

                <td style={{ border: '1px solid #333', borderTop: 'none', borderLeft: 'none', padding: '8px 10px', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase', color: '#4a8a35', marginBottom: '2px' }}>
                    Categoría
                  </div>
                  <div style={{ fontSize: '9pt', marginBottom: '8px' }}>{oc.categoria ?? '—'}</div>

                  <div style={{ fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase', color: '#4a8a35', marginBottom: '2px' }}>
                    Información
                  </div>
                  <div style={{ fontSize: '9pt', color: '#444', lineHeight: '1.4' }}>
                    {factura.informacion ?? '—'}
                  </div>
                </td>
              </tr>

              {/* ── SOLICITADO POR ────────────────────────────── */}
              <tr>
                <td colSpan={2} style={{ border: '1px solid #333', borderTop: 'none', padding: '6px 10px' }}>
                  <table style={{ width: '100%', fontSize: '9pt' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '33%', color: '#666' }}>Solicitado por:</td>
                        <td style={{ width: '33%', color: '#666' }}>Cargo:</td>
                        <td style={{ width: '34%', color: '#666' }}>Correo:</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: '500' }}>{oc.solicitante_nombre ?? '—'}</td>
                        <td>{oc.solicitante_cargo ?? '—'}</td>
                        <td style={{ fontSize: '8.5pt' }}>{oc.solicitante_correo ?? '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── TABLA DE LÍNEAS ─────────────────────────────── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 0 }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f7ec' }}>
                <th style={{ border: '1px solid #333', borderTop: 'none', padding: '5px 6px', textAlign: 'center', width: '5%', fontSize: '9pt' }}>Nro</th>
                <th style={{ border: '1px solid #333', borderTop: 'none', borderLeft: 'none', padding: '5px 6px', textAlign: 'left', fontSize: '9pt' }}>Descripción</th>
                <th style={{ border: '1px solid #333', borderTop: 'none', borderLeft: 'none', padding: '5px 6px', textAlign: 'right', width: '8%', fontSize: '9pt' }}>Cant.</th>
                <th style={{ border: '1px solid #333', borderTop: 'none', borderLeft: 'none', padding: '5px 6px', textAlign: 'right', width: '14%', fontSize: '9pt' }}>P. Unitario</th>
                <th style={{ border: '1px solid #333', borderTop: 'none', borderLeft: 'none', padding: '5px 6px', textAlign: 'center', width: '10%', fontSize: '9pt' }}>IVA</th>
                <th style={{ border: '1px solid #333', borderTop: 'none', borderLeft: 'none', padding: '5px 6px', textAlign: 'right', width: '14%', fontSize: '9pt' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {lineas.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ border: '1px solid #333', borderTop: 'none', padding: '8px', textAlign: 'center', color: '#999', fontSize: '9pt' }}>
                    Sin líneas de detalle
                  </td>
                </tr>
              )}
              {lineas.map((l, i) => (
                <tr key={l.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ border: '1px solid #ddd', borderTop: 'none', borderLeft: '1px solid #333', padding: '4px 6px', textAlign: 'center', fontSize: '9pt' }}>{l.numero_linea}</td>
                  <td style={{ border: '1px solid #ddd', borderTop: 'none', padding: '4px 6px', fontSize: '9pt' }}>{l.descripcion}</td>
                  <td style={{ border: '1px solid #ddd', borderTop: 'none', padding: '4px 6px', textAlign: 'right', fontSize: '9pt' }}>{l.cantidad}</td>
                  <td style={{ border: '1px solid #ddd', borderTop: 'none', padding: '4px 6px', textAlign: 'right', fontFamily: 'monospace', fontSize: '9pt' }}>{formatCOP(l.precio_unitario)}</td>
                  <td style={{ border: '1px solid #ddd', borderTop: 'none', padding: '4px 6px', textAlign: 'center', fontSize: '9pt' }}>
                    {l.tipo_impuesto && l.tarifa_impuesto ? `${l.tipo_impuesto} ${l.tarifa_impuesto}%` : '—'}
                  </td>
                  <td style={{ border: '1px solid #ddd', borderTop: 'none', borderRight: '1px solid #333', padding: '4px 6px', textAlign: 'right', fontFamily: 'monospace', fontSize: '9pt' }}>{formatCOP(l.total_linea)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── FOOTER ──────────────────────────────────────── */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                {/* Izquierda: referencia factura */}
                <td style={{ width: '50%', border: '1px solid #333', borderTop: 'none', padding: '8px 10px', verticalAlign: 'top', fontSize: '9pt' }}>
                  <div style={{ color: '#666', marginBottom: '3px' }}>
                    <strong>N° Factura:</strong> {factura.numero_factura}
                  </div>
                  <div style={{ color: '#666', marginBottom: '3px' }}>
                    <strong>Fecha emisión:</strong> {formatFecha(factura.fecha_emision)}
                  </div>
                </td>

                {/* Derecha: totales */}
                <td style={{ width: '50%', border: '1px solid #333', borderTop: 'none', borderLeft: 'none', padding: '8px 10px', verticalAlign: 'top' }}>
                  <table style={{ width: '100%', fontSize: '9pt' }}>
                    <tbody>
                      {[
                        { label: 'Subtotal', value: factura.subtotal },
                        { label: 'IVA', value: factura.iva },
                        { label: 'INC', value: factura.inc },
                        { label: 'Rete Fuente', value: factura.rete_fuente ? -(factura.rete_fuente) : null, negative: true },
                        { label: 'Rete IVA', value: factura.rete_iva ? -(factura.rete_iva) : null, negative: true },
                        { label: 'Rete ICA', value: factura.rete_ica ? -(factura.rete_ica) : null, negative: true },
                      ]
                        .filter(row => row.value !== null && row.value !== 0)
                        .map(({ label, value }) => (
                          <tr key={label}>
                            <td style={{ color: '#666', paddingBottom: '1px' }}>{label}:</td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace', paddingBottom: '1px' }}>
                              {value !== null ? formatCOP(value) : ''}
                            </td>
                          </tr>
                        ))
                      }
                      <tr style={{ borderTop: '1px solid #333' }}>
                        <td style={{ fontWeight: 'bold', paddingTop: '3px', fontSize: '10pt' }}>TOTAL:</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11pt', paddingTop: '3px', color: '#4a8a35' }}>
                          {formatCOP(factura.total_neto)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* ── FIRMAS ─────────────────────────────────── */}
              <tr>
                <td colSpan={2} style={{ border: '1px solid #333', borderTop: 'none', padding: '16px 10px 8px' }}>
                  <table style={{ width: '100%', fontSize: '9pt' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '45%', textAlign: 'center', borderTop: '1px solid #555', paddingTop: '4px' }}>
                          {oc.solicitante_nombre ?? 'Hecho por'}
                        </td>
                        <td style={{ width: '10%' }} />
                        <td style={{ width: '45%', textAlign: 'center', borderTop: '1px solid #555', paddingTop: '4px' }}>
                          {oc.autorizado_por ?? 'Autorizado por'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'center', color: '#666' }}>Hecho por</td>
                        <td />
                        <td style={{ textAlign: 'center', color: '#666' }}>Autorizado por</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>

      {/* Script para imprimir automáticamente si viene de ?print=1 */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (new URLSearchParams(window.location.search).get('print') === '1') {
              window.addEventListener('load', () => setTimeout(() => window.print(), 500));
            }
          `,
        }}
      />
    </>
  )
}
