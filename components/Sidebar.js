'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import { LayoutDashboard, Receipt, BarChart3, HandCoins, LogOut } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/analytics', label: 'Reports', icon: BarChart3 },
  { href: '/lending', label: 'People', icon: HandCoins },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { connected } = useSocket() || {}
  const pathname = usePathname()

  if (!user) return null

  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 hidden lg:flex flex-col z-40 overflow-hidden bg-card border-r border-line">
      <div className="flex flex-col h-full">

        {/* Logo */}
        <div className="px-6 pt-7 pb-6">
          <Link href="/dashboard" className="flex items-center gap-3 group w-fit">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30 group-hover:scale-105 transition-all duration-200">
              <span className="font-display font-extrabold text-lg text-white leading-none">M</span>
            </div>
            <span className="gradient-text text-lg leading-none block">MoneyJot</span>
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-line mb-5" />

        {/* Nav label */}
        <div className="px-5 mb-2">
          <span className="text-[10px] font-semibold text-ink-faint uppercase tracking-widest">Navigation</span>
        </div>

        {/* Navigation */}
        <nav className="px-3 flex-1 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'text-accent bg-accent/12 border border-accent/25'
                    : 'text-ink-muted hover:text-ink hover:bg-cream'
                }`}
              >
                {/* Icon box */}
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-all duration-200 ${
                  active
                    ? 'bg-accent/15 text-accent'
                    : 'bg-cream text-ink-muted group-hover:text-accent'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                <p className="leading-none">{label}</p>
              </Link>
            )
          })}
        </nav>

        {/* Live indicator */}
        <div className="px-5 py-3">
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border w-fit transition-all ${
            connected
              ? 'text-success border-success/25 bg-success/10'
              : 'text-ink-faint border-line bg-cream'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              connected ? 'bg-success animate-pulse' : 'bg-ink-faint'
            }`} />
            <span className="font-medium">{connected ? 'Live sync on' : 'Offline mode'}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-line" />

        {/* User card + logout */}
        <div className="p-4 pb-6">
          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-cream border border-line mb-2">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink truncate leading-snug">{user.name}</p>
              <p className="text-[11px] text-ink-faint truncate leading-snug">{user.email}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/25 transition-all duration-200 group"
          >
            <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
