import type { Enquiry } from '@/lib/supabase/types'

export function getLeadName(lead: Enquiry): string {
  return lead.full_name || lead.name || 'Unknown'
}

export function getLeadCountry(lead: Enquiry): string {
  return lead.country || lead.destination || '—'
}

export function priorityColor(urgency?: string | null): string {
  switch (urgency) {
    case 'High': return 'text-red-400 bg-red-400/10'
    case 'Medium': return 'text-amber-400 bg-amber-400/10'
    case 'Low': return 'text-green-400 bg-green-400/10'
    default: return 'text-slate-400 bg-slate-400/10'
  }
}

export function temperatureColor(temp?: string | null): string {
  switch (temp) {
    case 'hot': return 'text-red-400 bg-red-400/10'
    case 'warm': return 'text-amber-400 bg-amber-400/10'
    case 'cold': return 'text-blue-400 bg-blue-400/10'
    default: return 'text-slate-400 bg-slate-400/10'
  }
}

export function statusColor(status?: string | null): string {
  switch (status) {
    case 'New Lead': return 'bg-slate-500/20 text-slate-300'
    case 'Attempted Contact': return 'bg-yellow-500/20 text-yellow-300'
    case 'Connected': return 'bg-cyan-500/20 text-cyan-300'
    case 'Interested': return 'bg-green-500/20 text-green-300'
    case 'Not Interested': return 'bg-red-500/20 text-red-300'
    case 'Follow-up': return 'bg-orange-500/20 text-orange-300'
    case 'Qualified': return 'bg-blue-500/20 text-blue-300'
    case 'Payment Pending': return 'bg-purple-500/20 text-purple-300'
    case 'Paid': return 'bg-emerald-500/20 text-emerald-300'
    // Ops
    case 'Docs Pending': return 'bg-slate-500/20 text-slate-300'
    case 'Docs Received': return 'bg-yellow-500/20 text-yellow-300'
    case 'Docs Verified': return 'bg-cyan-500/20 text-cyan-300'
    case 'Application Filed': return 'bg-blue-500/20 text-blue-300'
    case 'Embassy Processing': return 'bg-purple-500/20 text-purple-300'
    case 'Approved': return 'bg-emerald-500/20 text-emerald-300'
    case 'Rejected': return 'bg-red-500/20 text-red-300'
    case 'Closed': return 'bg-slate-400/20 text-slate-400'
    default: return 'bg-slate-500/20 text-slate-300'
  }
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export const SALES_STAGES = [
  'New Lead',
  'Attempted Contact',
  'Follow-up',
  'Interested',
] as const

export const OPS_STAGES = [
  'Docs Pending',
  'Docs Received',
  'Docs Verified',
  'Application Filed',
  'Embassy Processing',
  'Approved',
  'Rejected',
  'Closed',
] as const

export const DEFAULT_DOCUMENTS = [
  { name: 'Passport', required: true, uploaded: false, file_url: null },
  { name: 'Bank Statement', required: true, uploaded: false, file_url: null },
  { name: 'ITR (Last 2 Years)', required: true, uploaded: false, file_url: null },
  { name: 'Cover Letter', required: false, uploaded: false, file_url: null },
  { name: 'Photos (2x2 inch)', required: true, uploaded: false, file_url: null },
  { name: 'Travel Insurance', required: false, uploaded: false, file_url: null },
]
