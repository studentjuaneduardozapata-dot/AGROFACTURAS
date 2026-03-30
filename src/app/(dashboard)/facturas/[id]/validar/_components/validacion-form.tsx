'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Save, CheckCircle, Plus, Trash2, ExternalLink, Loader2, FileOutput } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { LineasTable } from './lineas-table'
import { EstadoBadge } from '../../../_components/estado-badge'
import {
  saveValidacion,
  getSignedUrl,
  type FacturaDetallada,
  type LineaEditable,
  type DistribucionEditable,
  type ConceptoItem,
} from '@/lib/actions/facturas'
import { generarOrdenCompra } from '@/lib/actions/ordenes'
import type { CentroCosto, ConceptoConfig } from '@/lib/supabase/types'

function formatCOP(value: number | null) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
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

interface ValidacionFormProps {
  factura: FacturaDetallada
  centros: CentroCosto[]
  conceptos: ConceptoConfig[]
}

export function ValidacionForm({ factura, centros, conceptos }: ValidacionFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const proveedor = factura.proveedores

  // --- Estado del formulario ---

  // Proveedor
  const [razon_social, setRazonSocial] = useState(proveedor?.razon_social ?? '')
  const [regimen_tributario, setRegimenTributario] = useState(proveedor?.regimen_tributario ?? '')
  const [tipo_persona, setTipoPersona] = useState(proveedor?.tipo_persona ?? '')
  const [direccion, setDireccion] = useState(proveedor?.direccion ?? '')
  const [telefono, setTelefono] = useState(proveedor?.telefono ?? '')
  const [email, setEmail] = useState(proveedor?.email ?? '')

  // Factura
  const [numero_factura, setNumeroFactura] = useState(factura.numero_factura)
  const [fecha_emision, setFechaEmision] = useState(factura.fecha_emision ?? '')
  const [forma_pago, setFormaPago] = useState<'CONTADO' | 'CRÉDITO'>(factura.forma_pago ?? 'CONTADO')
  const [subtotal, setSubtotal] = useState(factura.subtotal ?? 0)
  const [iva, setIva] = useState(factura.iva ?? 0)
  const [inc, setInc] = useState(factura.inc ?? 0)
  const [rete_fuente, setReteFuente] = useState(factura.rete_fuente ?? 0)
  const [rete_iva, setReteIva] = useState(factura.rete_iva ?? 0)
  const [rete_ica, setReteIca] = useState(factura.rete_ica ?? 0)
  const [total_impuestos, setTotalImpuestos] = useState(factura.total_impuestos ?? 0)
  const [total_neto, setTotalNeto] = useState(factura.total_neto ?? 0)
  const [informacion, setInformacion] = useState(factura.informacion ?? '')

  // Líneas
  const [lineas, setLineas] = useState<LineaEditable[]>(
    factura.lineas_factura.map((l) => ({
      localId: l.id,
      dbId: l.id,
      numero_linea: l.numero_linea,
      codigo: l.codigo ?? '',
      descripcion: l.descripcion,
      cantidad: l.cantidad,
      precio_unitario: l.precio_unitario,
      tipo_impuesto: l.tipo_impuesto ?? '',
      tarifa_impuesto: l.tarifa_impuesto ?? 0,
      monto_impuesto: l.monto_impuesto ?? 0,
      total_linea: l.total_linea,
    }))
  )

  // Distribución
  const [distribuciones, setDistribuciones] = useState<DistribucionEditable[]>(
    factura.distribuciones_costo.map((d) => ({
      localId: d.id,
      dbId: d.id,
      centro_costo: d.centro_costo,
      sub_centro: d.sub_centro ?? '',
      porcentaje: d.porcentaje,
      monto: d.monto,
    }))
  )

  // Centros de costo y concepto y categoría
  const centrosActivos = centros.filter((c) => c.activo)
  const conceptosActivos = conceptos.filter((c) => c.activo)
  const proveedorConcepto = proveedor?.ultimo_concepto as ConceptoItem[] | null
  const [concepto, setConcepto] = useState<ConceptoItem[]>(proveedorConcepto ?? [])
  const [categoria, setCategoria] = useState(proveedor?.ultima_categoria ?? '')

  // --- Validaciones ---
  const totalDistribucion = distribuciones.reduce((s, d) => s + d.porcentaje, 0)

  function puedeValidar() {
    if (!numero_factura || numero_factura === 'PROCESANDO...') return false
    if (distribuciones.length === 0) return false
    if (Math.abs(totalDistribucion - 100) > 0.01) return false
    return true
  }

  // --- Acciones ---

  async function handleSave(validar: boolean) {
    if (validar && !puedeValidar()) {
      if (distribuciones.length === 0) {
        toast.error('Debes asignar al menos 1 centro de costo')
      } else if (Math.abs(totalDistribucion - 100) > 0.01) {
        toast.error('La distribución de centros de costo debe sumar exactamente 100%')
      }
      return
    }

    startTransition(async () => {
      const result = await saveValidacion({
        facturaId: factura.id,
        proveedorId: proveedor?.id ?? null,
        proveedor: { razon_social, regimen_tributario, tipo_persona, direccion, telefono, email },
        factura: {
          numero_factura,
          fecha_emision,
          forma_pago,
          subtotal,
          iva,
          inc,
          rete_fuente,
          rete_iva,
          rete_ica,
          total_impuestos,
          total_neto,
          informacion,
        },
        lineas: lineas.map((l) => ({
          numero_linea: l.numero_linea,
          codigo: l.codigo,
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
          tipo_impuesto: l.tipo_impuesto,
          tarifa_impuesto: l.tarifa_impuesto,
          monto_impuesto: l.monto_impuesto,
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
        toast.success(validar ? 'Factura validada correctamente' : 'Cambios guardados')
        if (validar) router.push('/facturas')
      }
    })
  }

  async function handleVerPDF() {
    if (!factura.archivo_original_path) {
      toast.error('No hay archivo PDF asociado')
      return
    }
    const url = await getSignedUrl(factura.archivo_original_path)
    if (url) {
      window.open(url, '_blank')
    } else {
      toast.error('No se pudo obtener el enlace al PDF')
    }
  }

  // Concepto helpers
  function addConcepto() {
    if (concepto.length >= conceptosActivos.length && conceptosActivos.length > 0) return
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
    if (remaining.length === 0) {
      setConcepto([])
      return
    }
    const perItem = parseFloat((100 / remaining.length).toFixed(2))
    let assigned = 0
    setConcepto(
      remaining.map((c, idx) => {
        const isLast = idx === remaining.length - 1
        const pct = isLast ? parseFloat((100 - assigned).toFixed(2)) : perItem
        if (!isLast) assigned += perItem
        return { ...c, porcentaje: pct }
      })
    )
  }

  function updateConceptoNombre(i: number, value: string) {
    setConcepto(concepto.map((c, idx) => (idx === i ? { ...c, concepto: value } : c)))
  }

  function updateConceptoPorcentaje(index: number, newVal: number) {
    const clamped = Math.min(100, Math.max(0, newVal))
    const n = concepto.length

    if (n <= 1) {
      setConcepto(concepto.map((c, i) => (i === index ? { ...c, porcentaje: clamped } : c)))
      return
    }

    const remaining = Math.max(0, 100 - clamped)
    const perOther = parseFloat((remaining / (n - 1)).toFixed(2))
    const others = concepto.filter((_, i) => i !== index)
    let distributed = 0

    setConcepto(
      concepto.map((c, i) => {
        if (i === index) return { ...c, porcentaje: clamped }
        const isLast = c === others[others.length - 1]
        const pct = isLast
          ? parseFloat((remaining - distributed).toFixed(2))
          : perOther
        if (!isLast) distributed += perOther
        return { ...c, porcentaje: pct }
      })
    )
  }

  // Distribución de centros de costo helpers
  function addDistribucion() {
    if (distribuciones.length >= 4) return
    const newN = distribuciones.length + 1
    const perItem = parseFloat((100 / newN).toFixed(2))
    let assigned = 0
    const adjusted = distribuciones.map((d, i) => {
      const isLast = i === distribuciones.length - 1
      const pct = isLast ? parseFloat((100 - perItem - assigned).toFixed(2)) : perItem
      if (!isLast) assigned += perItem
      return { ...d, porcentaje: pct, monto: (pct / 100) * total_neto }
    })
    setDistribuciones([
      ...adjusted,
      { localId: `d-${Date.now()}`, centro_costo: '', sub_centro: '', porcentaje: perItem, monto: (perItem / 100) * total_neto },
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
      return { ...d, porcentaje: pct, monto: (pct / 100) * total_neto }
    }))
  }

  function updateCentroNombre(localId: string, centro_costo: string) {
    setDistribuciones(distribuciones.map((d) => d.localId === localId ? { ...d, centro_costo } : d))
  }

  function updateCentroPorcentaje(localId: string, newVal: number) {
    const clamped = Math.min(100, Math.max(0, newVal))
    const n = distribuciones.length
    if (n <= 1) {
      setDistribuciones(distribuciones.map((d) =>
        d.localId === localId ? { ...d, porcentaje: clamped, monto: (clamped / 100) * total_neto } : d
      ))
      return
    }
    const remaining = Math.max(0, 100 - clamped)
    const perOther = parseFloat((remaining / (n - 1)).toFixed(2))
    const others = distribuciones.filter((d) => d.localId !== localId)
    let distributed = 0
    setDistribuciones(distribuciones.map((d) => {
      if (d.localId === localId) return { ...d, porcentaje: clamped, monto: (clamped / 100) * total_neto }
      const isLast = d === others[others.length - 1]
      const pct = isLast ? parseFloat((remaining - distributed).toFixed(2)) : perOther
      if (!isLast) distributed += perOther
      return { ...d, porcentaje: pct, monto: (pct / 100) * total_neto }
    }))
  }

  const yaValidada = factura.estado === 'validada' || factura.estado === 'vinculada'
  const yaVinculada = factura.estado === 'vinculada'
  const ocExistente = factura.ordenes_compra?.[0]

  async function handleGenerarOC() {
    startTransition(async () => {
      const result = await generarOrdenCompra(factura.id)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(`OC ${result.numeroOc} generada correctamente`)
        router.push(`/oc/${factura.id}`)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/facturas">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{numero_factura}</h2>
              <EstadoBadge estado={factura.estado} />
              {yaValidada && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                  Solo lectura
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {proveedor?.razon_social ?? 'Proveedor no identificado'} · NIT {proveedor?.nit ?? '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {factura.archivo_original_path && (
            <Button variant="outline" size="sm" onClick={handleVerPDF} className="gap-2">
              <ExternalLink className="h-3.5 w-3.5" />
              Ver PDF
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(false)}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Guardar
          </Button>
          {!yaVinculada && !yaValidada && (
            <Button
              size="sm"
              onClick={() => handleSave(true)}
              disabled={isPending || !puedeValidar()}
              className="gap-2"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
              Validar
            </Button>
          )}

          {factura.estado === 'validada' && !ocExistente && (
            <Button
              size="sm"
              onClick={handleGenerarOC}
              disabled={isPending}
              className="gap-2 bg-[#4a8a35] hover:bg-[#3a6a28]"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileOutput className="h-3.5 w-3.5" />}
              Generar OC
            </Button>
          )}

          {(yaVinculada || ocExistente) && (
            <Link href={`/oc/${factura.id}`} target="_blank">
              <Button size="sm" variant="outline" className="gap-2 border-[#6ab04c] text-[#4a8a35]">
                <FileOutput className="h-3.5 w-3.5" />
                Ver / Imprimir OC
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Columna principal (2/3) */}
        <div className="xl:col-span-2 space-y-6">

          {/* Sección: Emisor */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Datos del Emisor
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">NIT</Label>
                <Input value={proveedor?.nit ?? '—'} readOnly className="bg-muted/30 font-mono text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Razón Social</Label>
                <Input
                  value={razon_social}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="Nombre o razón social"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Régimen Tributario</Label>
                <select
                  value={regimen_tributario}
                  onChange={(e) => setRegimenTributario(e.target.value)}
                  className="w-full h-9 text-sm border rounded-md px-2 bg-background outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">—</option>
                  <option value="Responsable IVA">Responsable IVA</option>
                  <option value="No responsable IVA">No responsable IVA</option>
                  <option value="Gran Contribuyente">Gran Contribuyente</option>
                  <option value="Régimen Simple">Régimen Simple</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo Persona</Label>
                <select
                  value={tipo_persona}
                  onChange={(e) => setTipoPersona(e.target.value)}
                  className="w-full h-9 text-sm border rounded-md px-2 bg-background outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">—</option>
                  <option value="Persona Jurídica">Persona Jurídica</option>
                  <option value="Persona Natural">Persona Natural</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Dirección</Label>
                <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Teléfono</Label>
                <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Correo electrónico</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Sección: Datos de la Factura */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Datos de la Factura
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Número de Factura</Label>
                <Input
                  value={numero_factura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fecha de Emisión</Label>
                <Input
                  type="date"
                  value={fecha_emision}
                  onChange={(e) => setFechaEmision(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Forma de Pago</Label>
                <select
                  value={forma_pago}
                  onChange={(e) => setFormaPago(e.target.value as 'CONTADO' | 'CRÉDITO')}
                  className="w-full h-9 text-sm border rounded-md px-2 bg-background outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="CONTADO">CONTADO</option>
                  <option value="CRÉDITO">CRÉDITO</option>
                </select>
              </div>
            </div>

            {/* Valores monetarios */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Subtotal', value: subtotal, set: setSubtotal },
                { label: 'IVA', value: iva, set: setIva },
                { label: 'INC', value: inc, set: setInc },
                { label: 'Total Impuestos', value: total_impuestos, set: setTotalImpuestos },
              ].map(({ label, value, set }) => (
                <div key={label} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => set(parseFloat(e.target.value) || 0)}
                    className="font-mono text-sm"
                    min={0}
                  />
                </div>
              ))}
              {[
                { label: 'Rete Fuente', value: rete_fuente, set: setReteFuente },
                { label: 'Rete IVA', value: rete_iva, set: setReteIva },
                { label: 'Rete ICA', value: rete_ica, set: setReteIca },
                { label: 'Total Neto', value: total_neto, set: setTotalNeto },
              ].map(({ label, value, set }) => (
                <div key={label} className="space-y-1">
                  <Label className={`text-xs ${label === 'Total Neto' ? 'font-semibold text-foreground' : ''}`}>
                    {label}
                  </Label>
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => set(parseFloat(e.target.value) || 0)}
                    className={`font-mono text-sm ${label === 'Total Neto' ? 'font-bold border-primary' : ''}`}
                    min={0}
                  />
                </div>
              ))}
            </div>

            {/* Total neto visual */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm font-medium">Total a Pagar</span>
              <span className="text-lg font-bold font-mono">{formatCOP(total_neto)}</span>
            </div>
          </div>

          {/* Sección: Descripción */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Descripción (generada por IA)
            </h3>
            <Textarea
              value={informacion}
              onChange={(e) => setInformacion(e.target.value)}
              rows={3}
              placeholder="Resumen del contenido de la factura..."
              className="resize-none text-sm"
            />
          </div>

          {/* Sección: Líneas */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Líneas de Factura ({lineas.length})
            </h3>
            <LineasTable lineas={lineas} onChange={setLineas} />
          </div>
        </div>

        {/* Columna derecha (1/3) */}
        <div className="space-y-6">

          {/* Sección: Distribución */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Centros de Costo
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Centro de costo (desglose %)</Label>
                {centrosActivos.length > 0 && distribuciones.length < 4 && (
                  <Button variant="ghost" size="sm" onClick={addDistribucion} className="h-6 text-xs gap-1">
                    <Plus className="h-3 w-3" /> Agregar
                  </Button>
                )}
              </div>

              {centrosActivos.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Sin centros activos. Ve a Configuración → Centros de Costo.
                </p>
              )}

              {distribuciones.length === 0 && centrosActivos.length > 0 && (
                <p className="text-xs text-muted-foreground">Sin distribución asignada.</p>
              )}

              {distribuciones.map((dist) => (
                <div key={dist.localId} className="flex gap-2 items-center">
                  <select
                    value={dist.centro_costo}
                    onChange={(e) => updateCentroNombre(dist.localId, e.target.value)}
                    className="flex-1 h-8 text-xs border rounded-md px-2 bg-background outline-none focus:ring-2 focus:ring-ring"
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
                    className="w-16 h-8 text-xs text-right"
                    min={0} max={100} step={0.1}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                  <button onClick={() => removeDistribucion(dist.localId)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sección: Concepto y Categoría */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Concepto y Categoría
            </h3>

            {/* Categoría */}
            <div className="space-y-1">
              <Label className="text-xs">Categoría</Label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full h-9 text-sm border rounded-md px-2 bg-background outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Seleccionar...</option>
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Concepto items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Concepto (desglose %)</Label>
                {conceptosActivos.length > 0 && concepto.length < conceptosActivos.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addConcepto}
                    className="h-6 text-xs gap-1"
                  >
                    <Plus className="h-3 w-3" /> Agregar
                  </Button>
                )}
              </div>

              {conceptosActivos.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Sin conceptos configurados. Ve a Configuración → Conceptos.
                </p>
              )}

              {concepto.length === 0 && conceptosActivos.length > 0 && (
                <p className="text-xs text-muted-foreground">Sin desglose de concepto.</p>
              )}

              {concepto.map((c, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={c.concepto}
                    onChange={(e) => updateConceptoNombre(i, e.target.value)}
                    className="flex-1 h-8 text-xs border rounded-md px-2 bg-background outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Seleccionar...</option>
                    {conceptosActivos.map((con) => (
                      <option key={con.id} value={con.nombre}>
                        {con.nombre}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    value={c.porcentaje}
                    onChange={(e) => updateConceptoPorcentaje(i, parseFloat(e.target.value) || 0)}
                    className="w-16 h-8 text-xs text-right"
                    min={0}
                    max={100}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                  <button onClick={() => removeConcepto(i)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen validación */}
          {!yaValidada && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
              <h3 className="font-semibold text-sm">Checklist de Validación</h3>
              <ul className="space-y-1.5 text-xs">
                {[
                  {
                    ok: numero_factura && numero_factura !== 'PROCESANDO...',
                    label: 'Número de factura correcto',
                  },
                  {
                    ok: !!fecha_emision,
                    label: 'Fecha de emisión establecida',
                  },
                  {
                    ok: total_neto > 0,
                    label: 'Total neto mayor a cero',
                  },
                  {
                    ok: distribuciones.length > 0,
                    label: 'Al menos 1 centro de costo asignado',
                  },
                  {
                    ok: distribuciones.length > 0 && Math.abs(totalDistribucion - 100) < 0.01,
                    label: 'Distribución suma 100%',
                  },
                ].map(({ ok, label }) => (
                  <li key={label} className={`flex items-center gap-2 ${ok ? 'text-green-700' : 'text-muted-foreground'}`}>
                    <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${ok ? 'bg-green-100' : 'bg-muted'}`}>
                      {ok ? '✓' : '○'}
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
