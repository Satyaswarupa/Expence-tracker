'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import LendingTracker from '@/components/LendingTracker'
import PendingPaymentTracker from '@/components/PendingPaymentTracker'
import { Loader2 } from 'lucide-react'

export default function LendingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading])

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-16 lg:pt-10 pb-12 px-4 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Lending & Dues</h1>
        <p className="text-slate-400 text-sm mt-1">Track money you&apos;ve lent out and balances you still owe</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <LendingTracker />
        <PendingPaymentTracker />
      </div>
    </div>
  )
}
