'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { saveConceptos } from '@/lib/actions/configuracion'
import type { ConceptoConfig } from '@/lib/supabase/types'

const MAX = 4
const MIN = 1

interface ConceptosTabProps {
  conceptos: ConceptoConfig[]
}

export function ConceptosTab({ conceptos: initialConceptos }: ConceptosTabProps) {
  const [items, setItems] = useState<ConceptoConfig[]>(initialConceptos)
  const [loading, setLoading] = useState(false)

  function addConcepto() {
    if (items.length >= MAX) return
    setItems([...items, { id: `c-${Date.now()}`, nombre: '', activo: true }])
  }

  function removeConcepto(id: string) {
    const activos = items.filter((i) => i.activo && i.nombre.trim())
    const toRemove = items.find((i) => i.id === id)
    if (toRemove?.activo && toRemove.nombre.trim() && activos.length <= MIN) {
      toast.error('Debe haber al menos 1 concepto activo')
      return
    }
    setItems(items.filter((i) => i.id !== id))
  }

  function updateItem(id: string, field: keyof ConceptoConfig, value: string | boolean) {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }

  async function handleSave() {
    const withName = items.filter((i) => i.nombre.trim())
    const activos = withName.filter((i) => i.activo)
    if (activos.length < MIN) {
      toast.error('Debe haber al menos 1 concepto activo con nombre')
      return
    }
    setLoading(true)
    const result = await saveConceptos(withName)
    setLoading(false)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      setItems(withName)
      toast.success('Conceptos guardados')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {items.length}/{MAX} concepto{items.length !== 1 ? 's' : ''}
          {items.length >= MAX && ' · máximo alcanzado'}
        </p>
        <div className="flex gap-2">
          {items.length < MAX && (
            <Button size="sm" variant="outline" onClick={addConcepto} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Agregar
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading}
            className="gap-1.5 bg-[#6ab04c] hover:bg-[#4a8a35] text-white"
          >
            {loading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Save className="h-3.5 w-3.5" />
            }
            Guardar
          </Button>
        </div>
      </div>

      {/* Lista */}
      {items.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-sm text-muted-foreground">
          Sin conceptos configurados. Agrega el primero.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 border rounded-lg bg-background"
            >
              <Switch
                checked={item.activo}
                onCheckedChange={(v) => updateItem(item.id, 'activo', v)}
              />
              <Input
                value={item.nombre}
                onChange={(e) => updateItem(item.id, 'nombre', e.target.value)}
                placeholder="Nombre del concepto..."
                className="flex-1 h-8 text-sm"
              />
              <button
                onClick={() => removeConcepto(item.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Los conceptos activos aparecerán como opciones en el formulario de validación de facturas.
        Mínimo 1 activo · Máximo {MAX}.
      </p>
    </div>
  )
}
