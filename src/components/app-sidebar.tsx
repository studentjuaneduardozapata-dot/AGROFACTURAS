'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  Settings,
  LogOut,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { logout } from '@/lib/actions/auth'

const navItems = [
  { href: '/',              label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/facturas',      label: 'Facturas',     icon: FileText },
  { href: '/proveedores',   label: 'Proveedores',  icon: Users },
  { href: '/creditos',      label: 'Créditos',     icon: CreditCard },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
]

interface AppSidebarProps {
  userEmail?: string
}

export function AppSidebar({ userEmail }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar>
      {/* Header con logo */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 relative shrink-0">
            <Image
              src="/logo.svg"
              alt="Logo Agroinsumos"
              fill
              className="object-contain brightness-[10]"
            />
          </div>
          <div>
            <p className="text-sidebar-foreground font-bold text-base leading-tight">FacturIA</p>
            <p className="text-sidebar-foreground/70 text-xs">AGROINSUMOS SAS</p>
          </div>
        </div>
      </SidebarHeader>

      {/* Navegación */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href)

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer con usuario */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
                }
              >
                <div className="w-6 h-6 rounded-full bg-sidebar-accent-foreground/20 flex items-center justify-center text-xs font-bold text-sidebar-foreground shrink-0">
                  {userEmail?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span className="truncate text-xs">{userEmail ?? 'Usuario'}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-48">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => logout()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
