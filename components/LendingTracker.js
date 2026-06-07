'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, X, Check, Loader2 } from 'lucide-react'

const PAYMENT_METHODS = ['Cash', 'UPI']
const PAYMENT_METHOD_EMOJIS = { Cash: '💵', UPI: '📱' }

const pad = (n) => String(n).padStart(2, '0')
const todayStr = () => new Date().toISOString().split('T')[0]
const nowTimeStr = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }

const blankForm = () => ({
  person: '', amount: '', expectedReturnDate: todayStr(), expectedReturnTime: nowTimeStr(), paymentMethod: 'Cash', note: '',
})

export default function LendingTracker() {
  const [lendings, setLendings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(blankForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchLendings = useCallback(async () => {
    const res = await fetch('/api/lendings')
    if (res.ok) {
      const data = await res.json()
      setLendings(data.lendings || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchLendings() }, [fetchLendings])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.person.trim()) return setError('Enter a name')
    if (!form.amount || parseFloat(form.amount) <= 0) return setError('Enter a valid amount')

    setSubmitting(true)
    setError('')
    try {
      const expectedReturnDate = form.expectedReturnDate
        ? `${form.expectedReturnDate}T${form.expectedReturnTime || '00:00'}`
        : ''

      const res = await fetch('/api/lendings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, expectedReturnDate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setLendings((prev) => [data.lending, ...prev])
      setForm(blankForm())
      setShowForm(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReturned = async (id) => {
    if (!confirm('Mark as returned and remove from this list?')) return
    const res = await fetch(`/api/lendings/${id}`, { method: 'DELETE' })
    if (res.ok) setLendings((prev) => prev.filter((l) => l._id !== id))
  }

  const fmtCurrency = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null)
  const fmtReturnBy = (d) => {
    if (!d) return null
    const dt = new Date(d)
    const datePart = dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    if (dt.getHours() === 0 && dt.getMinutes() === 0) return datePart
    return `${datePart}, ${dt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`
  }

  const total = lendings.reduce((sum, l) => sum + l.amount, 0)

  return (
    <div className="glass-card rounded-2xl border border-white/5 p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-white">Money Lent Out</h2>
        <button
          onClick={() => { setShowForm((s) => !s); setError('') }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
      {!loading && lendings.length > 0 && (
        <p className="text-xs text-slate-500 mb-4">
          {fmtCurrency(total)} owed back to you across {lendings.length} {lendings.length === 1 ? 'person' : 'people'}
        </p>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-3 mb-4 p-3 rounded-xl border border-white/5 bg-white/3">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.person}
              onChange={(e) => setForm((p) => ({ ...p, person: e.target.value }))}
              placeholder="Who did you give it to?"
              className="input-field"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              placeholder="Amount (₹)"
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label className="block text-[11px] text-slate-500 mb-1">Return date (optional)</label>
              <input
                type="date"
                value={form.expectedReturnDate}
                onChange={(e) => setForm((p) => ({ ...p, expectedReturnDate: e.target.value }))}
                className="input-field min-w-0"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-[11px] text-slate-500 mb-1">Return time (optional)</label>
              <input
                type="time"
                value={form.expectedReturnTime}
                onChange={(e) => setForm((p) => ({ ...p, expectedReturnTime: e.target.value }))}
                className="input-field min-w-0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm}
                type="button"
                onClick={() => setForm((p) => ({ ...p, paymentMethod: pm }))}
                className={`flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
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
          <input
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            placeholder="Note (optional)"
            className="input-field"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-24">
          <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
        </div>
      ) : lendings.length ? (
        <div className="space-y-2">
          {lendings.map((l) => (
            <div key={l._id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 bg-amber-500/10 border border-amber-500/20 text-amber-400">
                🤝
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm truncate">{l.person}</div>
                <div className="text-xs text-slate-500 truncate">
                  Lent {fmtDate(l.dateGiven)} · {(l.paymentMethod || 'Cash') === 'UPI' ? '📱' : '💵'} {l.paymentMethod || 'Cash'}
                  {l.expectedReturnDate && ` · back by ${fmtReturnBy(l.expectedReturnDate)}`}
                  {l.note && ` · ${l.note}`}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-bold text-white tabular-nums">{fmtCurrency(l.amount)}</span>
                <button
                  onClick={() => handleReturned(l._id)}
                  title="Mark as returned"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-500 text-sm py-6">
          No pending lendings — all settled up!
        </div>
      )}
    </div>
  )
}
