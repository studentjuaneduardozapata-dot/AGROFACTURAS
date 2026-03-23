'use client'

import { usePathname } from 'next/navigation'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

const pageTitles: Record<string, string> = {
  '/':              'Dashboard',
  '/facturas':      'Facturas',
  '/proveedores':   'Proveedores',
  '/creditos':      'Seguimiento de Créditos',
  '/configuracion': 'Configuración',
}

function getPageTitle(pathname: string): string {
  // Buscar coincidencia exacta primero
  if (pageTitles[pathname]) return pageTitles[pathname]
  // Buscar coincidencia por prefijo
  const match = Object.entries(pageTitles)
    .filter(([key]) => key !== '/' && pathname.startsWith(key))
    .sort(([a], [b]) => b.length - a.length)[0]
  return match ? match[1] : 'FacturIA'
}

export function Topbar() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>
    </header>
  )
}
