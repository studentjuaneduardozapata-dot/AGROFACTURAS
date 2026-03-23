import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Topbar } from '@/components/topbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <AppSidebar userEmail={user.email} />
      <SidebarInset>
        <Topbar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
