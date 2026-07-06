'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import ExpenseCard from '@/components/ExpenseCard'
import ExpenseForm from '@/components/ExpenseForm'
import BottomNav from '@/components/BottomNav'
import { Search, Filter, Plus, X, Loader2, SlidersHorizontal } from 'lucide-react'

const CATEGORIES = ['All', 'Food', 'Grocery', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Education', 'Bills', 'Fuel', 'Labour', 'Material', 'Investment', 'Other']

const MONTHS = [
  'All Months', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function ExpensesPage() {
  const { user, loading: authLoading } = useAuth()
  const { socket } = useSocket() || {}
  const router = useRouter()

  const [expenses, setExpenses] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    category: 'All',
    month: '',
    year: new Date().getFullYear().toString(),
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading])

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams()
    if (filters.category !== 'All') params.set('category', filters.category)
    if (filters.month) params.set('month', filters.month)
    if (filters.year) params.set('year', filters.year)
    params.set('limit', '200')
    return params.toString()
  }, [filters])

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/expenses?${buildQuery()}`)
      const data = await res.json()
      setExpenses(data.expenses || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [buildQuery])

  useEffect(() => {
    if (user) fetchExpenses()
  }, [user, fetchExpenses])

  useEffect(() => {
    if (!socket) return
    const refresh = () => fetchExpenses()
    socket.on('expense:created', refresh)
    socket.on('expense:updated', refresh)
    socket.on('expense:deleted', refresh)
    return () => {
      socket.off('expense:created', refresh)
      socket.off('expense:updated', refresh)
      socket.off('expense:deleted', refresh)
    }
  }, [socket, fetchExpenses])

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  const filtered = expenses.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  )

  const currentYear = new Date().getFullYear()
  const years = [currentYear, currentYear - 1, currentYear - 2].map(String)

  const openAddForm = () => { setShowForm(true); setEditExpense(null) }

  return (
    <div className="min-h-screen pt-16 lg:pt-10 pb-28 lg:pb-12 px-4 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">All Expenses</h1>
          <p className="text-ink-muted text-sm mt-1">
            {filtered.length} transactions · Total: ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="hidden lg:flex btn-primary items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="mb-6">
          <ExpenseForm
            key={editExpense?._id || 'new'}
            editData={editExpense}
            onSuccess={() => { setShowForm(false); setEditExpense(null); if (!socket) fetchExpenses() }}
            onClose={() => { setShowForm(false); setEditExpense(null) }}
          />
        </div>
      )}

      {/* Search + filters */}
      <div className="glass-card rounded-2xl p-4 mb-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="input-field search-input w-full"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              showFilters ? 'bg-accent/15 border-accent/40 text-accent' : 'border-line text-ink-muted hover:text-ink hover:border-accent/30'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-line-soft grid sm:grid-cols-3 gap-3">
            {/* Category */}
            <div>
              <label className="block text-xs text-ink-faint mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
                className="input-field w-full"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Month */}
            <div>
              <label className="block text-xs text-ink-faint mb-2">Month</label>
              <select
                value={filters.month}
                onChange={(e) => setFilters((p) => ({ ...p, month: e.target.value }))}
                className="input-field w-full"
              >
                <option value="">All Months</option>
                {MONTHS.slice(1).map((m, i) => (
                  <option key={m} value={String(i + 1)}>{m}</option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs text-ink-faint mb-2">Year</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters((p) => ({ ...p, year: e.target.value }))}
                className="input-field w-full"
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Category quick filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilters((p) => ({ ...p, category: cat }))}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              filters.category === cat
                ? 'bg-accent/15 border-accent/40 text-accent'
                : 'border-line text-ink-faint hover:text-ink hover:border-accent/25'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Month quick filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {MONTHS.map((m, i) => {
          const value = i === 0 ? '' : String(i)
          const isSelected = filters.month === value
          return (
            <button
              key={m}
              onClick={() => setFilters((p) => ({ ...p, month: value }))}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                isSelected
                  ? 'bg-accent/15 border-accent/40 text-accent'
                  : 'border-line text-ink-faint hover:text-ink hover:border-accent/25'
              }`}
            >
              {m}
            </button>
          )
        })}
      </div>

      {/* Expenses list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : filtered.length ? (
        <div className="space-y-2">
          {filtered.map((expense) => (
            <ExpenseCard
              key={expense._id}
              expense={expense}
              onDelete={(id) => setExpenses((p) => p.filter((e) => e._id !== id))}
              onEdit={(exp) => { setEditExpense(exp); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-16 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-ink font-medium mb-1">No expenses found</p>
          <p className="text-ink-faint text-sm">
            {search ? 'Try a different search term' : 'Add your first expense to get started'}
          </p>
        </div>
      )}

      <BottomNav onAdd={openAddForm} />
    </div>
  )
}
