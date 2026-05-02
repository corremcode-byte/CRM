import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getLeadName, getLeadCountry, temperatureColor, statusColor, formatDateTime } from '@/lib/utils'
import type { Enquiry, UserRole } from '@/lib/supabase/types'

interface StatCardProps {
  label: string
  value: number | string
  sub?: string
  accent?: string
}

function StatCard({ label, value, sub, accent = 'bg-blue-500/10' }: StatCardProps) {
  return (
    <div className={`rounded-xl p-5 border border-slate-700 ${accent}`}>
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? 'sales') as UserRole

  // Fetch leads based on role
  let query = supabase.from('enquiries').select('*').order('submitted_at', { ascending: false })

  if (role === 'operations') {
    query = query.eq('payment_status', 'Paid')
  }

  const { data: leads = [] } = await query
  const allLeads = (leads ?? []) as Enquiry[]

  // Stats
  const totalLeads = allLeads.length
  const hotLeads = allLeads.filter(l => l.lead_temperature === 'hot').length
  const paidLeads = allLeads.filter(l => l.payment_status === 'Paid').length
  const qualifiedLeads = allLeads.filter(l => l.sales_status === 'Qualified').length
  const newToday = allLeads.filter(l => {
    if (!l.submitted_at) return false
    const d = new Date(l.submitted_at)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }).length

  // Recent 10
  const recentLeads = allLeads.slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          {role === 'admin' && 'Full overview — all leads and pipelines'}
          {role === 'sales' && 'Your sales pipeline overview'}
          {role === 'operations' && 'Active operations cases'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={totalLeads} sub="In your view" />
        <StatCard label="Hot Leads" value={hotLeads} accent="bg-red-500/10" sub="Score ≥ 25" />
        <StatCard label="Paid / Converted" value={paidLeads} accent="bg-emerald-500/10" />
        {role !== 'operations' && (
          <StatCard label="Qualified" value={qualifiedLeads} accent="bg-blue-500/10" />
        )}
        {role === 'admin' && (
          <StatCard label="New Today" value={newToday} accent="bg-purple-500/10" />
        )}
      </div>

      {/* Quick links */}
      {role !== 'operations' && (
        <div className="flex gap-3">
          <Link
            href="/pipeline/sales"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Sales Pipeline →
          </Link>
          {role === 'admin' && (
            <Link
              href="/pipeline/operations"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Operations Pipeline →
            </Link>
          )}
        </div>
      )}

      {/* Recent leads table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-white font-semibold">
            {role === 'operations' ? 'Active Cases' : 'Recent Leads'}
          </h2>
          {role !== 'operations' && (
            <Link href="/leads" className="text-blue-400 hover:text-blue-300 text-sm">
              View all →
            </Link>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Name</th>
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Phone</th>
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Country</th>
                {role !== 'operations' && (
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Status</th>
                )}
                {role !== 'operations' && (
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Temp</th>
                )}
                {role === 'operations' && (
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Ops Status</th>
                )}
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Date</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No leads found
                  </td>
                </tr>
              ) : (
                recentLeads.map(lead => (
                  <tr key={lead.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-white font-medium">{getLeadName(lead)}</p>
                      {lead.email && <p className="text-slate-500 text-xs">{lead.email}</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-300">{lead.phone ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-300">{getLeadCountry(lead)}</td>
                    {role !== 'operations' && (
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(lead.sales_status)}`}>
                          {lead.sales_status ?? 'New Lead'}
                        </span>
                      </td>
                    )}
                    {role !== 'operations' && (
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${temperatureColor(lead.lead_temperature)}`}>
                          {lead.lead_temperature ?? '—'}
                        </span>
                      </td>
                    )}
                    {role === 'operations' && (
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(lead.ops_status)}`}>
                          {lead.ops_status ?? 'Docs Pending'}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-3 text-slate-400 text-xs">{formatDateTime(lead.submitted_at)}</td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
