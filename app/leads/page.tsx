import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AllLeadsClient from './AllLeadsClient'
import type { Enquiry, UserRole } from '@/lib/supabase/types'

export default async function AllLeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? 'sales') as UserRole
  if (role === 'operations') redirect('/pipeline/operations')

  const { data: leads = [] } = await supabase
    .from('enquiries')
    .select('*')
    .order('submitted_at', { ascending: false })

  return <AllLeadsClient initialLeads={(leads ?? []) as Enquiry[]} role={role} />
}
