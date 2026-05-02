import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import LeadDetailClient from './LeadDetailClient'
import type { Enquiry, Profile, UserRole } from '@/lib/supabase/types'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? 'sales') as UserRole

  const { data: lead, error } = await supabase
    .from('enquiries')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !lead) notFound()

  // Ops can only see Paid leads
  if (role === 'operations' && lead.payment_status !== 'Paid') {
    redirect('/pipeline/operations')
  }

  const { data: salesAgents = [] } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('role', ['sales', 'admin'])

  const { data: caseManagers = [] } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('role', ['operations', 'admin'])

  return (
    <LeadDetailClient
      lead={lead as Enquiry}
      role={role}
      currentUserId={user.id}
      salesAgents={salesAgents ?? []}
      caseManagers={caseManagers ?? []}
    />
  )
}
