'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, UserRole } from '@/lib/supabase/types'
import { formatDateTime } from '@/lib/utils'

interface Props {
  users: Profile[]
  currentUserId: string
}

const ROLES: UserRole[] = ['admin', 'sales', 'operations']

const roleColors: Record<UserRole, string> = {
  admin: 'bg-purple-500/20 text-purple-300',
  sales: 'bg-blue-500/20 text-blue-300',
  operations: 'bg-emerald-500/20 text-emerald-300',
}

export default function UserManagementClient({ users: initial, currentUserId }: Props) {
  const [users, setUsers] = useState(initial)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('sales')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')
  const supabase = createClient()

  async function updateRole(userId: string, newRole: UserRole) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } else {
      alert('Failed to update role: ' + error.message)
    }
  }

  async function inviteUser() {
    if (!inviteEmail.trim()) return
    setInviteLoading(true)
    setInviteMsg('')
    // Use Supabase Admin API via a route handler
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    })
    const data = await res.json()
    if (res.ok) {
      setInviteMsg('Invitation sent to ' + inviteEmail)
      setInviteEmail('')
    } else {
      setInviteMsg('Error: ' + (data.error ?? 'Unknown error'))
    }
    setInviteLoading(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage team members and their roles</p>
      </div>

      {/* Invite */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Invite New User</h2>
        <div className="flex gap-3 flex-wrap">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="colleague@zenoglobal.in"
            className="flex-1 min-w-48 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value as UserRole)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ROLES.map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
          <button
            onClick={inviteUser}
            disabled={inviteLoading || !inviteEmail.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {inviteLoading ? 'Sending…' : 'Send Invite'}
          </button>
        </div>
        {inviteMsg && (
          <p className={`mt-3 text-sm ${inviteMsg.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
            {inviteMsg}
          </p>
        )}
      </div>

      {/* Users table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">Team Members ({users.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-5 py-3 text-slate-400 font-medium">User</th>
              <th className="text-left px-5 py-3 text-slate-400 font-medium">Email</th>
              <th className="text-left px-5 py-3 text-slate-400 font-medium">Role</th>
              <th className="text-left px-5 py-3 text-slate-400 font-medium">Joined</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-slate-300 text-sm font-medium">
                        {(u.full_name ?? u.email ?? 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{u.full_name ?? '—'}</p>
                      {u.id === currentUserId && (
                        <span className="text-[10px] text-blue-400">(you)</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-300">{u.email ?? '—'}</td>
                <td className="px-5 py-3">
                  {u.id === currentUserId ? (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleColors[u.role]}`}>
                      {u.role}
                    </span>
                  ) : (
                    <select
                      value={u.role}
                      onChange={e => updateRole(u.id, e.target.value as UserRole)}
                      className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-400 text-xs">{formatDateTime(u.created_at)}</td>
                <td className="px-5 py-3">
                  <span className={`w-2 h-2 rounded-full inline-block ${u.id === currentUserId ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
