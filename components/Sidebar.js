'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import { LayoutDashboard, Receipt, BarChart3, LogOut, Wallet } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview & stats' },
  { href: '/expenses', label: 'Expenses', icon: Receipt, desc: 'All transactions' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, desc: 'Spending insights' },
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
    <aside className="fixed left-0 top-0 h-screen w-64 hidden lg:flex flex-col z-40 overflow-hidden">
      {/* Sidebar background with gradient */}
      <div className="absolute inset-0 bg-[#070512] border-r border-purple-500/10" />
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/8 via-transparent to-indigo-900/8 pointer-events-none" />
      {/* Top glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

      <div className="relative flex flex-col h-full">

        {/* Logo */}
        <div className="px-6 pt-7 pb-6">
          <Link href="/dashboard" className="flex items-center gap-3 group w-fit">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/40 group-hover:shadow-purple-500/60 group-hover:scale-105 transition-all duration-200">
              <Wallet className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <span className="font-bold text-lg gradient-text leading-none block">SpendWise</span>
              <span className="text-[10px] text-slate-600 font-medium tracking-wider uppercase leading-none">Expense Tracker</span>
            </div>
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-5" />

        {/* Nav label */}
        <div className="px-5 mb-2">
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Navigation</span>
        </div>

        {/* Navigation */}
        <nav className="px-3 flex-1 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, desc }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {/* Active background */}
                {active && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/15 to-indigo-500/8 border border-purple-500/20" />
                )}
                {/* Hover background */}
                {!active && (
                  <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/4 transition-all duration-200" />
                )}
                {/* Active left accent */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gradient-to-b from-purple-400 to-indigo-500 rounded-full" />
                )}

                {/* Icon box */}
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-all duration-200 ${
                  active
                    ? 'bg-purple-500/25 text-purple-300 shadow-sm shadow-purple-500/20'
                    : 'bg-white/4 text-slate-500 group-hover:bg-purple-500/15 group-hover:text-purple-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Label + desc */}
                <div className="relative min-w-0">
                  <p className={`leading-none mb-0.5 ${active ? 'text-white' : ''}`}>{label}</p>
                  <p className={`text-[11px] leading-none ${active ? 'text-purple-400/70' : 'text-slate-600 group-hover:text-slate-500'}`}>{desc}</p>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Live indicator */}
        <div className="px-5 py-3">
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border w-fit transition-all ${
            connected
              ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/8'
              : 'text-slate-600 border-slate-700/50 bg-slate-800/30'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
            }`} />
            <span className="font-medium">{connected ? 'Live sync on' : 'Offline mode'}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />

        {/* User card + logout */}
        <div className="p-4 pb-6">
          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/3 border border-white/5 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-purple-500/20 flex-shrink-0 ring-2 ring-purple-500/20">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate leading-snug">{user.name}</p>
              <p className="text-[11px] text-slate-500 truncate leading-snug">{user.email}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/15 transition-all duration-200 group"
          >
            <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
