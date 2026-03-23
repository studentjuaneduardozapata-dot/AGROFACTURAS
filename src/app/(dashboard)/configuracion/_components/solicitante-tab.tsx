'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { saveSolicitanteDefault } from '@/lib/actions/configuracion'
import type { SolicitanteDefault, AutorizadorDefault } from '@/lib/supabase/types'

interface SolicitanteTabProps {
  solicitante: SolicitanteDefault | null
  autorizador: AutorizadorDefault | null
}

export function SolicitanteTab({ solicitante, autorizador }: SolicitanteTabProps) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await saveSolicitanteDefault(formData)

    setLoading(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Datos del solicitante y autorizador guardados')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {/* Solicitante */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Solicitante predeterminado</h3>
          <p className="text-xs text-muted-foreground">
            Aparece en el campo &quot;Solicitado por&quot; de las órdenes de compra
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="solicitante_nombre">Nombre completo</Label>
            <Input
              id="solicitante_nombre"
              name="solicitante_nombre"
              defaultValue={solicitante?.nombre ?? ''}
              placeholder="Andres Felipe Celis Bernal"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="solicitante_cargo">Cargo</Label>
            <Input
              id="solicitante_cargo"
              name="solicitante_cargo"
              defaultValue={solicitante?.cargo ?? ''}
              placeholder="Jefe De Planta"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="solicitante_correo">Correo electrónico</Label>
            <Input
              id="solicitante_correo"
              name="solicitante_correo"
              type="email"
              defaultValue={solicitante?.correo ?? ''}
              placeholder="andres.celis@agroinsumossa.com"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Autorizador */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Autorizador predeterminado</h3>
          <p className="text-xs text-muted-foreground">
            Aparece en el campo &quot;Autorizado por&quot; de las órdenes de compra
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="autorizador_nombre">Nombre completo</Label>
          <Input
            id="autorizador_nombre"
            name="autorizador_nombre"
            defaultValue={autorizador?.nombre ?? ''}
            placeholder="Juan Esteban Castaño"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="bg-[#6ab04c] hover:bg-[#4a8a35] text-white"
      >
        <Save className="mr-2 h-4 w-4" />
        {loading ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </form>
  )
}
