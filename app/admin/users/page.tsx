import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserManagementClient from './UserManagementClient'
import type { Profile } from '@/lib/supabase/types'

export default async function UserManagementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: users = [] } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return <UserManagementClient users={(users ?? []) as Profile[]} currentUserId={user.id} />
}
