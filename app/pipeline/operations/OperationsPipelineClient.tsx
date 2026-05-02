'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Enquiry, OpsStatus, UserRole } from '@/lib/supabase/types'
import { OPS_STAGES, getLeadName, getLeadCountry, statusColor, formatDate } from '@/lib/utils'

interface Props {
  initialLeads: Enquiry[]
  caseManagers: { id: string; full_name?: string | null; email?: string | null }[]
  role: UserRole
}

export default function OperationsPipelineClient({ initialLeads, caseManagers, role }: Props) {
  const [leads, setLeads] = useState(initialLeads)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const supabase = createClient()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return leads.filter(l => {
      if (!q) return true
      return (
        getLeadName(l).toLowerCase().includes(q) ||
        (l.phone ?? '').includes(q) ||
        getLeadCountry(l).toLowerCase().includes(q) ||
        (l.application_id ?? '').toLowerCase().includes(q)
      )
    })
  }, [leads, search])

  async function updateOpsStatus(leadId: string, newStatus: OpsStatus) {
    const { error } = await supabase
      .from('enquiries')
      .update({ ops_status: newStatus })
      .eq('id', leadId)
    if (!error) {
      setLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, ops_status: newStatus } : l
      ))
    }
  }

  async function assignManager(leadId: string, managerId: string) {
    const { error } = await supabase
      .from('enquiries')
      .update({ assigned_case_manager: managerId })
      .eq('id', leadId)
    if (!error) {
      setLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, assigned_case_manager: managerId } : l
      ))
    }
  }

  const byStage = useMemo(() => {
    const map: Record<string, Enquiry[]> = {}
    OPS_STAGES.forEach(s => { map[s] = [] })
    filtered.forEach(l => {
      const s = l.ops_status ?? 'Docs Pending'
      if (map[s]) map[s].push(l)
      else map['Docs Pending'].push(l)
    })
    return map
  }, [filtered])

  // Stage color accent for ops
  const stageAccent: Record<string, string> = {
    'Docs Pending': 'border-t-slate-500',
    'Docs Received': 'border-t-yellow-500',
    'Docs Verified': 'border-t-cyan-500',
    'Application Filed': 'border-t-blue-500',
    'Embassy Processing': 'border-t-purple-500',
    'Approved': 'border-t-emerald-500',
    'Rejected': 'border-t-red-500',
    'Closed': 'border-t-slate-400',
  }

  return (
    <div className="space-y-5 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Operations Pipeline</h1>
          <p className="text-slate-400 text-sm mt-0.5">{filtered.length} active cases (Paid leads only)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('kanban')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${view === 'kanban' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            Kanban
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            List
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, phone, application ID…"
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
        />
      </div>

      {/* KANBAN */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {OPS_STAGES.map(stage => (
            <div key={stage} className="shrink-0 w-64">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{stage}</h3>
                <span className="text-xs bg-slate-700 text-slate-400 rounded-full px-2 py-0.5">
                  {byStage[stage]?.length ?? 0}
                </span>
              </div>
              <div className={`space-y-2 min-h-16 rounded-lg border-t-2 pt-2 ${stageAccent[stage] ?? 'border-t-slate-600'}`}>
                {byStage[stage]?.map(lead => (
                  <OpsCard
                    key={lead.id}
                    lead={lead}
                    caseManagers={caseManagers}
                    stages={OPS_STAGES as unknown as OpsStatus[]}
                    onStatusChange={updateOpsStatus}
                    onAssignManager={assignManager}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIST */}
      {view === 'list' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Applicant</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Country</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Ops Status</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">App ID</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Submission</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Decision</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Case Manager</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => {
                  const mgr = caseManagers.find(c => c.id === lead.assigned_case_manager)
                  return (
                    <tr key={lead.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-white font-medium">{getLeadName(lead)}</p>
                        <p className="text-slate-500 text-xs">{lead.phone}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-300">{getLeadCountry(lead)}</td>
                      <td className="px-5 py-3">
                        <select
                          value={lead.ops_status ?? 'Docs Pending'}
                          onChange={e => updateOpsStatus(lead.id, e.target.value as OpsStatus)}
                          className="bg-slate-700 border border-slate-600 rounded text-xs px-2 py-1 text-slate-200"
                        >
                          {OPS_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs font-mono">{lead.application_id ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{formatDate(lead.submission_date)}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{formatDate(lead.expected_decision_date)}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">
                        {mgr ? (mgr.full_name ?? mgr.email) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <Link href={`/leads/${lead.id}`} className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function OpsCard({
  lead,
  caseManagers,
  stages,
  onStatusChange,
  onAssignManager,
}: {
  lead: Enquiry
  caseManagers: { id: string; full_name?: string | null; email?: string | null }[]
  stages: OpsStatus[]
  onStatusChange: (id: string, status: OpsStatus) => void
  onAssignManager: (id: string, managerId: string) => void
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <Link href={`/leads/${lead.id}`} className="text-white text-xs font-semibold hover:text-blue-400 line-clamp-1">
          {getLeadName(lead)}
        </Link>
      </div>
      <p className="text-slate-400 text-[11px] mb-1">{getLeadCountry(lead)} · {lead.visa_type ?? 'Visa'}</p>
      {lead.application_id && (
        <p className="text-slate-500 text-[11px] font-mono mb-2">ID: {lead.application_id}</p>
      )}
      <div className="text-[11px] text-slate-500 mb-2">
        <div>Submit: {formatDate(lead.submission_date)}</div>
        <div>Decision: {formatDate(lead.expected_decision_date)}</div>
      </div>
      <select
        value={lead.ops_status ?? 'Docs Pending'}
        onChange={e => onStatusChange(lead.id, e.target.value as OpsStatus)}
        className="w-full bg-slate-700 border border-slate-600 rounded text-[11px] px-1.5 py-1 text-slate-300 mb-1"
      >
        {stages.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      {caseManagers.length > 0 && (
        <select
          value={lead.assigned_case_manager ?? ''}
          onChange={e => onAssignManager(lead.id, e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded text-[11px] px-1.5 py-1 text-slate-300"
        >
          <option value="">Unassigned</option>
          {caseManagers.map(m => (
            <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>
          ))}
        </select>
      )}
    </div>
  )
}
