'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import StatCard from '@/components/StatCard'
import ExpenseCard from '@/components/ExpenseCard'
import ExpenseForm from '@/components/ExpenseForm'
import BottomNav from '@/components/BottomNav'
import { SpendingAreaChart, CATEGORY_COLORS_MAP } from '@/components/Charts'
import { Skeleton, SkeletonPage, SkeletonRows, SkeletonLines, SkeletonBlock } from '@/components/Skeleton'
import { TrendingUp, Wallet, Receipt, Tag, Plus, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

const PAGE_SIZE = 8
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function MobileSheet({ open, onClose, children }) {
  const [visible, setVisible] = useState(false)
  const [animOut, setAnimOut] = useState(false)

  useEffect(() => {
    if (open) { setAnimOut(false); setVisible(true) }
    else if (visible) {
      setAnimOut(true)
      const t = setTimeout(() => { setVisible(false); setAnimOut(false) }, 260)
      return () => clearTimeout(t)
    }
  }, [open])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${animOut ? 'opacity-0' : 'opacity-100'}`}
        onClick={onClose}
      />
      <div className={`absolute bottom-0 left-0 right-0 bg-card border-t border-line rounded-t-2xl ${animOut ? 'sheet-exit' : 'sheet-enter'}`}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-black/10" />
        </div>
        <div className="popup-scroll px-4 pb-6 h-[85vh] overflow-y-scroll overscroll-contain border-t border-line">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { socket } = useSocket() || {}
  const router = useRouter()

  const [stats, setStats] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [owedToYou, setOwedToYou] = useState(0)
  const [youOwe, setYouOwe] = useState(0)
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState({ month: now.getMonth() + 1, year: now.getFullYear() })

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading])

  const fetchStats = useCallback(async (m = selectedMonth) => {
    const res = await fetch(`/api/expenses/stats?month=${m.month}&year=${m.year}`)
    if (res.ok) setStats(await res.json())
  }, [selectedMonth])

  // Real money & people totals (same aggregation already used on the People page)
  useEffect(() => {
    if (!user) return
    fetch('/api/lendings')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const total = (data?.lendings || []).reduce((sum, l) => sum + l.amount, 0)
        setOwedToYou(total)
      })
      .catch(() => {})
    fetch('/api/pending-payments')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const total = (data?.payments || []).reduce((sum, p) => sum + (p.totalAmount - p.paidAmount), 0)
        setYouOwe(total)
      })
      .catch(() => {})
  }, [user])

  const fetchExpenses = useCallback(async (p, m = selectedMonth) => {
    const res = await fetch(`/api/expenses?limit=${PAGE_SIZE}&page=${p}&month=${m.month}&year=${m.year}`)
    if (!res.ok) return
    const data = await res.json()
    setExpenses(data.expenses || [])
    setTotalPages(data.totalPages || 1)
  }, [selectedMonth])

  const fetchData = useCallback(async (p = 1) => {
    try {
      await Promise.all([fetchStats(), fetchExpenses(p)])
    } finally {
      setLoading(false)
    }
  }, [fetchStats, fetchExpenses])

  useEffect(() => {
    if (user) fetchData(1)
  }, [user, selectedMonth])

  const goToPage = async (p) => {
    setPageLoading(true)
    setPage(p)
    await fetchExpenses(p)
    setPageLoading(false)
  }

  // Socket: instant update when expense created/updated/deleted
  useEffect(() => {
    if (!socket) return
    const handleCreated = (expense) => {
      // Only prepend on page 1, and only when the new expense actually falls in the selected month
      const d = new Date(expense.date)
      const belongsToSelectedMonth = d.getMonth() + 1 === selectedMonth.month && d.getFullYear() === selectedMonth.year
      if (page === 1 && belongsToSelectedMonth) {
        setExpenses((prev) => [expense, ...prev].slice(0, PAGE_SIZE))
      }
      fetchStats()
    }
    const handleUpdated = (expense) => {
      setExpenses((prev) => prev.map((e) => (e._id === expense._id ? expense : e)))
      fetchStats()
    }
    const handleDeleted = ({ id }) => {
      setExpenses((prev) => prev.filter((e) => e._id !== id))
      fetchStats()
      fetchExpenses(page)
    }
    socket.on('expense:created', handleCreated)
    socket.on('expense:updated', handleUpdated)
    socket.on('expense:deleted', handleDeleted)
    return () => {
      socket.off('expense:created', handleCreated)
      socket.off('expense:updated', handleUpdated)
      socket.off('expense:deleted', handleDeleted)
    }
  }, [socket, page, fetchStats, fetchExpenses, selectedMonth])

  if (authLoading || !user) {
    return <SkeletonPage />
  }

  const fmtCurrency = (n) =>
    `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Called when expense is successfully added/edited
  const handleFormSuccess = (expense) => {
    setShowForm(false)
    setEditExpense(null)
    if (!expense) return

    if (editExpense) {
      // Edit: update in-place (socket will also fire but map is idempotent)
      setExpenses((prev) => prev.map((e) => (e._id === expense._id ? expense : e)))
      fetchStats()
    } else if (!socket) {
      // No socket connection: add optimistically since expense:created won't fire
      setPage(1)
      setExpenses((prev) => [expense, ...prev].slice(0, PAGE_SIZE))
      setTotalPages((prev) => Math.max(prev, 1))
      fetchStats()
    }
    // When socket is connected, let expense:created handle the list update
  }

  const openAddForm = () => { setShowForm(true); setEditExpense(null) }

  const topCategories = (stats?.byCategory || []).slice(0, 3)
  // byCategory is scoped to selectedMonth, so the % bars must sum against it too (not the all-time total)
  const catTotal = (stats?.byCategory || []).reduce((sum, cat) => sum + cat.total, 0)

  // Month selector — derives from monthlyTrend already returned by /api/expenses/stats, no new fetch
  const monthOptions = Array.from({ length: now.getMonth() + 1 }, (_, i) => ({ month: i + 1, year: now.getFullYear() }))
  const isCurrentMonth = selectedMonth.month === now.getMonth() + 1 && selectedMonth.year === now.getFullYear()
  const selectedTrend = isCurrentMonth
    ? stats?.thisMonth
    : stats?.monthlyTrend?.find((m) => m._id.month === selectedMonth.month && m._id.year === selectedMonth.year)
  const selectedTotal = selectedTrend?.total || 0
  const selectedCount = selectedTrend?.count || 0
  const selectedLabel = isCurrentMonth ? 'This month' : MONTH_NAMES[selectedMonth.month - 1]

  return (
    <div className="min-h-screen pt-16 lg:pt-10 pb-28 lg:pb-12 px-4 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 lg:mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            {greeting}, {user.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-ink-muted text-sm mt-1">Here&apos;s your spending overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={`${selectedMonth.month}-${selectedMonth.year}`}
              onChange={(e) => {
                const [m, y] = e.target.value.split('-').map(Number)
                setPage(1)
                setSelectedMonth({ month: m, year: y })
              }}
              className="appearance-none bg-card border border-line rounded-xl pl-3 pr-8 py-2 text-sm font-semibold text-ink-soft cursor-pointer"
            >
              {monthOptions.map((o) => (
                <option key={`${o.month}-${o.year}`} value={`${o.month}-${o.year}`}>
                  {MONTH_NAMES[o.month - 1]} {o.year}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-ink-faint absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            onClick={openAddForm}
            className="hidden lg:flex items-center justify-center w-9 h-9 rounded-xl bg-accent text-white shadow-lg shadow-accent/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile hero card — real data only (no budget field exists in this app) */}
      <div className="lg:hidden mb-4 glass-card card-top-accent rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-ink-muted font-medium">Spent {isCurrentMonth ? 'this month' : `in ${selectedLabel}`}</div>
          <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center text-accent flex-shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-10 w-40 mt-2" />
        ) : (
          <div className="font-display text-4xl font-bold mt-2 text-ink tabular-nums">
            {fmtCurrency(selectedTotal)}
          </div>
        )}
        <div className="text-xs text-ink-faint mt-2">
          {loading ? <Skeleton className="h-3 w-24" /> : `${selectedCount} transactions`}
        </div>
      </div>

      {/* Mobile money & people row — real totals from /api/lendings + /api/pending-payments */}
      <div className="lg:hidden mb-4 flex gap-3">
        <button onClick={() => router.push('/lending')} className="flex-1 min-w-0 text-left glass-card card-top-red rounded-2xl p-4">
          <div className="text-xs text-ink-muted font-medium truncate">You owe</div>
          <div className="font-display text-xl font-bold text-danger mt-0.5 truncate">{fmtCurrency(youOwe)}</div>
        </button>
        <button onClick={() => router.push('/lending')} className="flex-1 min-w-0 text-left glass-card card-top-green rounded-2xl p-4">
          <div className="text-xs text-ink-muted font-medium truncate">Owed to you</div>
          <div className="font-display text-xl font-bold text-success mt-0.5 truncate">{fmtCurrency(owedToYou)}</div>
        </button>
      </div>

      {/* Mobile by-category card */}
      <div className="lg:hidden mb-6 glass-card card-top-purple rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display font-bold text-sm text-ink">By category</h2>
            <p className="text-[11px] text-ink-faint">{selectedLabel}</p>
          </div>
          <button onClick={() => router.push('/analytics')} className="text-xs text-accent font-bold">See all</button>
        </div>
        {loading ? (
          <SkeletonLines count={3} />
        ) : stats?.byCategory?.length ? (
          <>
            <div className="flex h-3.5 rounded-full overflow-hidden mb-3.5">
              {stats.byCategory.map((cat) => (
                <div
                  key={cat._id}
                  style={{
                    width: `${catTotal ? (cat.total / catTotal) * 100 : 0}%`,
                    background: CATEGORY_COLORS_MAP[cat._id] || '#B9A99C',
                  }}
                />
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              {topCategories.map((cat) => (
                <div key={cat._id} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: CATEGORY_COLORS_MAP[cat._id] || '#B9A99C' }} />
                  <div className="flex-1 text-sm text-ink-soft font-medium">{cat._id}</div>
                  <div className="font-display text-sm font-bold text-ink">{fmtCurrency(cat.total)}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-ink-faint text-sm py-4">No expenses yet</div>
        )}
      </div>

      {/* Stats grid — desktop only, mobile has its own hero/category cards above */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Spent"
          value={fmtCurrency(stats?.allTime?.total)}
          subtitle={`${stats?.allTime?.count || 0} transactions`}
          icon={Wallet}
          color="purple"
          loading={loading}
        />
        <StatCard
          title={isCurrentMonth ? 'This Month' : selectedLabel}
          value={fmtCurrency(selectedTotal)}
          subtitle={`${selectedCount} transactions`}
          icon={TrendingUp}
          color="emerald"
          loading={loading}
        />
        <StatCard
          title="Transactions"
          value={(stats?.allTime?.count || 0).toString()}
          subtitle="All time entries"
          icon={Receipt}
          color="amber"
          loading={loading}
        />
        <StatCard
          title="Categories"
          value={(stats?.byCategory?.length || 0).toString()}
          subtitle="Active categories"
          icon={Tag}
          color="rose"
          loading={loading}
        />
      </div>

      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2">
          <div className="glass-card card-top-red rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-ink mb-1">Spending Over Time</h2>
            <p className="text-xs text-ink-faint mb-4">{selectedLabel}</p>
            {loading ? (
              <SkeletonBlock className="h-[280px]" />
            ) : (
              <SpendingAreaChart expenses={expenses} />
            )}
          </div>
        </div>

        {/* Add Expense form or quick categories */}
        <div>
          {showForm ? (
            <ExpenseForm
              key={editExpense?._id || 'new'}
              editData={editExpense}
              onSuccess={handleFormSuccess}
              onClose={() => { setShowForm(false); setEditExpense(null) }}
            />
          ) : (
            <div className="glass-card card-top-purple rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-ink">Top Categories</h2>
              <p className="text-xs text-ink-faint mb-4">{selectedLabel}</p>
              {loading ? (
                <SkeletonLines count={4} />
              ) : stats?.byCategory?.length ? (
                <div className="space-y-3">
                  {stats.byCategory.slice(0, 5).map((cat) => {
                    const pct = catTotal
                      ? Math.round((cat.total / catTotal) * 100)
                      : 0
                    return (
                      <div key={cat._id}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-ink-soft">{cat._id}</span>
                          <span className="text-ink font-medium">{fmtCurrency(cat.total)}</span>
                        </div>
                        <div className="h-1.5 bg-line rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center text-ink-faint text-sm py-8">
                  No expenses yet. Add your first one!
                </div>
              )}
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-5"
              >
                <Plus className="w-4 h-4" /> Add Expense
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent expenses — scoped to the selected month */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Transactions</h2>
            <p className="text-xs text-ink-faint">{selectedLabel}</p>
          </div>
          <button onClick={() => router.push('/expenses')} className="text-xs text-accent hover:opacity-80 transition-opacity">
            View all →
          </button>
        </div>

        {loading ? (
          <SkeletonRows count={4} />
        ) : expenses.length ? (
          <>
            <div className={`space-y-2 transition-opacity duration-200 ${pageLoading ? 'opacity-50' : 'opacity-100'}`}>
              {expenses.map((expense) => (
                <ExpenseCard
                  key={expense._id}
                  expense={expense}
                  onDelete={(id) => {
                    setExpenses((p) => p.filter((e) => e._id !== id))
                    fetchStats()
                    fetchExpenses(page)
                  }}
                  onEdit={(exp) => { setEditExpense(exp); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-5 px-1">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1 || pageLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-line text-ink-muted hover:text-ink hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-xs text-ink-faint">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages || pageLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-line text-ink-muted hover:text-ink hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">💸</div>
            <p className="text-ink font-medium mb-1">No expenses yet</p>
            <p className="text-ink-faint text-sm">Add your first expense to get started</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add First Expense
            </button>
          </div>
        )}
      </div>

      {/* Mobile bottom-sheet */}
      <MobileSheet open={showForm} onClose={() => { setShowForm(false); setEditExpense(null) }}>
        <ExpenseForm
          key={editExpense?._id || 'new'}
          editData={editExpense}
          onSuccess={handleFormSuccess}
          onClose={() => { setShowForm(false); setEditExpense(null) }}
        />
      </MobileSheet>

      <BottomNav onAdd={openAddForm} />
    </div>
  )
}
