import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OperationsPipelineClient from './OperationsPipelineClient'
import type { Enquiry, UserRole } from '@/lib/supabase/types'

export default async function OperationsPipelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? 'sales') as UserRole
  if (role === 'sales') redirect('/pipeline/sales')

  const { data: leads = [] } = await supabase
    .from('enquiries')
    .select('*')
    .eq('payment_status', 'Paid')
    .order('submitted_at', { ascending: false })

  const { data: caseManagers = [] } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('role', ['operations', 'admin'])

  return (
    <OperationsPipelineClient
      initialLeads={(leads ?? []) as Enquiry[]}
      caseManagers={caseManagers ?? []}
      role={role}
    />
  )
}
