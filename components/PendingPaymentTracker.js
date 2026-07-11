'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, X, Trash2 } from 'lucide-react'
import { toLocalDateInputValue, combineLocalDateTime } from '@/lib/date'
import { SkeletonPaymentRows } from '@/components/Skeleton'

const PAYMENT_METHODS = ['Cash', 'UPI']
const PAYMENT_METHOD_EMOJIS = { Cash: '💵', UPI: '📱' }

const pad = (n) => String(n).padStart(2, '0')
const todayStr = () => toLocalDateInputValue()
const nowTimeStr = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }

const blankForm = () => ({
  person: '', totalAmount: '', paidAmount: '', date: todayStr(), time: nowTimeStr(), paymentMethod: 'Cash', note: '',
})

export default function PendingPaymentTracker({ onTotalChange } = {}) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(blankForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [payInputs, setPayInputs] = useState({})

  const fetchPayments = useCallback(async () => {
    const res = await fetch('/api/pending-payments')
    if (res.ok) {
      const data = await res.json()
      setPayments(data.payments || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.person.trim()) return setError('Enter a name')
    if (!form.totalAmount || parseFloat(form.totalAmount) <= 0) return setError('Enter a valid total amount')
    if (form.paidAmount && parseFloat(form.paidAmount) > parseFloat(form.totalAmount)) {
      return setError('Amount paid cannot exceed the total')
    }

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/pending-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, date: combineLocalDateTime(form.date, form.time) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setPayments((prev) => [data.payment, ...prev])
      setForm(blankForm())
      setShowForm(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddPayment = async (id) => {
    const amount = parseFloat(payInputs[id])
    if (!amount || amount <= 0) return
    const res = await fetch(`/api/pending-payments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addPayment: amount }),
    })
    const data = await res.json()
    if (res.ok) {
      setPayments((prev) => prev.map((p) => (p._id === id ? data.payment : p)))
      setPayInputs((prev) => ({ ...prev, [id]: '' }))
    }
  }

  const handleRemove = async (id) => {
    if (!confirm('Remove this entry?')) return
    const res = await fetch(`/api/pending-payments/${id}`, { method: 'DELETE' })
    if (res.ok) setPayments((prev) => prev.filter((p) => p._id !== id))
  }

  const fmtCurrency = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  const totalDue = payments.reduce((sum, p) => sum + (p.totalAmount - p.paidAmount), 0)

  useEffect(() => { onTotalChange?.(totalDue) }, [totalDue])

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-ink">Pending Payments</h2>
        <button
          onClick={() => { setShowForm((s) => !s); setError('') }}
          className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-cream transition-all"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
      {!loading && payments.length > 0 && (
        <p className="text-xs text-ink-faint mb-4">
          {fmtCurrency(totalDue)} still owed across {payments.length} {payments.length === 1 ? 'order' : 'orders'}
        </p>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-3 mb-4 p-3 rounded-xl border border-line bg-cream">
          <input
            value={form.person}
            onChange={(e) => setForm((p) => ({ ...p, person: e.target.value }))}
            placeholder="Contractor / vendor name"
            className="input-field"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.totalAmount}
              onChange={(e) => setForm((p) => ({ ...p, totalAmount: e.target.value }))}
              placeholder="Total amount (₹)"
              className="input-field"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.paidAmount}
              onChange={(e) => setForm((p) => ({ ...p, paidAmount: e.target.value }))}
              placeholder="Paid so far (₹)"
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label className="block text-[11px] text-ink-faint mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="input-field min-w-0"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-[11px] text-ink-faint mb-1">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
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
                    ? 'bg-accent/15 border-accent/50 text-accent'
                    : 'border-line text-ink-faint hover:border-accent/30 hover:text-ink-soft bg-card'
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
          {error && <p className="text-danger text-xs">{error}</p>}
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
        <SkeletonPaymentRows count={3} />
      ) : payments.length ? (
        <div className="space-y-3">
          {payments.map((p) => {
            const remaining = p.totalAmount - p.paidAmount
            const pct = p.totalAmount ? Math.round((p.paidAmount / p.totalAmount) * 100) : 0
            return (
              <div key={p._id} className="p-3 rounded-xl border border-line bg-cream">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <div className="font-medium text-ink text-sm truncate">{p.person}</div>
                    <div className="text-xs text-ink-faint truncate">
                      {fmtDate(p.date)} · {(p.paymentMethod || 'Cash') === 'UPI' ? '📱' : '💵'} {p.paymentMethod || 'Cash'}
                      {p.note && ` · ${p.note}`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(p._id)}
                    className="p-1.5 rounded-lg text-ink-faint hover:text-danger hover:bg-danger/10 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="h-1.5 bg-line rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-ink-muted">
                    Paid {fmtCurrency(p.paidAmount)} of {fmtCurrency(p.totalAmount)}
                  </span>
                  <span className={`font-medium ${remaining > 0 ? 'text-[#C97F3A]' : 'text-success'}`}>
                    {remaining > 0 ? `${fmtCurrency(remaining)} due` : 'Settled'}
                  </span>
                </div>
                {remaining > 0 && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={remaining}
                      value={payInputs[p._id] || ''}
                      onChange={(e) => setPayInputs((prev) => ({ ...prev, [p._id]: e.target.value }))}
                      placeholder="Add payment (₹)"
                      className="input-field"
                    />
                    <button
                      onClick={() => handleAddPayment(p._id)}
                      className="px-4 rounded-xl text-xs font-medium bg-accent/15 border border-accent/50 text-accent hover:bg-accent/25 transition-all whitespace-nowrap"
                    >
                      Pay
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center text-ink-faint text-sm py-6">
          No pending payments — all paid up!
        </div>
      )}
    </div>
  )
}
