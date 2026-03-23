'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveDatosEmpresa } from '@/lib/actions/configuracion'
import type { DatosEmpresa } from '@/lib/supabase/types'

interface DatosEmpresaTabProps {
  datos: DatosEmpresa | null
}

export function DatosEmpresaTab({ datos }: DatosEmpresaTabProps) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await saveDatosEmpresa(formData)

    setLoading(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Datos de la empresa guardados')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="nombre">Nombre de la empresa</Label>
          <Input
            id="nombre"
            name="nombre"
            defaultValue={datos?.nombre ?? ''}
            placeholder="AGROINSUMOS SAS"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nit">NIT</Label>
          <Input
            id="nit"
            name="nit"
            defaultValue={datos?.nit ?? ''}
            placeholder="836 000 548 - 7"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            name="telefono"
            defaultValue={datos?.telefono ?? ''}
            placeholder="(602) 214 99 10"
          />
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="direccion">Dirección</Label>
          <Input
            id="direccion"
            name="direccion"
            defaultValue={datos?.direccion ?? ''}
            placeholder="Calle 13 # 56-20 barrio villa Daniel - Zaragoza"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ciudad">Ciudad</Label>
          <Input
            id="ciudad"
            name="ciudad"
            defaultValue={datos?.ciudad ?? ''}
            placeholder="Cartago - Valle"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="correo">Correo electrónico</Label>
          <Input
            id="correo"
            name="correo"
            type="email"
            defaultValue={datos?.correo ?? ''}
            placeholder="f.electronica@agroinsumossa.com"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="bg-[#6ab04c] hover:bg-[#4a8a35] text-white"
      >
        <Save className="mr-2 h-4 w-4" />
        {loading ? 'Guardando...' : 'Guardar datos'}
      </Button>
    </form>
  )
}
