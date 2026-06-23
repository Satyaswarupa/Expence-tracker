'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { toLocalDateInputValue, combineLocalDateTime } from '@/lib/date'

const CATEGORIES = ['Food', 'Grocery', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Education', 'Bills', 'Fuel', 'Labour', 'Material', 'Investment', 'Other']

const PAYMENT_METHODS = ['Cash', 'UPI']

const PAYMENT_METHOD_EMOJIS = {
  Cash: '💵',
  UPI: '📱',
}

const CATEGORY_EMOJIS = {
  Food: '🍕',
  Grocery: '🛒',
  Transport: '🚗',
  Entertainment: '🎮',
  Shopping: '🛍️',
  Health: '💊',
  Education: '📚',
  Bills: '📋',
  Fuel: '⛽',
  Labour: '👷',
  Material: '🧱',
  Investment: '📈',
  Other: '📦',
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
    <div className="glass-card rounded-2xl border border-purple-500/20">
      <div className="sticky md:static top-0 z-10 flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 bg-[#15102a]/95 backdrop-blur-md border-b border-white/5">
        <h2 className="text-lg font-bold text-white">
          {editData ? 'Edit Expense' : 'Add New Expense'}
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="px-5 sm:px-6 pt-4 pb-5 sm:pb-6 space-y-2.5 sm:space-y-4">
        {/* Title + Amount row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-400 mb-1">Title (optional)</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Defaults to category"
              className="input-field min-w-0"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-400 mb-1">Amount (₹)</label>
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
            <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className="input-field min-w-0"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-400 mb-1">Time</label>
            <input
              name="time"
              type="time"
              value={form.time}
              onChange={handleChange}
              className="input-field min-w-0"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm((p) => ({ ...p, category: cat }))}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                  form.category === cat
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'border-white/5 text-slate-500 hover:border-purple-500/30 hover:text-slate-300 bg-white/3'
                }`}
              >
                <span className="text-base">{CATEGORY_EMOJIS[cat]}</span>
                <span className="w-full text-center leading-tight break-words">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment method */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm}
                type="button"
                onClick={() => setForm((p) => ({ ...p, paymentMethod: pm }))}
                className={`flex items-center justify-center gap-2 p-1.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                  form.paymentMethod === pm
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'border-white/5 text-slate-500 hover:border-purple-500/30 hover:text-slate-300 bg-white/3'
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
          <label className="block text-xs font-medium text-slate-400 mb-1">Note (optional)</label>
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
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
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
