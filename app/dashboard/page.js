'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import StatCard from '@/components/StatCard'
import ExpenseCard from '@/components/ExpenseCard'
import ExpenseForm from '@/components/ExpenseForm'
import { SpendingAreaChart } from '@/components/Charts'
import { TrendingUp, Wallet, Receipt, Tag, Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const PAGE_SIZE = 8

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
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${animOut ? 'opacity-0' : 'opacity-100'}`}
        onClick={onClose}
      />
      <div className={`absolute bottom-0 left-0 right-0 bg-[#120d24] border-t border-purple-500/30 rounded-t-2xl ${animOut ? 'sheet-exit' : 'sheet-enter'}`}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="popup-scroll px-4 pb-6 h-[85vh] overflow-y-scroll overscroll-contain border-t border-white/5">
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

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading])

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/expenses/stats')
    if (res.ok) setStats(await res.json())
  }, [])

  const fetchExpenses = useCallback(async (p) => {
    const res = await fetch(`/api/expenses?limit=${PAGE_SIZE}&page=${p}`)
    if (!res.ok) return
    const data = await res.json()
    setExpenses(data.expenses || [])
    setTotalPages(data.totalPages || 1)
  }, [])

  const fetchData = useCallback(async (p = 1) => {
    try {
      await Promise.all([fetchStats(), fetchExpenses(p)])
    } finally {
      setLoading(false)
    }
  }, [fetchStats, fetchExpenses])

  useEffect(() => {
    if (user) fetchData(1)
  }, [user, fetchData])

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
      // Only prepend on page 1 so list stays consistent
      if (page === 1) {
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
  }, [socket, page, fetchStats, fetchExpenses])

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
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

  return (
    <div className="min-h-screen pt-16 lg:pt-10 pb-12 px-4 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greeting}, {user.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Here&apos;s your spending overview</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditExpense(null) }}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Spent"
          value={loading ? '...' : fmtCurrency(stats?.allTime?.total)}
          subtitle={`${stats?.allTime?.count || 0} transactions`}
          icon={Wallet}
          color="purple"
        />
        <StatCard
          title="This Month"
          value={loading ? '...' : fmtCurrency(stats?.thisMonth?.total)}
          subtitle={`${stats?.thisMonth?.count || 0} this month`}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Transactions"
          value={loading ? '...' : (stats?.allTime?.count || 0).toString()}
          subtitle="All time entries"
          icon={Receipt}
          color="amber"
        />
        <StatCard
          title="Categories"
          value={loading ? '...' : (stats?.byCategory?.length || 0).toString()}
          subtitle="Active categories"
          icon={Tag}
          color="rose"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl border border-white/5 p-5">
            <h2 className="text-sm font-semibold text-white mb-1">Spending Over Time</h2>
            <p className="text-xs text-slate-500 mb-4">Last 14 days</p>
            {loading ? (
              <div className="flex items-center justify-center h-[280px]">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              </div>
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
            <div className="glass-card rounded-2xl border border-white/5 p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Top Categories</h2>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                </div>
              ) : stats?.byCategory?.length ? (
                <div className="space-y-3">
                  {stats.byCategory.slice(0, 5).map((cat) => {
                    const pct = stats.allTime?.total
                      ? Math.round((cat.total / stats.allTime.total) * 100)
                      : 0
                    return (
                      <div key={cat._id}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-300">{cat._id}</span>
                          <span className="text-white font-medium">{fmtCurrency(cat.total)}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center text-slate-500 text-sm py-8">
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

      {/* Recent expenses */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
          <button onClick={() => router.push('/expenses')} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
            View all →
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
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
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-white/10 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-xs text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages || pageLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-white/10 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="glass-card rounded-2xl border border-white/5 p-12 text-center">
            <div className="text-4xl mb-3">💸</div>
            <p className="text-white font-medium mb-1">No expenses yet</p>
            <p className="text-slate-500 text-sm">Add your first expense to get started</p>
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
    </div>
  )
}
