'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { CategoryPieChart, MonthlyBarChart } from '@/components/Charts'
import { TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react'

const CATEGORY_EMOJIS = {
  Food: '🍕', Transport: '🚗', Entertainment: '🎮', Shopping: '🛍️',
  Health: '💊', Education: '📚', Bills: '📋', Fuel: '⛽',
  Labour: '👷', Material: '🧱', Investment: '📈', Other: '📦',
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading])

  useEffect(() => {
    if (!user) return
    fetch('/api/expenses/stats')
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [user])

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  const fmtCurrency = (n) =>
    `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

  const topCategory = stats?.byCategory?.[0]
  const monthlyData = stats?.monthlyTrend || []

  const currentMonthData = monthlyData.find((m) => {
    const now = new Date()
    return m._id.month === now.getMonth() + 1 && m._id.year === now.getFullYear()
  })
  const prevMonthData = monthlyData.find((m) => {
    const now = new Date()
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return m._id.month === prev.getMonth() + 1 && m._id.year === prev.getFullYear()
  })

  const monthTrend =
    prevMonthData?.total && currentMonthData?.total
      ? Math.round(((currentMonthData.total - prevMonthData.total) / prevMonthData.total) * 100)
      : null

  return (
    <div className="min-h-screen pt-16 lg:pt-10 pb-12 px-4 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Visualize your spending patterns</p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-card rounded-2xl border border-white/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-400 text-sm">All Time Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? '...' : fmtCurrency(stats?.allTime?.total)}</p>
          <p className="text-xs text-slate-500 mt-1">{stats?.allTime?.count || 0} transactions</p>
        </div>

        <div className="glass-card rounded-2xl border border-white/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              {monthTrend !== null && monthTrend >= 0
                ? <TrendingUp className="w-4 h-4 text-white" />
                : <TrendingDown className="w-4 h-4 text-white" />
              }
            </div>
            <span className="text-slate-400 text-sm">This Month</span>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? '...' : fmtCurrency(stats?.thisMonth?.total)}</p>
          {monthTrend !== null && (
            <p className={`text-xs mt-1 font-medium ${monthTrend >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {monthTrend >= 0 ? '↑' : '↓'} {Math.abs(monthTrend)}% vs last month
            </p>
          )}
        </div>

        <div className="glass-card rounded-2xl border border-white/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <span className="text-base">{topCategory ? CATEGORY_EMOJIS[topCategory._id] : '📊'}</span>
            </div>
            <span className="text-slate-400 text-sm">Top Category</span>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? '...' : topCategory?._id || 'N/A'}</p>
          <p className="text-xs text-slate-500 mt-1">
            {topCategory ? fmtCurrency(topCategory.total) : 'No data yet'}
          </p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card rounded-2xl border border-white/5 p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Monthly Spending</h2>
          <p className="text-xs text-slate-500 mb-4">This year month-by-month</p>
          {loading ? (
            <div className="flex items-center justify-center h-[280px]">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : (
            <MonthlyBarChart data={stats?.monthlyTrend} />
          )}
        </div>

        <div className="glass-card rounded-2xl border border-white/5 p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Category Breakdown</h2>
          <p className="text-xs text-slate-500 mb-4">All-time spending by category</p>
          {loading ? (
            <div className="flex items-center justify-center h-[280px]">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : (
            <CategoryPieChart data={stats?.byCategory} />
          )}
        </div>
      </div>

      {/* Category breakdown table */}
      <div className="glass-card rounded-2xl border border-white/5 p-5">
        <h2 className="text-sm font-semibold text-white mb-5">Spending by Category</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        ) : stats?.byCategory?.length ? (
          <div className="space-y-4">
            {stats.byCategory.map((cat) => {
              const pct = stats.allTime?.total
                ? Math.round((cat.total / stats.allTime.total) * 100)
                : 0
              return (
                <div key={cat._id} className="flex items-center gap-4">
                  <span className="text-xl w-7 text-center flex-shrink-0">{CATEGORY_EMOJIS[cat._id]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-slate-200 font-medium">{cat._id}</span>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-500">{cat.count} txns</span>
                        <span className="text-white font-semibold tabular-nums">{fmtCurrency(cat.total)}</span>
                        <span className="text-slate-500 w-10 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-slate-500 py-8 text-sm">
            No expense data yet. Start adding expenses to see analytics.
          </div>
        )}
      </div>
    </div>
  )
}
