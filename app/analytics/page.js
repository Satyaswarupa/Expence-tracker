'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { CategoryPieChart, MonthlyBarChart, DailyHeatmap, CATEGORY_COLORS_MAP } from '@/components/Charts'
import BottomNav from '@/components/BottomNav'
import { TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react'

const CATEGORY_EMOJIS = {
  Food: '🍕', Grocery: '🛒', Transport: '🚗', Entertainment: '🎮', Shopping: '🛍️',
  Health: '💊', Education: '📚', Bills: '📋', Fuel: '⛽',
  Labour: '👷', Material: '🧱', Investment: '📈', Other: '📦',
}

const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [monthExpenses, setMonthExpenses] = useState([])
  const now = new Date()

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

  // Reuses the existing /api/expenses list endpoint (already used by the Expenses page)
  // to compute a real day-by-day total for the heatmap — no new backend logic.
  useEffect(() => {
    if (!user) return
    fetch(`/api/expenses?month=${now.getMonth() + 1}&year=${now.getFullYear()}&limit=500`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setMonthExpenses(data?.expenses || []))
      .catch(() => {})
  }, [user])

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
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
    <div className="min-h-screen pt-16 lg:pt-10 pb-28 lg:pb-12 px-4 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink">Reports</h1>
        <p className="text-ink-muted text-sm mt-1">Visualize your spending patterns</p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-card card-top-red rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-danger/15 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-danger" />
            </div>
            <span className="text-ink-muted text-sm">All Time Total</span>
          </div>
          <p className="font-display text-2xl font-bold text-ink">{loading ? '...' : fmtCurrency(stats?.allTime?.total)}</p>
          <p className="text-xs text-ink-faint mt-1">{stats?.allTime?.count || 0} transactions</p>
        </div>

        <div className="glass-card card-top-green rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-success/15 flex items-center justify-center">
              {monthTrend !== null && monthTrend >= 0
                ? <TrendingUp className="w-4 h-4 text-success" />
                : <TrendingDown className="w-4 h-4 text-success" />
              }
            </div>
            <span className="text-ink-muted text-sm">This Month</span>
          </div>
          <p className="font-display text-2xl font-bold text-ink">{loading ? '...' : fmtCurrency(stats?.thisMonth?.total)}</p>
          {monthTrend !== null && (
            <p className={`text-xs mt-1 font-medium ${monthTrend >= 0 ? 'text-danger' : 'text-success'}`}>
              {monthTrend >= 0 ? '↑' : '↓'} {Math.abs(monthTrend)}% vs last month
            </p>
          )}
        </div>

        <div className="glass-card card-top-yellow rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-accent-yellow/15 flex items-center justify-center">
              <span className="text-base">{topCategory ? CATEGORY_EMOJIS[topCategory._id] : '📊'}</span>
            </div>
            <span className="text-ink-muted text-sm">Top Category</span>
          </div>
          <p className="font-display text-2xl font-bold text-ink">{loading ? '...' : topCategory?._id || 'N/A'}</p>
          <p className="text-xs text-ink-faint mt-1">
            {topCategory ? fmtCurrency(topCategory.total) : 'No data yet'}
          </p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-1">Monthly Spending</h2>
          <p className="text-xs text-ink-faint mb-4">This year month-by-month</p>
          {loading ? (
            <div className="flex items-center justify-center h-[280px]">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
          ) : (
            <MonthlyBarChart data={stats?.monthlyTrend} />
          )}
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-1">Category Breakdown</h2>
          <p className="text-xs text-ink-faint mb-4">All-time spending by category</p>
          {loading ? (
            <div className="flex items-center justify-center h-[280px]">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
          ) : (
            <CategoryPieChart data={stats?.byCategory} />
          )}
        </div>
      </div>

      {/* Category breakdown table */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-ink mb-5">Spending by Category</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          </div>
        ) : stats?.byCategory?.length ? (
          <div className="space-y-4">
            {stats.byCategory.map((cat) => {
              const pct = stats.allTime?.total
                ? Math.round((cat.total / stats.allTime.total) * 100)
                : 0
              const color = CATEGORY_COLORS_MAP[cat._id] || '#B9A99C'
              return (
                <div key={cat._id} className="flex items-center gap-4">
                  <span className="text-xl w-7 text-center flex-shrink-0">{CATEGORY_EMOJIS[cat._id]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-ink-soft font-medium">{cat._id}</span>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-ink-faint">{cat.count} txns</span>
                        <span className="text-ink font-semibold tabular-nums">{fmtCurrency(cat.total)}</span>
                        <span className="text-ink-faint w-10 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-line rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-ink-faint py-8 text-sm">
            No expense data yet. Start adding expenses to see analytics.
          </div>
        )}
      </div>

      {/* Daily heatmap */}
      <div className="glass-card rounded-2xl p-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink">Daily Spending</h2>
          <span className="text-xs text-ink-faint font-semibold">{MONTH_LABELS[now.getMonth()]} {now.getFullYear()}</span>
        </div>
        <DailyHeatmap expenses={monthExpenses} year={now.getFullYear()} month={now.getMonth() + 1} />
      </div>

      <BottomNav onAdd={() => router.push('/dashboard')} />
    </div>
  )
}
