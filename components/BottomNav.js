'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Receipt, Target, BarChart3, HandCoins, Plus } from 'lucide-react'

const leftItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
]

const rightItems = [
  { href: '/budget', label: 'Budget', icon: Target },
  { href: '/analytics', label: 'Reports', icon: BarChart3 },
  { href: '/lending', label: 'People', icon: HandCoins },
]

function NavLink({ href, label, icon: Icon, active }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 text-[10px] font-semibold flex-1 min-w-0 ${
        active ? 'text-accent' : 'text-ink-faint'
      }`}
    >
      <div className="flex items-center justify-center w-9 h-8 rounded-xl bg-cream">
        <Icon className="w-[21px] h-[21px]" />
      </div>
      <span className="truncate max-w-full">{label}</span>
    </Link>
  )
}

export default function BottomNav({ onAdd }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden nav-raised rounded-t-2xl flex items-end justify-around gap-0.5 px-2 pt-2.5 pb-[max(env(safe-area-inset-bottom),12px)]">
      {leftItems.map((item) => (
        <NavLink key={item.href} {...item} active={pathname === item.href} />
      ))}

      <button
        onClick={onAdd}
        aria-label="Add expense"
        className="w-[54px] h-[54px] rounded-full bg-accent text-white flex items-center justify-center -mt-6 mx-1 fab-accent flex-shrink-0"
      >
        <Plus className="w-6 h-6" />
      </button>

      {rightItems.map((item) => (
        <NavLink key={item.href} {...item} active={pathname === item.href} />
      ))}
    </nav>
  )
}
