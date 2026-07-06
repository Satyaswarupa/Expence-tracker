'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Receipt, BarChart3, HandCoins, Plus } from 'lucide-react'

const leftItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
]

const rightItems = [
  { href: '/analytics', label: 'Reports', icon: BarChart3 },
  { href: '/lending', label: 'People', icon: HandCoins },
]

function NavLink({ href, label, icon: Icon, active }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 text-[10px] font-semibold flex-1 transition-colors ${
        active ? 'text-accent' : 'text-ink-faint'
      }`}
    >
      <Icon className="w-[22px] h-[22px]" />
      {label}
    </Link>
  )
}

export default function BottomNav({ onAdd }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card border-t border-line flex items-end justify-around px-4 pt-2.5 pb-[max(env(safe-area-inset-bottom),12px)]">
      {leftItems.map((item) => (
        <NavLink key={item.href} {...item} active={pathname === item.href} />
      ))}

      <button
        onClick={onAdd}
        aria-label="Add expense"
        className="w-[54px] h-[54px] rounded-full bg-accent text-white flex items-center justify-center -mt-6 shadow-lg shadow-accent/40 flex-shrink-0"
      >
        <Plus className="w-6 h-6" />
      </button>

      {rightItems.map((item) => (
        <NavLink key={item.href} {...item} active={pathname === item.href} />
      ))}
    </nav>
  )
}
