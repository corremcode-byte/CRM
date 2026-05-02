import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import type { UserRole } from '@/lib/supabase/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? 'sales') as UserRole
  const userName = profile?.full_name ?? user.email ?? 'User'

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role} userName={userName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar userId={user.id} role={role} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
