'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Enquiry, UserRole } from '@/lib/supabase/types'
import { getLeadName, getLeadCountry, priorityColor, statusColor, formatDateTime, SALES_STAGES } from '@/lib/utils'

interface Props {
  initialLeads: Enquiry[]
  role: UserRole
}

export default function AllLeadsClient({ initialLeads }: Props) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [sortBy, setSortBy] = useState<'submitted_at' | 'lead_score' | 'next_followup_at'>('submitted_at')

  const filtered = useMemo(() => {
    let list = [...initialLeads]
    const q = search.toLowerCase()
    if (q) {
      list = list.filter(l =>
        getLeadName(l).toLowerCase().includes(q) ||
        (l.phone ?? '').includes(q) ||
        getLeadCountry(l).toLowerCase().includes(q) ||
        (l.email ?? '').toLowerCase().includes(q)
      )
    }
    if (filterStatus) list = list.filter(l => l.sales_status === filterStatus)
    if (filterPriority) list = list.filter(l => l.urgency === filterPriority)
    if (filterSource) list = list.filter(l => l.source === filterSource)
    list.sort((a, b) => {
      if (sortBy === 'lead_score') return (b.lead_score ?? 0) - (a.lead_score ?? 0)
      if (sortBy === 'next_followup_at') {
        if (!a.next_followup_at) return 1
        if (!b.next_followup_at) return -1
        return new Date(a.next_followup_at).getTime() - new Date(b.next_followup_at).getTime()
      }
      return new Date(b.submitted_at ?? 0).getTime() - new Date(a.submitted_at ?? 0).getTime()
    })
    return list
  }, [initialLeads, search, filterStatus, filterPriority, filterSource, sortBy])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">All Leads</h1>
          <p className="text-slate-400 text-sm mt-0.5">{filtered.length} of {initialLeads.length} leads</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, phone, email…"
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All statuses</option>
          {SALES_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All priorities</option>
          <option value="High">🔴 High</option>
          <option value="Medium">🟡 Medium</option>
          <option value="Low">🟢 Low</option>
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All sources</option>
          {['Instagram', 'Website', 'Referral', 'Walk-in', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="submitted_at">Sort: Newest</option>
          <option value="lead_score">Sort: Lead Score</option>
          <option value="next_followup_at">Sort: Follow-up Date</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Lead</th>
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Contact</th>
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Country / Visa</th>
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Priority</th>
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Score</th>
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Source</th>
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Submitted</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">No leads match your filters</td>
                </tr>
              ) : (
                filtered.map(lead => (
                  <tr key={lead.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-white font-medium">{getLeadName(lead)}</p>
                      {lead.city && <p className="text-slate-500 text-xs">{lead.city}</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-300">
                      <p>{lead.phone ?? '—'}</p>
                      {lead.email && <p className="text-slate-500 text-xs">{lead.email}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-slate-300">{getLeadCountry(lead)}</p>
                      <p className="text-slate-500 text-xs">{lead.visa_type ?? '—'}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(lead.sales_status)}`}>
                        {lead.sales_status ?? 'New Lead'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityColor(lead.urgency)}`}>
                        {lead.urgency ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-300 font-mono">{lead.lead_score ?? 0}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{lead.source ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{formatDateTime(lead.submitted_at)}</td>
                    <td className="px-5 py-3">
                      <Link href={`/leads/${lead.id}`} className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                        Open
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
