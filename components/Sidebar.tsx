'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@/lib/supabase/types'

interface SidebarProps {
  role: UserRole
  userName: string
  onClose?: () => void
}

interface NavItem {
  label: string
  href: string
  icon: string
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '▣', roles: ['admin', 'sales', 'operations'] },
  { label: 'Sales Pipeline', href: '/pipeline/sales', icon: '◈', roles: ['admin', 'sales'] },
  { label: 'Operations', href: '/pipeline/operations', icon: '⬡', roles: ['admin', 'operations'] },
  { label: 'All Leads', href: '/leads', icon: '☰', roles: ['admin', 'sales'] },
  { label: 'User Management', href: '/admin/users', icon: '◉', roles: ['admin'] },
]

export default function Sidebar({ role, userName, onClose }: SidebarProps) {
  const pathname = usePathname()
  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role))

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">Z</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm leading-tight">Zeno Global</p>
            <p className="text-slate-400 text-xs">CRM System</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info — no sign out here */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-slate-300 text-sm font-medium">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{userName}</p>
            <p className="text-slate-400 text-xs capitalize">{role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
