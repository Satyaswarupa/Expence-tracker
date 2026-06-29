'use client'

import { useState } from 'react'
import { X, Plus, Calendar, Clock } from 'lucide-react'
import { toLocalDateInputValue, combineLocalDateTime } from '@/lib/date'
import { CATEGORY_COLORS_MAP } from '@/components/Charts'

const CATEGORIES = ['Food', 'Grocery', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Education', 'Bills', 'Fuel', 'Labour', 'Material', 'Investment', 'Other']

const PAYMENT_METHODS = ['Cash', 'UPI']

const PAYMENT_METHOD_EMOJIS = {
  Cash: '💵',
  UPI: '📱',
}

const pad = (n) => String(n).padStart(2, '0')
const timeOf = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

export default function ExpenseForm({ onSuccess, onClose, editData = null }) {
  const [form, setForm] = useState({
    title: editData?.title || '',
    amount: editData?.amount || '',
    category: editData?.category || 'Food',
    paymentMethod: editData?.paymentMethod || 'Cash',
    description: editData?.description || '',
    date: toLocalDateInputValue(editData?.date),
    time: editData?.date ? timeOf(new Date(editData.date)) : timeOf(new Date()),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || parseFloat(form.amount) <= 0) return setError('Enter a valid amount')

    setLoading(true)
    try {
      const url = editData ? `/api/expenses/${editData._id}` : '/api/expenses'
      const method = editData ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, date: combineLocalDateTime(form.date, form.time) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      onSuccess?.(data.expense)
      if (!editData) {
        const now = new Date()
        setForm({ title: '', amount: '', category: 'Food', paymentMethod: 'Cash', description: '', date: toLocalDateInputValue(now), time: timeOf(now) })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card rounded-2xl border-accent/20">
      <div className="sticky md:static top-0 z-10 flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 bg-white/95 backdrop-blur-md border-b border-line-soft rounded-t-2xl">
        <h2 className="font-display text-lg font-bold text-ink">
          {editData ? 'Edit Expense' : 'Add New Expense'}
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-cream transition-all flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="px-5 sm:px-6 pt-4 pb-5 sm:pb-6 space-y-2.5 sm:space-y-4">
        {/* Amount hero — mobile only */}
        <div className="lg:hidden text-center py-1">
          <div className="text-[11px] tracking-wider text-ink-faint font-bold">AMOUNT</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="font-display text-4xl font-bold text-ink">₹</span>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={handleChange}
              placeholder="0"
              className="font-display text-4xl font-bold text-ink bg-transparent outline-none w-32 text-center min-w-0"
            />
          </div>
        </div>
        <div className="lg:hidden">
          <label className="block text-xs font-medium text-ink-muted mb-1">Title (optional)</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Defaults to category"
            className="input-field min-w-0"
          />
        </div>

        {/* Title + Amount row — desktop only */}
        <div className="hidden lg:grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="block text-xs font-medium text-ink-muted mb-1">Title (optional)</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Defaults to category"
              className="input-field min-w-0"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-ink-muted mb-1">Amount (₹)</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="input-field min-w-0"
            />
          </div>
        </div>

        {/* Date + Time row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="block text-xs font-medium text-ink-muted mb-1">Date</label>
            <div className="input-field flex items-center gap-2 min-w-0">
              <Calendar className="w-4 h-4 text-ink-faint flex-shrink-0" />
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                className="flex-1 min-w-0 bg-transparent outline-none text-sm"
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-ink-muted mb-1">Time</label>
            <div className="input-field flex items-center gap-2 min-w-0">
              <Clock className="w-4 h-4 text-ink-faint flex-shrink-0" />
              <input
                name="time"
                type="time"
                value={form.time}
                onChange={handleChange}
                className="flex-1 min-w-0 bg-transparent outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Category</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {CATEGORIES.map((cat) => {
              const dot = CATEGORY_COLORS_MAP[cat] || '#B9A99C'
              const selected = form.category === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, category: cat }))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
                    selected
                      ? 'bg-accent/10 border-accent'
                      : 'border-line text-ink-faint hover:border-accent/30 hover:text-ink-soft bg-cream'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: dot }} />
                  <span className={`w-full text-center leading-tight break-words ${selected ? 'text-ink' : ''}`}>{cat}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Payment method */}
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm}
                type="button"
                onClick={() => setForm((p) => ({ ...p, paymentMethod: pm }))}
                className={`flex items-center justify-center gap-2 p-1.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                  form.paymentMethod === pm
                    ? 'bg-accent/15 border-accent/50 text-accent'
                    : 'border-line text-ink-faint hover:border-accent/30 hover:text-ink-soft bg-cream'
                }`}
              >
                <span className="text-base">{PAYMENT_METHOD_EMOJIS[pm]}</span>
                <span>{pm}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1">Note (optional)</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Add a note..."
            rows={2}
            className="input-field resize-none"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {loading ? 'Saving...' : editData ? 'Update Expense' : 'Add Expense'}
        </button>
      </form>
    </div>
  )
}
