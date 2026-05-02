'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/supabase/types'
import { formatDateTime } from '@/lib/utils'

interface NotificationBellProps {
  userId: string
  role: string
}

export default function NotificationBell({ userId, role }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const unread = notifications.filter(n => !n.read).length

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${userId},role.eq.${role}`)
      .order('created_at', { ascending: false })
      .limit(30)
    if (data) setNotifications(data as Notification[])
  }

  async function markAllRead() {
    await supabase
      .from('notifications')
      .update({ read: true })
      .or(`user_id.eq.${userId},role.eq.${role}`)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        payload => {
          const n = payload.new as Notification
          if (n.user_id === userId || n.role === role) {
            setNotifications(prev => [n, ...prev])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, role])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function typeIcon(type: Notification['type']) {
    switch (type) {
      case 'new_lead': return '🆕'
      case 'followup': return '📞'
      case 'paid': return '💳'
      case 'document': return '📄'
      case 'status_change': return '🔄'
      default: return '🔔'
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h3 className="text-white font-semibold text-sm">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                No notifications
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`px-4 py-3 border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/50 transition-colors ${
                    !n.read ? 'bg-blue-500/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{typeIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!n.read ? 'text-white' : 'text-slate-300'}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatDateTime(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
