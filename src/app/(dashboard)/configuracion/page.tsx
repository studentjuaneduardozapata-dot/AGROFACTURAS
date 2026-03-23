import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCentrosCosto, getConfiguracion } from '@/lib/actions/configuracion'
import { CentrosCostoTab } from './_components/centros-costo-tab'
import { DatosEmpresaTab } from './_components/datos-empresa-tab'
import { SolicitanteTab } from './_components/solicitante-tab'
import type { DatosEmpresa, SolicitanteDefault, AutorizadorDefault } from '@/lib/supabase/types'

export default async function ConfiguracionPage() {
  // Cargar datos en paralelo (Server Component)
  const [centros, datosEmpresa, solicitante, autorizador] = await Promise.all([
    getCentrosCosto(),
    getConfiguracion('datos_empresa'),
    getConfiguracion('solicitante_default'),
    getConfiguracion('autorizador_default'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground">
          Administra centros de costo, datos de la empresa y configuraciones del sistema
        </p>
      </div>

      <Tabs defaultValue="centros" className="space-y-4">
        <TabsList>
          <TabsTrigger value="centros">Centros de Costo</TabsTrigger>
          <TabsTrigger value="empresa">Datos Empresa</TabsTrigger>
          <TabsTrigger value="solicitante">Solicitante / Autorizador</TabsTrigger>
        </TabsList>

        <TabsContent value="centros" className="space-y-4">
          <CentrosCostoTab centros={centros} />
        </TabsContent>

        <TabsContent value="empresa" className="space-y-4">
          <DatosEmpresaTab datos={datosEmpresa as DatosEmpresa | null} />
        </TabsContent>

        <TabsContent value="solicitante" className="space-y-4">
          <SolicitanteTab
            solicitante={solicitante as SolicitanteDefault | null}
            autorizador={autorizador as AutorizadorDefault | null}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
