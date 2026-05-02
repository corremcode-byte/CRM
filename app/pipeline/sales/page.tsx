import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SalesPipelineClient from './SalesPipelineClient'
import type { Enquiry, UserRole } from '@/lib/supabase/types'

export default async function SalesPipelinePage() {
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

  const { data: agents = [] } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('role', ['sales', 'admin'])

  return (
    <SalesPipelineClient
      initialLeads={(leads ?? []) as Enquiry[]}
      agents={agents ?? []}
      currentUserId={user.id}
      role={role}
    />
  )
}
