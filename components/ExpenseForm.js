'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Education', 'Bills', 'Fuel', 'Labour', 'Material', 'Investment', 'Other']

const CATEGORY_EMOJIS = {
  Food: '🍕',
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

export default function ExpenseForm({ onSuccess, onClose, editData = null }) {
  const [form, setForm] = useState({
    title: editData?.title || '',
    amount: editData?.amount || '',
    category: editData?.category || 'Food',
    description: editData?.description || '',
    date: editData?.date ? new Date(editData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError('Title is required')
    if (!form.amount || parseFloat(form.amount) <= 0) return setError('Enter a valid amount')

    setLoading(true)
    try {
      const url = editData ? `/api/expenses/${editData._id}` : '/api/expenses'
      const method = editData ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      onSuccess?.(data.expense)
      if (!editData) {
        setForm({ title: '', amount: '', category: 'Food', description: '', date: new Date().toISOString().split('T')[0] })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6 border border-purple-500/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">
          {editData ? 'Edit Expense' : 'Add New Expense'}
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="What did you spend on?"
            className="input-field"
          />
        </div>

        {/* Amount + Date row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Amount (₹)</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Date</label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm((p) => ({ ...p, category: cat }))}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
                  form.category === cat
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'border-white/5 text-slate-500 hover:border-purple-500/30 hover:text-slate-300 bg-white/3'
                }`}
              >
                <span className="text-base">{CATEGORY_EMOJIS[cat]}</span>
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Note (optional)</label>
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
