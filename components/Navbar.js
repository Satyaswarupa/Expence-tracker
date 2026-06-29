'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { LayoutDashboard, Receipt, BarChart3, HandCoins, LogOut } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/analytics', label: 'Reports', icon: BarChart3 },
  { href: '/lending', label: 'People', icon: HandCoins },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
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
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-line lg:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
              <span className="font-display font-extrabold text-sm text-white leading-none">M</span>
            </div>
            <span className="gradient-text text-lg">MoneyJot</span>
          </Link>

          {/* Nav items — only shown on md (tablet), sidebar handles lg+, BottomNav handles small phones */}
          <div className="hidden md:flex lg:hidden items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === href
                    ? 'bg-accent/12 text-accent border border-accent/25'
                    : 'text-ink-muted hover:text-ink hover:bg-cream'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Avatar with dropdown — replaces the hamburger menu below the sidebar breakpoint; hidden on the People page */}
          {pathname !== '/lending' && (
            <div className="relative lg:hidden" ref={avatarRef}>
              <button
                onClick={() => setAvatarOpen(!avatarOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {initials}
                </div>
                <span className="hidden md:block text-sm text-ink-soft max-w-[120px] truncate">{user.name}</span>
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-10 w-48 bg-white border border-line rounded-xl shadow-xl py-1 z-50">
                  <div className="px-3 py-2 border-b border-line-soft">
                    <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
                    <p className="text-xs text-ink-faint truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setAvatarOpen(false); logout() }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
