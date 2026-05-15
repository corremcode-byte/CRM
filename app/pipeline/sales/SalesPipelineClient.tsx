'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Enquiry, SalesStatus, UserRole } from '@/lib/supabase/types'
import { SALES_STAGES, getLeadName, getLeadCountry, temperatureColor, formatDate } from '@/lib/utils'

interface Props {
  initialLeads: Enquiry[]
  agents: { id: string; full_name?: string | null; email?: string | null }[]
  currentUserId: string
  role: UserRole
}

type ViewMode = 'kanban' | 'list'

export default function SalesPipelineClient({ initialLeads, agents, role }: Props) {
  const [leads, setLeads] = useState(initialLeads)
  const [view, setView] = useState<ViewMode>('kanban')
  const [search, setSearch] = useState('')
  const [filterAgent, setFilterAgent] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const supabase = createClient()

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const name = getLeadName(l).toLowerCase()
      const phone = (l.phone ?? '').toLowerCase()
      const country = getLeadCountry(l).toLowerCase()
      const q = search.toLowerCase()
      const matchSearch = !q || name.includes(q) || phone.includes(q) || country.includes(q)
      const matchAgent = !filterAgent || l.assigned_sales_agent === filterAgent
      const matchPriority = !filterPriority || l.urgency === filterPriority
      return matchSearch && matchAgent && matchPriority
    })
  }, [leads, search, filterAgent, filterPriority])

  async function updateStatus(leadId: string, newStatus: SalesStatus) {
    const { error } = await supabase
      .from('enquiries')
      .update({ sales_status: newStatus })
      .eq('id', leadId)
    if (!error) {
      setLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, sales_status: newStatus } : l
      ))
    }
  }

  async function moveToOperations(leadId: string) {
    const { error } = await supabase
      .from('enquiries')
      .update({ sales_status: 'Moved to Operations' })
      .eq('id', leadId)
    if (!error) {
      setLeads(prev => prev.filter(l => l.id !== leadId))
    }
  }

  async function assignAgent(leadId: string, agentId: string) {
    const { error } = await supabase
      .from('enquiries')
      .update({ assigned_sales_agent: agentId })
      .eq('id', leadId)
    if (!error) {
      setLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, assigned_sales_agent: agentId } : l
      ))
    }
  }

  const byStage = useMemo(() => {
    const map: Record<string, Enquiry[]> = {}
    SALES_STAGES.forEach(s => { map[s] = [] })
    filtered.forEach(l => {
      const s = l.sales_status ?? 'New Lead'
      if (map[s]) map[s].push(l)
      else map['New Lead'].push(l)
    })
    return map
  }, [filtered])

  return (
    <div className="space-y-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales Pipeline</h1>
          <p className="text-slate-400 text-sm mt-0.5">{filtered.length} leads</p>
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

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, phone, country…"
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All priorities</option>
          <option value="High">🔴 High</option>
          <option value="Medium">🟡 Medium</option>
          <option value="Low">🟢 Low</option>
        </select>
        {role === 'admin' && agents.length > 0 && (
          <select
            value={filterAgent}
            onChange={e => setFilterAgent(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All agents</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.full_name ?? a.email}</option>
            ))}
          </select>
        )}
      </div>

      {/* KANBAN VIEW */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {SALES_STAGES.map(stage => (
            <div key={stage} className="shrink-0 w-64">
              <div className={`flex items-center justify-between mb-2 px-1`}>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{stage}</h3>
                <span className="text-xs bg-slate-700 text-slate-400 rounded-full px-2 py-0.5">
                  {byStage[stage]?.length ?? 0}
                </span>
              </div>
              <div className="space-y-2 min-h-20">
                {byStage[stage]?.map(lead => (
                  <KanbanCard
                    key={lead.id}
                    lead={lead}
                    agents={agents}
                    stages={SALES_STAGES as unknown as SalesStatus[]}
                    onStatusChange={updateStatus}
                    onAssignAgent={assignAgent}
                    onMoveToOps={moveToOperations}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Lead</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Country</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Temp</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Score</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Follow-up</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Agent</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => {
                  const agent = agents.find(a => a.id === lead.assigned_sales_agent)
                  return (
                    <tr key={lead.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-white font-medium">{getLeadName(lead)}</p>
                        <p className="text-slate-500 text-xs">{lead.phone}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-300">{getLeadCountry(lead)}</td>
                      <td className="px-5 py-3">
                        <select
                          value={lead.sales_status ?? 'New Lead'}
                          onChange={e => updateStatus(lead.id, e.target.value as SalesStatus)}
                          className="bg-slate-700 border border-slate-600 rounded text-xs px-2 py-1 text-slate-200"
                        >
                          {SALES_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${temperatureColor(lead.lead_temperature)}`}>
                          {lead.lead_temperature ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-300 font-mono">{lead.lead_score ?? 0}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{formatDate(lead.next_followup_at)}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">
                        {agent ? (agent.full_name ?? agent.email) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/leads/${lead.id}`} className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                            View
                          </Link>
                          <button
                            onClick={() => moveToOperations(lead.id)}
                            className="text-xs font-medium px-2 py-1 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/30 transition-colors whitespace-nowrap"
                          >
                            Move to Ops →
                          </button>
                        </div>
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

function KanbanCard({
  lead,
  agents,
  stages,
  onStatusChange,
  onAssignAgent,
  onMoveToOps,
}: {
  lead: Enquiry
  agents: { id: string; full_name?: string | null; email?: string | null }[]
  stages: SalesStatus[]
  onStatusChange: (id: string, status: SalesStatus) => void
  onAssignAgent: (id: string, agentId: string) => void
  onMoveToOps: (id: string) => void
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <Link href={`/leads/${lead.id}`} className="text-white text-xs font-semibold hover:text-blue-400 line-clamp-1">
          {getLeadName(lead)}
        </Link>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${temperatureColor(lead.lead_temperature)}`}>
          {lead.lead_temperature ?? '?'}
        </span>
      </div>
      <p className="text-slate-400 text-[11px] mb-2">{getLeadCountry(lead)} · {lead.visa_type ?? 'Visa'}</p>
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>Score: {lead.lead_score ?? 0}</span>
        <span>{formatDate(lead.next_followup_at)}</span>
      </div>
      {/* Stage dropdown */}
      <select
        value={lead.sales_status ?? 'New Lead'}
        onChange={e => onStatusChange(lead.id, e.target.value as SalesStatus)}
        onClick={e => e.stopPropagation()}
        className="mt-2 w-full bg-slate-700 border border-slate-600 rounded text-[11px] px-1.5 py-1 text-slate-300"
      >
        {stages.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      {agents.length > 0 && (
        <select
          value={lead.assigned_sales_agent ?? ''}
          onChange={e => onAssignAgent(lead.id, e.target.value)}
          onClick={e => e.stopPropagation()}
          className="mt-1 w-full bg-slate-700 border border-slate-600 rounded text-[11px] px-1.5 py-1 text-slate-300"
        >
          <option value="">Unassigned</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>{a.full_name ?? a.email}</option>
          ))}
        </select>
      )}
      {/* Move to Operations */}
      <button
        onClick={e => { e.stopPropagation(); onMoveToOps(lead.id) }}
        className="mt-2 w-full bg-emerald-600/20 border border-emerald-600/40 rounded text-[11px] px-1.5 py-1 text-emerald-400 hover:bg-emerald-600/30 transition-colors font-medium"
      >
        Move to Operations →
      </button>
    </div>
  )
}
