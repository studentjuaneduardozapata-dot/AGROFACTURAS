import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getOrdenCompraData } from '@/lib/actions/ordenes'
import type { ConceptoItem } from '@/lib/actions/facturas'
import { PrintButton } from './_components/print-button'

interface Props {
  params: Promise<{ id: string }>
}

function formatCOP(value: number | null | undefined) {
  if (value === null || value === undefined) return '$0.00'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatFecha(fecha: string | null) {
  if (!fecha) return '—'
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

const GREEN = '#4a8a35'
const BORDER = '1px solid #999'
const BORDER_INNER = '1px solid #ddd'

const greenBar: React.CSSProperties = {
  backgroundColor: GREEN,
  color: 'white',
  fontWeight: 'bold',
  fontSize: '8.5pt',
  padding: '3px 8px',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
}

const fieldLabel: React.CSSProperties = {
  color: '#555',
  fontSize: '8.5pt',
  paddingRight: '8px',
  paddingBottom: '3px',
  whiteSpace: 'nowrap',
  verticalAlign: 'top',
}

const fieldValue: React.CSSProperties = {
  fontSize: '8.5pt',
  paddingBottom: '3px',
  fontWeight: '500',
  verticalAlign: 'top',
}

export default async function OCPage({ params }: Props) {
  const { id } = await params
  const data = await getOrdenCompraData(id)

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg p-8 shadow text-center max-w-md">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Orden de Compra no encontrada</h1>
          <p className="text-gray-500 text-sm mb-4">
            Esta factura aún no tiene una OC generada, o ocurrió un error al cargarla.
          </p>
          <Link
            href={`/facturas/${id}/validar`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#6ab04c] text-white rounded-md text-sm hover:bg-[#4a8a35]"
          >
            Volver a la factura
          </Link>
        </div>
      </div>
    )
  }

  const { factura, oc, empresa } = data
  const proveedor = factura.proveedores
  const lineas = factura.lineas_factura
  const distribuciones = factura.distribuciones_costo
  const concepto = ((oc.concepto as ConceptoItem[] | null) ?? []).filter(c => c.concepto)

  const impuesto = (factura.iva ?? 0) + (factura.inc ?? 0)
  const retenciones = (factura.rete_fuente ?? 0) + (factura.rete_ica ?? 0)
  const reteiva = factura.rete_iva ?? 0
  const emptyRows = Math.max(0, 10 - lineas.length)

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
        <PrintButton />
      </div>

      <div className="min-h-screen bg-gray-100 print:bg-white py-8 print:py-0 flex justify-center print:block">
        <div
          className="bg-white shadow-lg print:shadow-none w-[210mm] min-h-[297mm] print:w-full print:min-h-0"
          style={{ fontFamily: 'Arial, sans-serif', fontSize: '9pt', padding: '10mm' }}
        >

          {/* ══════════════════════════════════════════════
              HEADER — abierto, sin borde exterior
          ══════════════════════════════════════════════ */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
            <tbody>
              <tr>
                {/* Logo + datos empresa */}
                <td style={{ width: '55%', padding: '4px 8px 10px 0', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.svg" alt="Logo" style={{ height: '44px', width: 'auto', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '11.5pt', color: GREEN }}>
                        {empresa?.nombre ?? 'AGROINSUMOS SAS'}
                      </div>
                      <div style={{ fontSize: '7.5pt', color: '#555', marginTop: '2px', lineHeight: '1.55' }}>
                        {empresa?.direccion ?? 'Calle 13 # 56-20 barrio villa Daniel - Zaragoza'}
                      </div>
                      <div style={{ fontSize: '7.5pt', color: '#555', lineHeight: '1.55' }}>
                        Ciudad: {empresa?.ciudad ?? 'Cartago - Valle'}
                      </div>
                      <div style={{ fontSize: '7.5pt', color: '#555', lineHeight: '1.55' }}>
                        E-mail: {empresa?.correo ?? 'f.electronica@agroinsumossa.com'}
                      </div>
                      <div style={{ fontSize: '7.5pt', color: '#555', lineHeight: '1.55' }}>
                        Nit: {empresa?.nit ?? '836 000 548 - 7'}
                      </div>
                      <div style={{ fontSize: '7.5pt', color: '#555', lineHeight: '1.55' }}>
                        Teléfono: {empresa?.telefono ?? '(602) 214 99 10'}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Título ORDEN DE COMPRA */}
                <td style={{ width: '45%', padding: '4px 0 10px 16px', textAlign: 'right', verticalAlign: 'middle' }}>
                  <div style={{ fontSize: '20pt', fontWeight: 'bold', color: '#222', letterSpacing: '1px' }}>
                    ORDEN DE COMPRA
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '9pt' }}>
                    <table style={{ marginLeft: 'auto', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ textAlign: 'right', color: '#333', paddingRight: '6px', fontWeight: 'bold' }}>OC#:</td>
                          <td style={{ textAlign: 'left', fontWeight: 'bold', color: GREEN, minWidth: '80px' }}>{oc.numero_oc}</td>
                        </tr>
                        <tr>
                          <td style={{ textAlign: 'right', color: '#333', paddingRight: '6px', fontWeight: 'bold' }}>Fecha:</td>
                          <td style={{ textAlign: 'left', color: '#333' }}>{formatFecha(oc.fecha_generacion)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ══════════════════════════════════════════════
              ÁREA BORDEADA — secciones + ítems + footer
          ══════════════════════════════════════════════ */}
          <div style={{ border: BORDER, overflow: 'hidden' }}>

            {/* ── PROVEEDOR | DISTRIBUCIÓN ─────────────── */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ ...greenBar, width: '50%' }}>Proveedor</td>
                  <td style={{ ...greenBar, width: '50%', borderLeft: BORDER }}>Distribución - Centro Costo</td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 8px', verticalAlign: 'top', borderRight: BORDER, borderBottom: BORDER }}>
                    <table style={{ width: '100%' }}>
                      <tbody>
                        <tr>
                          <td style={fieldLabel}>Empresa</td>
                          <td style={fieldValue}>{proveedor?.razon_social ?? '—'}</td>
                        </tr>
                        <tr>
                          <td style={fieldLabel}>Nit</td>
                          <td style={{ ...fieldValue, fontFamily: 'monospace' }}>{proveedor?.nit ?? '—'}</td>
                        </tr>
                        <tr>
                          <td style={fieldLabel}>Régimen</td>
                          <td style={fieldValue}>{proveedor?.regimen_tributario ?? '—'}</td>
                        </tr>
                        <tr>
                          <td style={fieldLabel}>Contacto</td>
                          <td style={fieldValue}>{proveedor?.email ?? '—'}</td>
                        </tr>
                        <tr>
                          <td style={fieldLabel}>Tel#</td>
                          <td style={{ ...fieldValue, margin: 0, paddingBottom: 0 }}>{proveedor?.telefono ?? '—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td style={{ padding: '5px 8px', verticalAlign: 'top', borderBottom: BORDER }}>
                    <table style={{ width: '100%', fontSize: '8.5pt' }}>
                      <tbody>
                        <tr style={{ borderBottom: BORDER_INNER }}>
                          <td style={{ color: '#444', fontWeight: '600', paddingBottom: '3px' }}>Centro de Costo</td>
                          <td style={{ textAlign: 'right', color: '#444', fontWeight: '600', paddingBottom: '3px', width: '30px' }}>%</td>
                          <td style={{ textAlign: 'right', color: '#444', fontWeight: '600', paddingBottom: '3px', paddingLeft: '8px', whiteSpace: 'nowrap' }}>Monto</td>
                        </tr>
                        {distribuciones.length === 0 ? (
                          <tr><td colSpan={3} style={{ color: '#999', paddingTop: '4px' }}>Sin distribución asignada</td></tr>
                        ) : (
                          distribuciones.map((d, i) => (
                            <tr key={i}>
                              <td style={{ paddingTop: '3px', paddingRight: '4px', color: '#333' }}>
                                {d.centro_costo}{d.sub_centro ? ` > ${d.sub_centro}` : ''}
                              </td>
                              <td style={{ textAlign: 'right', paddingTop: '3px', color: '#333' }}>{d.porcentaje}%</td>
                              <td style={{ textAlign: 'right', paddingTop: '3px', paddingLeft: '8px', fontFamily: 'monospace', color: '#333' }}>
                                {formatCOP(d.monto)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ── CONCEPTO | CATEGORÍA ─────────────────── */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ ...greenBar, width: '50%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Concepto</span><span>%</span>
                    </div>
                  </td>
                  <td style={{ ...greenBar, width: '50%', borderLeft: BORDER }}>Categoría</td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 8px', verticalAlign: 'top', borderRight: BORDER, borderBottom: BORDER }}>
                    {concepto.length === 0 ? (
                      <span style={{ fontSize: '8.5pt', color: '#999' }}>—</span>
                    ) : (
                      <table style={{ width: '100%', fontSize: '8.5pt' }}>
                        <tbody>
                          {concepto.map((c, i) => (
                            <tr key={i}>
                              <td style={{ paddingBottom: '3px', color: '#333' }}>{c.concepto}</td>
                              <td style={{ textAlign: 'right', paddingBottom: '3px', color: '#333', whiteSpace: 'nowrap' }}>{c.porcentaje}%</td>
                            </tr>
                          ))}
                          <tr style={{ borderTop: BORDER_INNER }}>
                            <td style={{ paddingTop: '3px', color: '#555', fontWeight: 'bold', fontSize: '8pt' }}>Total</td>
                            <td style={{ textAlign: 'right', paddingTop: '3px', fontWeight: 'bold', fontSize: '8pt' }}>
                              {concepto.reduce((s, c) => s + c.porcentaje, 0)}%
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </td>
                  <td style={{ padding: '0', verticalAlign: 'top', borderBottom: BORDER }}>
                    <div style={{ padding: '5px 8px', fontSize: '8.5pt', minHeight: '22px', color: '#333' }}>
                      {oc.categoria ?? <span style={{ color: '#999', fontStyle: 'italic' }}>(Categoría)</span>}
                    </div>
                    <div style={{ ...greenBar }}>Información</div>
                    <div style={{ padding: '5px 8px', fontSize: '8.5pt', color: '#444', lineHeight: '1.45', fontStyle: 'italic' }}>
                      {factura.informacion ?? '(Información)'}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ── SOLICITADO POR | CARGO | CORREO ─────── */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ ...greenBar, width: '33%' }}>Solicitado Por</td>
                  <td style={{ ...greenBar, width: '27%', borderLeft: BORDER }}>Cargo</td>
                  <td style={{ ...greenBar, width: '40%', borderLeft: BORDER }}>Correo</td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 8px', fontSize: '8.5pt', fontWeight: '600', color: '#222', borderRight: BORDER, borderBottom: BORDER }}>
                    {oc.solicitante_nombre ?? '—'}
                  </td>
                  <td style={{ padding: '5px 8px', fontSize: '8.5pt', color: '#333', borderRight: BORDER, borderBottom: BORDER }}>
                    {oc.solicitante_cargo ?? '—'}
                  </td>
                  <td style={{ padding: '5px 8px', fontSize: '8.5pt', color: '#444', borderBottom: BORDER }}>
                    {oc.solicitante_correo ?? '—'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ── TABLA DE LÍNEAS ──────────────────────── */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: GREEN }}>
                  <th style={{ color: 'white', padding: '4px 6px', textAlign: 'center', width: '5%', fontSize: '8.5pt', fontWeight: 'bold', borderRight: '1px solid #6ab04c' }}>Nro.</th>
                  <th style={{ color: 'white', padding: '4px 6px', textAlign: 'left', fontSize: '8.5pt', fontWeight: 'bold', borderRight: '1px solid #6ab04c' }}>Descripción</th>
                  <th style={{ color: 'white', padding: '4px 6px', textAlign: 'center', width: '9%', fontSize: '8.5pt', fontWeight: 'bold', borderRight: '1px solid #6ab04c' }}>Cantidad</th>
                  <th style={{ color: 'white', padding: '4px 6px', textAlign: 'right', width: '14%', fontSize: '8.5pt', fontWeight: 'bold', borderRight: '1px solid #6ab04c' }}>Precio Unitario</th>
                  <th style={{ color: 'white', padding: '4px 6px', textAlign: 'center', width: '8%', fontSize: '8.5pt', fontWeight: 'bold', borderRight: '1px solid #6ab04c' }}>IVA</th>
                  <th style={{ color: 'white', padding: '4px 6px', textAlign: 'right', width: '13%', fontSize: '8.5pt', fontWeight: 'bold' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((l) => (
                  <tr key={l.id} style={{ borderBottom: BORDER_INNER }}>
                    <td style={{ padding: '4px 6px', textAlign: 'center', fontSize: '8.5pt' }}>{l.numero_linea}</td>
                    <td style={{ padding: '4px 6px', fontSize: '8.5pt' }}>{l.descripcion}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', fontSize: '8.5pt' }}>{l.cantidad}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'monospace', fontSize: '8.5pt' }}>{formatCOP(l.precio_unitario)}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', fontSize: '8.5pt' }}>
                      {l.tipo_impuesto && l.tarifa_impuesto ? `${l.tipo_impuesto} ${l.tarifa_impuesto}%` : '—'}
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'monospace', fontSize: '8.5pt' }}>{formatCOP(l.total_linea)}</td>
                  </tr>
                ))}
                {Array.from({ length: emptyRows }).map((_, i) => (
                  <tr key={`empty-${i}`} style={{ borderBottom: BORDER_INNER }}>
                    <td style={{ padding: '9px 6px' }}>&nbsp;</td>
                    <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── FOOTER ───────────────────────────────── */}
            <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: BORDER }}>
              <tbody>
                <tr>
                  <td style={{ ...greenBar, width: '50%' }}># Factura - # Cotización</td>
                  <td style={{ width: '50%', borderLeft: BORDER_INNER }}></td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', verticalAlign: 'top', borderRight: BORDER_INNER, fontSize: '8.5pt' }}>
                    <div style={{ marginBottom: '3px' }}>
                      <strong>N° Factura:</strong> {factura.numero_factura}
                    </div>
                    <div style={{ color: '#555' }}>
                      <strong>Fecha emisión:</strong> {formatFecha(factura.fecha_emision)}
                    </div>
                  </td>
                  <td style={{ padding: '5px 10px', verticalAlign: 'top' }}>
                    <table style={{ width: '100%', fontSize: '8.5pt' }}>
                      <tbody>
                        <tr>
                          <td style={{ color: '#333', paddingBottom: '2px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Subtotal</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', paddingBottom: '2px' }}>{formatCOP(factura.subtotal)}</td>
                        </tr>
                        <tr>
                          <td style={{ color: '#333', paddingBottom: '2px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Impuesto</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', paddingBottom: '2px' }}>{formatCOP(impuesto)}</td>
                        </tr>
                        {retenciones > 0 && (
                          <tr>
                            <td style={{ color: '#333', paddingBottom: '2px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Retenciones</td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace', paddingBottom: '2px' }}>{formatCOP(-retenciones)}</td>
                          </tr>
                        )}
                        {reteiva > 0 && (
                          <tr>
                            <td style={{ color: '#333', paddingBottom: '2px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.4px' }}>ReteIVA 19%</td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace', paddingBottom: '2px' }}>{formatCOP(-reteiva)}</td>
                          </tr>
                        )}
                        {/* Total: solo el monto, sin etiqueta */}
                        <tr style={{ borderTop: '1px solid #bbb' }}>
                          <td colSpan={2} style={{ textAlign: 'right', paddingTop: '4px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '13pt', color: GREEN }}>
                              {formatCOP(factura.total_neto)}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* BARRA VERDE INFERIOR */}
            <div style={{ height: '5px', backgroundColor: GREEN }} />

          </div>{/* fin área bordeada */}

          {/* ── FIRMAS — fuera del borde, formato inline ── */}
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '8.5pt' }}>
            <div>
              <span style={{ color: '#555' }}>Hecho por:</span>{' '}
              <span style={{ fontWeight: '600' }}>{oc.solicitante_nombre ?? '—'}</span>
            </div>
            <div>
              <span style={{ color: '#555' }}>Autorizado por:</span>{' '}
              <span style={{ fontWeight: '600' }}>{oc.autorizado_por ?? '—'}</span>
            </div>
          </div>

          {/* LÍNEA VERDE DECORATIVA FINAL */}
          <div style={{ height: '3px', backgroundColor: '#6ab04c', marginTop: '10px' }} />

        </div>
      </div>

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
