'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Enquiry, UserRole, SalesStatus, OpsStatus, Document } from '@/lib/supabase/types'
import {
  SALES_STAGES, OPS_STAGES, DEFAULT_DOCUMENTS,
  getLeadName, getLeadCountry, temperatureColor, statusColor, formatDateTime
} from '@/lib/utils'

interface Agent { id: string; full_name?: string | null; email?: string | null }

interface Props {
  lead: Enquiry
  role: UserRole
  currentUserId: string
  salesAgents: Agent[]
  caseManagers: Agent[]
}

export default function LeadDetailClient({ lead: initial, role, currentUserId, salesAgents, caseManagers }: Props) {
  const [lead, setLead] = useState<Enquiry>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'sales' | 'ops' | 'docs'>('info')
  const supabase = createClient()
  const router = useRouter()

  const isAdmin = role === 'admin'
  const isSales = role === 'sales' || role === 'admin'
  const isOps = role === 'operations' || role === 'admin'

  function update<K extends keyof Enquiry>(field: K, value: Enquiry[K]) {
    setLead(prev => ({ ...prev, [field]: value }))
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from('enquiries')
      .update(lead)
      .eq('id', lead.id)
    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    } else {
      alert('Save failed: ' + error.message)
    }
  }

  function toggleDoc(index: number) {
    const docs = [...(lead.documents ?? DEFAULT_DOCUMENTS)] as Document[]
    docs[index] = { ...docs[index], uploaded: !docs[index].uploaded }
    update('documents', docs)
  }

  const documents = (lead.documents && lead.documents.length > 0)
    ? lead.documents
    : DEFAULT_DOCUMENTS

  const tabs = [
    { id: 'info', label: 'Basic Info' },
    ...(isSales ? [{ id: 'sales', label: 'Sales & Qualification' }] : []),
    ...(isOps ? [{ id: 'ops', label: 'Operations' }] : []),
    { id: 'docs', label: `Documents (${documents.filter(d => d.uploaded).length}/${documents.length})` },
  ] as { id: typeof activeTab; label: string }[]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-white text-sm mb-2 flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">{getLeadName(lead)}</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {getLeadCountry(lead)} · {lead.visa_type ?? 'Visa'} · {lead.phone ?? '—'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${temperatureColor(lead.lead_temperature)}`}>
            {lead.lead_temperature ?? 'cold'} ({lead.lead_score ?? 0} pts)
          </span>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-wrap gap-4">
        {isSales && (
          <div>
            <p className="text-slate-400 text-xs mb-1">Sales Status</p>
            <select
              value={lead.sales_status ?? 'New Lead'}
              onChange={e => update('sales_status', e.target.value as SalesStatus)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SALES_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        {isSales && (
          <div>
            <p className="text-slate-400 text-xs mb-1">Payment Status</p>
            <select
              value={lead.payment_status ?? 'Pending'}
              onChange={e => update('payment_status', e.target.value as 'Pending' | 'Partial' | 'Paid')}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {['Pending', 'Partial', 'Paid'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        {isOps && lead.payment_status === 'Paid' && (
          <div>
            <p className="text-slate-400 text-xs mb-1">Ops Status</p>
            <select
              value={lead.ops_status ?? 'Docs Pending'}
              onChange={e => update('ops_status', e.target.value as OpsStatus)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {OPS_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        <div className="ml-auto text-right">
          <p className="text-slate-500 text-xs">Submitted</p>
          <p className="text-slate-300 text-xs">{formatDateTime(lead.submitted_at)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <div className="flex gap-0.5">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === t.id
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Basic Info */}
      {activeTab === 'info' && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-lg">Lead Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name">
              <input value={lead.full_name ?? lead.name ?? ''} onChange={e => update('full_name', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Phone">
              <input value={lead.phone ?? ''} onChange={e => update('phone', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Email">
              <input type="email" value={lead.email ?? ''} onChange={e => update('email', e.target.value)} className={inputClass} />
            </Field>
            <Field label="City">
              <input value={lead.city ?? ''} onChange={e => update('city', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Source">
              <select value={lead.source ?? 'Website'} onChange={e => update('source', e.target.value as Enquiry['source'])} className={selectClass}>
                {['Instagram', 'Website', 'Referral', 'Walk-in', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Destination Country">
              <input value={lead.country ?? lead.destination ?? ''} onChange={e => update('country', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Visa Type">
              <select value={lead.visa_type ?? ''} onChange={e => update('visa_type', e.target.value as Enquiry['visa_type'])} className={selectClass}>
                <option value="">Select type</option>
                {['Tourist', 'Student', 'PR', 'Business', 'Medical', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Travel Date">
              <input type="date" value={lead.travel_date ?? ''} onChange={e => update('travel_date', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Number of Travelers">
              <input type="number" min="1" value={lead.num_travelers ?? 1} onChange={e => update('num_travelers', parseInt(e.target.value) || 1)} className={inputClass} />
            </Field>
          </div>
        </div>
      )}

      {/* Tab: Sales & Qualification */}
      {activeTab === 'sales' && isSales && (
        <div className="space-y-4">
          {/* Lead score display */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Lead Score (auto-calculated)</h2>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-white">{lead.lead_score ?? 0}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize ${temperatureColor(lead.lead_temperature)}`}>
                  {lead.lead_temperature ?? 'cold'}
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p>Score is recalculated automatically on save based on budget, travel history, urgency, rejection history, and travelers.</p>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
            <h2 className="text-white font-semibold">Qualification</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Budget Range">
                <select value={lead.budget_range ?? ''} onChange={e => update('budget_range', e.target.value as Enquiry['budget_range'])} className={selectClass}>
                  <option value="">Select range</option>
                  {['Low', 'Medium', 'High'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Urgency">
                <select value={lead.urgency ?? 'Medium'} onChange={e => update('urgency', e.target.value as Enquiry['urgency'])} className={selectClass}>
                  {['High', 'Medium', 'Low'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Has Travel History">
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input type="checkbox" checked={lead.has_travel_history ?? false} onChange={e => update('has_travel_history', e.target.checked)} className="w-4 h-4 rounded accent-blue-500" />
                  <span className="text-slate-300 text-sm">Yes, has traveled internationally</span>
                </label>
              </Field>
              <Field label="Previous Visa Rejection">
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input type="checkbox" checked={lead.previous_rejection ?? false} onChange={e => update('previous_rejection', e.target.checked)} className="w-4 h-4 rounded accent-red-500" />
                  <span className="text-slate-300 text-sm">Yes, previously rejected</span>
                </label>
              </Field>
              <Field label="Travel History Notes" className="sm:col-span-2">
                <textarea value={lead.travel_history_notes ?? ''} onChange={e => update('travel_history_notes', e.target.value)} rows={2} className={textareaClass} placeholder="Previous countries visited, visas held…" />
              </Field>
              <Field label="Rejection Notes" className="sm:col-span-2">
                <textarea value={lead.rejection_notes ?? ''} onChange={e => update('rejection_notes', e.target.value)} rows={2} className={textareaClass} placeholder="Details of previous rejection…" />
              </Field>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
            <h2 className="text-white font-semibold">Sales Activity</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Assigned Sales Agent">
                <select value={lead.assigned_sales_agent ?? ''} onChange={e => update('assigned_sales_agent', e.target.value)} className={selectClass}>
                  <option value="">Unassigned</option>
                  {salesAgents.map(a => <option key={a.id} value={a.id}>{a.full_name ?? a.email}</option>)}
                </select>
              </Field>
              <Field label="Last Contacted">
                <input type="datetime-local" value={toInputDatetime(lead.last_contacted_at)} onChange={e => update('last_contacted_at', e.target.value ? new Date(e.target.value).toISOString() : null)} className={inputClass} />
              </Field>
              <Field label="Next Follow-up">
                <input type="datetime-local" value={toInputDatetime(lead.next_followup_at)} onChange={e => update('next_followup_at', e.target.value ? new Date(e.target.value).toISOString() : null)} className={inputClass} />
              </Field>
              <Field label="Call Notes" className="sm:col-span-2">
                <textarea value={lead.call_notes ?? ''} onChange={e => update('call_notes', e.target.value)} rows={3} className={textareaClass} placeholder="Notes from calls, WhatsApp chats…" />
              </Field>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
            <h2 className="text-white font-semibold">Conversion</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Package Selected">
                <input value={lead.package_selected ?? ''} onChange={e => update('package_selected', e.target.value)} className={inputClass} placeholder="Package name / description" />
              </Field>
              <Field label="Amount (₹)">
                <input type="number" value={lead.amount ?? ''} onChange={e => update('amount', e.target.value ? parseFloat(e.target.value) : null)} className={inputClass} placeholder="0.00" />
              </Field>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Operations */}
      {activeTab === 'ops' && isOps && (
        lead.payment_status !== 'Paid' ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
            <p className="text-slate-400">Operations fields are only available for Paid leads.</p>
            {isSales && (
              <p className="text-slate-500 text-sm mt-2">Change payment status to "Paid" in the Sales tab to unlock operations.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
              <h2 className="text-white font-semibold">Case Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Assigned Case Manager">
                  <select value={lead.assigned_case_manager ?? ''} onChange={e => update('assigned_case_manager', e.target.value)} className={selectClass}>
                    <option value="">Unassigned</option>
                    {caseManagers.map(m => <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>)}
                  </select>
                </Field>
                <Field label="Application ID">
                  <input value={lead.application_id ?? ''} onChange={e => update('application_id', e.target.value)} className={inputClass} placeholder="APP-2024-XXXX" />
                </Field>
                <Field label="Embassy Name">
                  <input value={lead.embassy_name ?? ''} onChange={e => update('embassy_name', e.target.value)} className={inputClass} placeholder="Embassy of France, New Delhi" />
                </Field>
                <Field label="Submission Date">
                  <input type="date" value={lead.submission_date ?? ''} onChange={e => update('submission_date', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Expected Decision Date">
                  <input type="date" value={lead.expected_decision_date ?? ''} onChange={e => update('expected_decision_date', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Document Status">
                  <input value={lead.document_status ?? ''} onChange={e => update('document_status', e.target.value)} className={inputClass} placeholder="e.g. All documents received" />
                </Field>
                <Field label="Missing Documents" className="sm:col-span-2">
                  <textarea value={lead.missing_documents ?? ''} onChange={e => update('missing_documents', e.target.value)} rows={2} className={textareaClass} placeholder="List any missing documents…" />
                </Field>
              </div>
            </div>
          </div>
        )
      )}

      {/* Tab: Documents */}
      {activeTab === 'docs' && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold">Document Checklist</h2>
            <span className="text-slate-400 text-sm">
              {documents.filter(d => d.uploaded).length} / {documents.length} uploaded
            </span>
          </div>
          <div className="space-y-2">
            {documents.map((doc, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 p-3.5 rounded-lg border transition-colors ${
                  doc.uploaded ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-700/30 border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={doc.uploaded}
                  onChange={() => toggleDoc(i)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
                <div className="flex-1">
                  <span className={`text-sm font-medium ${doc.uploaded ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {doc.name}
                  </span>
                  {doc.required && !doc.uploaded && (
                    <span className="ml-2 text-[10px] text-red-400 font-medium uppercase">Required</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {doc.uploaded ? (
                    <span className="text-emerald-400 text-xs font-medium">✓ Received</span>
                  ) : (
                    <span className="text-slate-500 text-xs">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add custom document */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <AddDocumentForm
              onAdd={(name) => {
                const current = [...documents] as Document[]
                current.push({ name, required: false, uploaded: false, file_url: null })
                update('documents', current)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function AddDocumentForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <div className="flex gap-2">
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Add custom document…"
        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onKeyDown={e => {
          if (e.key === 'Enter' && name.trim()) {
            onAdd(name.trim())
            setName('')
          }
        }}
      />
      <button
        onClick={() => { if (name.trim()) { onAdd(name.trim()); setName('') } }}
        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
      >
        Add
      </button>
    </div>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function toInputDatetime(isoString?: string | null): string {
  if (!isoString) return ''
  const d = new Date(isoString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const inputClass = 'w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
const selectClass = 'w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
const textareaClass = 'w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
