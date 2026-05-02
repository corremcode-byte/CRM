import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Simple security check via secret header
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  )

  const now = new Date()
  const windowEnd = new Date(now.getTime() + 60 * 60 * 1000) // next 1 hour

  const { data: leads } = await supabase
    .from('enquiries')
    .select('id, full_name, name, assigned_sales_agent, next_followup_at')
    .gte('next_followup_at', now.toISOString())
    .lte('next_followup_at', windowEnd.toISOString())

  if (!leads || leads.length === 0) {
    return NextResponse.json({ checked: 0, notified: 0 })
  }

  let notified = 0
  for (const lead of leads) {
    const name = lead.full_name ?? lead.name ?? 'Unknown'
    const followupTime = new Date(lead.next_followup_at).toLocaleString('en-IN')

    const { error } = await supabase.from('notifications').insert({
      user_id: lead.assigned_sales_agent ?? null,
      role: lead.assigned_sales_agent ? null : 'sales',
      title: 'Follow-up Due',
      message: `Follow-up with ${name} is due at ${followupTime}`,
      type: 'followup',
      lead_id: lead.id,
    })
    if (!error) notified++
  }

  return NextResponse.json({ checked: leads.length, notified })
}
