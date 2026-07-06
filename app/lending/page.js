'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import LendingTracker from '@/components/LendingTracker'
import PendingPaymentTracker from '@/components/PendingPaymentTracker'
import BottomNav from '@/components/BottomNav'
import { Loader2 } from 'lucide-react'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'owe', label: 'You owe' },
  { key: 'owed', label: 'Owes you' },
]

export default function LendingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [owedToYou, setOwedToYou] = useState(0)
  const [youOwe, setYouOwe] = useState(0)
  const [tab, setTab] = useState('all')

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading])

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  const fmtCurrency = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

  return (
    <div className="min-h-screen pt-16 lg:pt-10 pb-28 lg:pb-12 px-4 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="font-display text-2xl font-bold text-ink">People</h1>
        <p className="text-ink-muted text-sm mt-1">Track money you&apos;ve lent out and balances you still owe</p>
      </div>

      {/* Mobile-only summary + filter */}
      <div className="lg:hidden mb-5 flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex-1 min-w-0 glass-card card-top-red rounded-2xl p-4">
            <div className="text-xs text-ink-muted font-medium truncate">You owe</div>
            <div className="font-display text-xl font-bold text-danger mt-0.5 truncate">{fmtCurrency(youOwe)}</div>
          </div>
          <div className="flex-1 min-w-0 glass-card card-top-green rounded-2xl p-4">
            <div className="text-xs text-ink-muted font-medium truncate">You&apos;re owed</div>
            <div className="font-display text-xl font-bold text-success mt-0.5 truncate">{fmtCurrency(owedToYou)}</div>
          </div>
        </div>

        <div className="flex bg-line-soft rounded-xl p-1 gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 min-w-0 text-center rounded-lg py-2 text-sm font-semibold transition-all truncate px-1 ${
                tab === t.key ? 'bg-card text-ink shadow-sm' : 'text-ink-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className={tab === 'owe' ? 'hidden lg:block' : 'lg:block'}>
          <LendingTracker onTotalChange={setOwedToYou} />
        </div>
        <div className={tab === 'owed' ? 'hidden lg:block' : 'lg:block'}>
          <PendingPaymentTracker onTotalChange={setYouOwe} />
        </div>
      </div>

      <BottomNav onAdd={() => router.push('/dashboard')} />
    </div>
  )
}
