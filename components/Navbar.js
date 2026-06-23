'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { LayoutDashboard, Receipt, BarChart3, HandCoins, LogOut, Menu, X, Wallet } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/lending', label: 'Lending & Dues', icon: HandCoins },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const avatarRef = useRef(null)

  useEffect(() => {
    function handleOutside(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  if (!user) return null

  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-purple-500/20 lg:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text hidden sm:block">SpendWise</span>
          </Link>

          {/* Nav items — only shown on md (tablet), sidebar handles lg+ */}
          <div className="hidden md:flex lg:hidden items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === href
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Avatar with dropdown — md only (sidebar shows user on lg+) */}
            <div className="relative hidden md:block lg:hidden" ref={avatarRef}>
              <button
                onClick={() => setAvatarOpen(!avatarOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-purple-500/20">
                  {initials}
                </div>
                <span className="text-sm text-slate-300 max-w-[120px] truncate">{user.name}</span>
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-10 w-44 bg-[#1a1030] border border-purple-500/30 rounded-xl shadow-2xl shadow-black/60 py-1 z-50">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-xs text-slate-400 truncate">{user.name}</p>
                  </div>
                  <button
                    onClick={() => { setAvatarOpen(false); logout() }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-purple-500/20 bg-[#0f0a1e]/95 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-purple-500/20 flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate leading-snug">{user.name}</p>
              <p className="text-xs text-slate-500 truncate leading-snug">{user.email}</p>
            </div>
          </div>

          <div className="px-4 py-3 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  pathname === href
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
