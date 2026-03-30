'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ExternalLink, FileText, Loader2, Plus, Trash2,
  Save, CheckCircle, Printer, FileOutput,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { EstadoBadge, EstadoPagoBadge } from './estado-badge'
import {
  getFactura,
  getSignedUrl,
  saveValidacion,
  type FacturaDetallada,
  type DistribucionEditable,
  type ConceptoItem,
} from '@/lib/actions/facturas'
import { getCentrosCostoSimple, getConceptos } from '@/lib/actions/configuracion'
import { generarOrdenCompra } from '@/lib/actions/ordenes'
import type { CentroCosto, ConceptoConfig } from '@/lib/supabase/types'

function formatCOP(value: number | null) {
  if (value === null || value === undefined) return '—'
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

const CATEGORIAS = [
  'Insumos agrícolas',
  'Mantenimiento y reparación',
  'Servicios profesionales',
  'Transporte y logística',
  'Repuestos y materiales',
  'Herramientas y equipos',
  'Arriendo y servicios',
  'Combustibles y lubricantes',
  'Otros',
]

interface Props {
  facturaId: string
  onClose: () => void
}

export function FacturaQuickView({ facturaId, onClose }: Props) {
  const [factura, setFactura] = useState<FacturaDetallada | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)

  const [centros, setCentros] = useState<CentroCosto[]>([])
  const [conceptosConfig, setConceptosConfig] = useState<ConceptoConfig[]>([])
  const [distribuciones, setDistribuciones] = useState<DistribucionEditable[]>([])
  const [concepto, setConcepto] = useState<ConceptoItem[]>([])
  const [categoria, setCategoria] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setLoading(true)
    setDistribuciones([])
    setConcepto([])
    setCategoria('')

    Promise.all([
      getFactura(facturaId),
      getCentrosCostoSimple(),
      getConceptos(),
    ]).then(([facturaData, centrosData, conceptosData]) => {
      setFactura(facturaData)
      setCentros(centrosData)
      setConceptosConfig(conceptosData)
      if (facturaData) {
        setDistribuciones(
          facturaData.distribuciones_costo.map((d) => ({
            localId: d.id,
            dbId: d.id,
            centro_costo: d.centro_costo,
            sub_centro: d.sub_centro ?? '',
            porcentaje: d.porcentaje,
            monto: d.monto,
          }))
        )
        const oc = facturaData.ordenes_compra?.[0]
        setConcepto(
          oc
            ? (oc.concepto as ConceptoItem[] | null) ?? []
            : (facturaData.proveedores?.ultimo_concepto as ConceptoItem[] | null) ?? []
        )
        setCategoria(oc?.categoria ?? facturaData.proveedores?.ultima_categoria ?? '')
      }
      setLoading(false)
    })
  }, [facturaId])

  const centrosActivos = centros.filter((c) => c.activo)
  const conceptosActivos = conceptosConfig.filter((c) => c.activo)
  const totalDistribucion = distribuciones.reduce((s, d) => s + d.porcentaje, 0)
  const totalNeto = factura?.total_neto ?? 0

  function puedeValidar() {
    if (!factura) return false
    if (!factura.numero_factura || factura.numero_factura === 'PROCESANDO...') return false
    if (!factura.fecha_emision) return false
    if (totalNeto <= 0) return false
    if (distribuciones.length === 0) return false
    if (Math.abs(totalDistribucion - 100) > 0.01) return false
    return true
  }

  // --- Helpers distribución ---

  function addDistribucion() {
    if (distribuciones.length >= 4) return
    const newN = distribuciones.length + 1
    const perItem = parseFloat((100 / newN).toFixed(2))
    let assigned = 0
    const adjusted = distribuciones.map((d, i) => {
      const isLast = i === distribuciones.length - 1
      const pct = isLast ? parseFloat((100 - perItem - assigned).toFixed(2)) : perItem
      if (!isLast) assigned += perItem
      return { ...d, porcentaje: pct, monto: (pct / 100) * totalNeto }
    })
    setDistribuciones([
      ...adjusted,
      { localId: `d-${Date.now()}`, centro_costo: '', sub_centro: '', porcentaje: perItem, monto: (perItem / 100) * totalNeto },
    ])
  }

  function removeDistribucion(localId: string) {
    const remaining = distribuciones.filter((d) => d.localId !== localId)
    if (remaining.length === 0) { setDistribuciones([]); return }
    const perItem = parseFloat((100 / remaining.length).toFixed(2))
    let assigned = 0
    setDistribuciones(remaining.map((d, i) => {
      const isLast = i === remaining.length - 1
      const pct = isLast ? parseFloat((100 - assigned).toFixed(2)) : perItem
      if (!isLast) assigned += perItem
      return { ...d, porcentaje: pct, monto: (pct / 100) * totalNeto }
    }))
  }

  function updateCentroNombre(localId: string, centro_costo: string) {
    setDistribuciones(distribuciones.map((d) =>
      d.localId === localId ? { ...d, centro_costo } : d
    ))
  }

  function updateCentroPorcentaje(localId: string, newVal: number) {
    const clamped = Math.min(100, Math.max(0, newVal))
    const n = distribuciones.length
    if (n <= 1) {
      setDistribuciones(distribuciones.map((d) =>
        d.localId === localId ? { ...d, porcentaje: clamped, monto: (clamped / 100) * totalNeto } : d
      ))
      return
    }
    const remaining = Math.max(0, 100 - clamped)
    const perOther = parseFloat((remaining / (n - 1)).toFixed(2))
    const others = distribuciones.filter((d) => d.localId !== localId)
    let distributed = 0
    setDistribuciones(distribuciones.map((d) => {
      if (d.localId === localId) return { ...d, porcentaje: clamped, monto: (clamped / 100) * totalNeto }
      const isLast = d === others[others.length - 1]
      const pct = isLast
        ? parseFloat((remaining - distributed).toFixed(2))
        : perOther
      if (!isLast) distributed += perOther
      return { ...d, porcentaje: pct, monto: (pct / 100) * totalNeto }
    }))
  }

  // --- Helpers concepto ---

  function addConcepto() {
    if (conceptosActivos.length > 0 && concepto.length >= conceptosActivos.length) return
    const newN = concepto.length + 1
    const perItem = parseFloat((100 / newN).toFixed(2))
    let assigned = 0
    const adjusted = concepto.map((c, i) => {
      const isLast = i === concepto.length - 1
      const pct = isLast ? parseFloat((100 - perItem - assigned).toFixed(2)) : perItem
      if (!isLast) assigned += perItem
      return { ...c, porcentaje: pct }
    })
    setConcepto([...adjusted, { concepto: '', porcentaje: perItem }])
  }

  function removeConcepto(i: number) {
    const remaining = concepto.filter((_, idx) => idx !== i)
    if (remaining.length === 0) { setConcepto([]); return }
    const perItem = parseFloat((100 / remaining.length).toFixed(2))
    let assigned = 0
    setConcepto(remaining.map((c, idx) => {
      const isLast = idx === remaining.length - 1
      const pct = isLast ? parseFloat((100 - assigned).toFixed(2)) : perItem
      if (!isLast) assigned += perItem
      return { ...c, porcentaje: pct }
    }))
  }

  function updateConceptoNombre(i: number, value: string) {
    setConcepto(concepto.map((c, idx) => idx === i ? { ...c, concepto: value } : c))
  }

  function updateConceptoPorcentaje(index: number, newVal: number) {
    const clamped = Math.min(100, Math.max(0, newVal))
    const n = concepto.length
    if (n <= 1) {
      setConcepto(concepto.map((c, i) => i === index ? { ...c, porcentaje: clamped } : c))
      return
    }
    const remaining = Math.max(0, 100 - clamped)
    const perOther = parseFloat((remaining / (n - 1)).toFixed(2))
    const others = concepto.filter((_, i) => i !== index)
    let distributed = 0
    setConcepto(concepto.map((c, i) => {
      if (i === index) return { ...c, porcentaje: clamped }
      const isLast = c === others[others.length - 1]
      const pct = isLast
        ? parseFloat((remaining - distributed).toFixed(2))
        : perOther
      if (!isLast) distributed += perOther
      return { ...c, porcentaje: pct }
    }))
  }

  // --- Acciones ---

  async function handleVerPDF() {
    if (!factura?.archivo_original_path) return
    setPdfLoading(true)
    const url = await getSignedUrl(factura.archivo_original_path)
    setPdfLoading(false)
    if (url) window.open(url, '_blank')
  }

  async function handleSave(validar: boolean) {
    if (!factura) return
    if (validar && !puedeValidar()) {
      if (distribuciones.length === 0) toast.error('Asigna al menos 1 centro de costo')
      else if (Math.abs(totalDistribucion - 100) > 0.01) toast.error('La distribución debe sumar 100%')
      else toast.error('La factura no cumple los requisitos para validar')
      return
    }
    startTransition(async () => {
      const prov = factura.proveedores
      const result = await saveValidacion({
        facturaId: factura.id,
        proveedorId: prov?.id ?? null,
        proveedor: {
          razon_social: prov?.razon_social ?? '',
          regimen_tributario: prov?.regimen_tributario ?? '',
          tipo_persona: prov?.tipo_persona ?? '',
          direccion: prov?.direccion ?? '',
          telefono: prov?.telefono ?? '',
          email: prov?.email ?? '',
        },
        factura: {
          numero_factura: factura.numero_factura,
          fecha_emision: factura.fecha_emision ?? '',
          forma_pago: factura.forma_pago ?? 'CONTADO',
          subtotal: factura.subtotal ?? 0,
          iva: factura.iva ?? 0,
          inc: factura.inc ?? 0,
          rete_fuente: factura.rete_fuente ?? 0,
          rete_iva: factura.rete_iva ?? 0,
          rete_ica: factura.rete_ica ?? 0,
          total_impuestos: factura.total_impuestos ?? 0,
          total_neto: factura.total_neto ?? 0,
          informacion: factura.informacion ?? '',
        },
        lineas: factura.lineas_factura.map((l) => ({
          numero_linea: l.numero_linea,
          codigo: l.codigo ?? '',
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
          tipo_impuesto: l.tipo_impuesto ?? '',
          tarifa_impuesto: l.tarifa_impuesto ?? 0,
          monto_impuesto: l.monto_impuesto ?? 0,
          total_linea: l.total_linea,
        })),
        distribuciones: distribuciones.map((d) => ({
          centro_costo: d.centro_costo,
          sub_centro: d.sub_centro,
          porcentaje: d.porcentaje,
          monto: d.monto,
        })),
        concepto,
        categoria,
        validar,
      })
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(validar ? 'Factura validada' : 'Cambios guardados')
        if (validar) {
          // Recargar para reflejar nuevo estado y mostrar botón Generar OC
          const updated = await getFactura(factura.id)
          if (updated) setFactura(updated)
        }
      }
    })
  }

  async function handleGenerarOC() {
    if (!factura) return
    startTransition(async () => {
      const result = await generarOrdenCompra(factura.id)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(`OC ${result.numeroOc} generada`)
        window.open(`/oc/${factura.id}`, '_blank')
        const updated = await getFactura(factura.id)
        if (updated) setFactura(updated)
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!factura) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-sm text-muted-foreground">Factura no encontrada.</p>
      </div>
    )
  }

  const ocExistente = factura.ordenes_compra?.[0] ?? null
  const retenciones = (factura.rete_fuente ?? 0) + (factura.rete_iva ?? 0) + (factura.rete_ica ?? 0)

  return (
    <div className="space-y-4 p-1 pb-6">

      {/* ① Header */}
      <SheetHeader className="pb-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <SheetTitle className="font-mono text-base leading-tight truncate">
              {factura.numero_factura}
            </SheetTitle>
            {ocExistente?.numero_oc && (
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                OC: {ocExistente.numero_oc}
              </p>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end shrink-0">
            <EstadoBadge estado={factura.estado} />
            <EstadoPagoBadge estado={factura.estado_pago} />
          </div>
        </div>
      </SheetHeader>

      {/* ② Información Básica */}
      <section className="space-y-1.5">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Información Básica
        </h3>
        <div className="border rounded-lg p-3 space-y-2.5 bg-muted/10">
          <div className="flex gap-2 items-baseline">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide shrink-0 w-20">Proveedor</span>
            <span className="text-sm font-semibold leading-tight">{factura.proveedores?.razon_social ?? '—'}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">NIT</p>
              <p className="text-xs font-mono mt-0.5">{factura.proveedores?.nit ?? '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fecha emisión</p>
              <p className="text-xs mt-0.5">{formatFecha(factura.fecha_emision)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Forma de pago</p>
              <p className="text-xs mt-0.5">{factura.forma_pago ?? '—'}</p>
            </div>
            {factura.confianza_extraccion != null && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Confianza IA</p>
                <p className="text-xs mt-0.5">{factura.confianza_extraccion}%</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ③ Totales */}
      <section className="space-y-1.5">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Totales</h3>
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 divide-x bg-muted/10 text-center px-1 py-2.5">
            <div className="px-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Subtotal</p>
              <p className="text-xs font-mono mt-0.5">{formatCOP(factura.subtotal)}</p>
            </div>
            <div className="px-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">IVA</p>
              <p className="text-xs font-mono mt-0.5">{formatCOP(factura.iva)}</p>
            </div>
            <div className="px-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Retenciones</p>
              <p className={`text-xs font-mono mt-0.5 ${retenciones > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {retenciones > 0 ? `-${formatCOP(retenciones)}` : '—'}
              </p>
            </div>
          </div>
          <div className="border-t px-4 py-2.5 flex items-center justify-between bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Neto</span>
            <span className="text-lg font-bold font-mono tabular-nums">{formatCOP(factura.total_neto)}</span>
          </div>
        </div>
      </section>

      {/* ④ Centros de Costo — EDITABLE */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Centros de Costo</h3>
          {centrosActivos.length > 0 && distribuciones.length < 4 && (
            <button
              onClick={addDistribucion}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" /> Agregar
            </button>
          )}
        </div>
        <div className="border rounded-lg p-3 space-y-2 bg-muted/10">
          {centrosActivos.length === 0 && (
            <p className="text-xs text-muted-foreground">Sin centros activos. Ve a Configuración.</p>
          )}
          {centrosActivos.length > 0 && distribuciones.length === 0 && (
            <p className="text-xs text-muted-foreground">Sin distribución asignada.</p>
          )}
          {distribuciones.map((dist) => (
            <div key={dist.localId} className="flex gap-1.5 items-center">
              <select
                value={dist.centro_costo}
                onChange={(e) => updateCentroNombre(dist.localId, e.target.value)}
                className="flex-1 h-7 text-xs border rounded-md px-2 bg-background outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Seleccionar...</option>
                {centrosActivos.map((c) => (
                  <option key={c.id} value={c.nombre}>{c.nombre}</option>
                ))}
              </select>
              <Input
                type="number"
                value={dist.porcentaje}
                onChange={(e) => updateCentroPorcentaje(dist.localId, parseFloat(e.target.value) || 0)}
                className="w-14 h-7 text-xs text-right"
                min={0}
                max={100}
                step={0.1}
              />
              <span className="text-xs text-muted-foreground">%</span>
              <span className="text-xs font-mono w-24 text-right text-muted-foreground shrink-0">
                {formatCOP(dist.monto)}
              </span>
              <button
                onClick={() => removeDistribucion(dist.localId)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {distribuciones.length > 1 && (
            <p className={`text-xs text-right font-mono pt-0.5 ${
              Math.abs(totalDistribucion - 100) < 0.01 ? 'text-green-700' : 'text-destructive'
            }`}>
              Total: {totalDistribucion.toFixed(2)}%
            </p>
          )}
        </div>
      </section>

      {/* ⑤ Concepto y Categoría — EDITABLE */}
      <section className="space-y-1.5">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Concepto y Categoría</h3>
        <div className="border rounded-lg p-3 space-y-2.5 bg-muted/10">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full h-7 text-xs border rounded-md px-2 bg-background outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Categoría...</option>
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Desglose concepto</span>
              {conceptosActivos.length > 0 && concepto.length < conceptosActivos.length && (
                <button
                  onClick={addConcepto}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-3 w-3" /> Agregar
                </button>
              )}
            </div>
            {conceptosActivos.length === 0 && (
              <p className="text-xs text-muted-foreground">Sin conceptos configurados.</p>
            )}
            {conceptosActivos.length > 0 && concepto.length === 0 && (
              <p className="text-xs text-muted-foreground">Sin desglose de concepto.</p>
            )}
            {concepto.map((c, i) => (
              <div key={i} className="flex gap-1.5 items-center">
                <select
                  value={c.concepto}
                  onChange={(e) => updateConceptoNombre(i, e.target.value)}
                  className="flex-1 h-7 text-xs border rounded-md px-2 bg-background outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Seleccionar...</option>
                  {conceptosActivos.map((con) => (
                    <option key={con.id} value={con.nombre}>{con.nombre}</option>
                  ))}
                </select>
                <Input
                  type="number"
                  value={c.porcentaje}
                  onChange={(e) => updateConceptoPorcentaje(i, parseFloat(e.target.value) || 0)}
                  className="w-14 h-7 text-xs text-right"
                  min={0}
                  max={100}
                />
                <span className="text-xs text-muted-foreground">%</span>
                <button
                  onClick={() => removeConcepto(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⑥ Líneas */}
      <section className="space-y-1.5">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Líneas ({factura.lineas_factura.length} ítem{factura.lineas_factura.length !== 1 ? 's' : ''})
        </h3>
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-44 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-2.5 py-1.5 text-left font-medium text-muted-foreground">Descripción</th>
                  <th className="px-2.5 py-1.5 text-right font-medium text-muted-foreground">Cant.</th>
                  <th className="px-2.5 py-1.5 text-right font-medium text-muted-foreground">P. Unit.</th>
                  <th className="px-2.5 py-1.5 text-right font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {factura.lineas_factura.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2.5 py-3 text-center text-muted-foreground">
                      Sin líneas registradas
                    </td>
                  </tr>
                ) : (
                  factura.lineas_factura.map((l, i) => (
                    <tr key={i} className="border-t hover:bg-muted/20">
                      <td className="px-2.5 py-1.5 max-w-[200px] truncate" title={l.descripcion}>
                        {l.descripcion}
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-mono">{l.cantidad}</td>
                      <td className="px-2.5 py-1.5 text-right font-mono">{formatCOP(l.precio_unitario)}</td>
                      <td className="px-2.5 py-1.5 text-right font-mono">{formatCOP(l.total_linea)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ⑦ Checklist de Validación — siempre visible */}
      <div className="rounded-lg border border-dashed px-3 py-2.5 space-y-1.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          {factura.estado === 'validada' || factura.estado === 'vinculada'
            ? 'Validación completada'
            : 'Requisitos para validar'}
        </p>
        {[
          { ok: !!(factura.numero_factura && factura.numero_factura !== 'PROCESANDO...'), label: 'Número de factura correcto' },
          { ok: !!factura.fecha_emision, label: 'Fecha de emisión establecida' },
          { ok: (factura.total_neto ?? 0) > 0, label: 'Total neto mayor a cero' },
          { ok: distribuciones.length > 0, label: 'Al menos 1 centro de costo' },
          { ok: distribuciones.length > 0 && Math.abs(totalDistribucion - 100) < 0.01, label: 'Distribución suma 100%' },
        ].map(({ ok, label }) => (
          <div key={label} className={`flex items-center gap-2 text-xs ${ok ? 'text-green-700' : 'text-muted-foreground'}`}>
            <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
              ok ? 'bg-green-100 text-green-700' : 'bg-muted'
            }`}>
              {ok ? '✓' : '○'}
            </span>
            {label}
          </div>
        ))}
      </div>

      {/* ⑧ Acciones */}
      <div className="flex flex-wrap gap-2 pt-2 border-t">
        {/* Ver PDF */}
        {factura.archivo_original_path && (
          <Button variant="outline" size="sm" onClick={handleVerPDF} disabled={pdfLoading} className="gap-1.5">
            {pdfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            Ver PDF
          </Button>
        )}

        {/* Guardar — siempre disponible */}
        <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={isPending} className="gap-1.5">
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Guardar
        </Button>

        {/* Validar */}
        {factura.estado !== 'validada' && factura.estado !== 'vinculada' && (
          <Button
            size="sm"
            onClick={() => handleSave(true)}
            disabled={isPending || !puedeValidar()}
            className="gap-1.5"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
            Validar
          </Button>
        )}

        {/* Generar OC (validada sin OC aún) */}
        {factura.estado === 'validada' && !ocExistente && (
          <Button
            size="sm"
            onClick={handleGenerarOC}
            disabled={isPending}
            className="gap-1.5 bg-[#4a8a35] hover:bg-[#3a6a28] text-white"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileOutput className="h-3.5 w-3.5" />}
            Generar OC
          </Button>
        )}

        {/* Ver / Imprimir OC (vinculada o con OC generada) */}
        {(factura.estado === 'vinculada' || ocExistente) && (
          <Link
            href={`/oc/${factura.id}`}
            target="_blank"
            className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1.5 border-[#6ab04c] text-[#4a8a35]' })}
          >
            <Printer className="h-3.5 w-3.5" />
            Ver / Imprimir OC
          </Link>
        )}

        {/* Edición completa */}
        <Link
          href={`/facturas/${factura.id}/validar`}
          onClick={onClose}
          className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'gap-1.5 ml-auto' })}
        >
          Edición completa <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
