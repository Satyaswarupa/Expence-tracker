'use client'

import { useState } from 'react'
import { Trash2, Pencil, ChevronDown, ChevronUp } from 'lucide-react'

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

const CATEGORY_COLORS = {
  Food: 'text-[#EE6C4D] bg-[#EE6C4D]/10 border-[#EE6C4D]/20',
  Grocery: 'text-[#8FAE52] bg-[#8FAE52]/10 border-[#8FAE52]/20',
  Transport: 'text-[#2E9E83] bg-[#2E9E83]/10 border-[#2E9E83]/20',
  Entertainment: 'text-[#9B6BC9] bg-[#9B6BC9]/10 border-[#9B6BC9]/20',
  Shopping: 'text-[#F4A93B] bg-[#F4A93B]/10 border-[#F4A93B]/20',
  Health: 'text-[#E0719A] bg-[#E0719A]/10 border-[#E0719A]/20',
  Education: 'text-[#3FA7C4] bg-[#3FA7C4]/10 border-[#3FA7C4]/20',
  Bills: 'text-[#4C8DD6] bg-[#4C8DD6]/10 border-[#4C8DD6]/20',
  Fuel: 'text-[#C97F3A] bg-[#C97F3A]/10 border-[#C97F3A]/20',
  Labour: 'text-[#7C8AA8] bg-[#7C8AA8]/10 border-[#7C8AA8]/20',
  Material: 'text-[#A9876F] bg-[#A9876F]/10 border-[#A9876F]/20',
  Investment: 'text-[#5C9E6B] bg-[#5C9E6B]/10 border-[#5C9E6B]/20',
  Other: 'text-[#B9A99C] bg-[#B9A99C]/10 border-[#B9A99C]/20',
}

export default function ExpenseCard({ expense, onDelete, onEdit }) {
  const [deleting, setDeleting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this expense?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/expenses/${expense._id}`, { method: 'DELETE' })
      if (res.ok || res.status === 404) onDelete?.(expense._id)
    } finally {
      setDeleting(false)
    }
  }

  const dateStr = new Date(expense.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const colorClass = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other

  return (
    <div className="glass-card rounded-xl hover:border-accent/25 transition-all duration-200 group">
      <div className="flex items-center gap-3 p-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${colorClass} border`}>
          {CATEGORY_EMOJIS[expense.category]}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink text-sm truncate">{expense.title || expense.category}</span>
            {expense.description && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-ink-faint hover:text-ink-soft transition-colors flex-shrink-0"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
              {expense.category}
            </span>
            <span className="text-xs text-ink-faint">{dateStr}</span>
            <span className="text-xs text-ink-faint">
              {(expense.paymentMethod || 'Cash') === 'UPI' ? '📱' : '💵'} {expense.paymentMethod || 'Cash'}
            </span>
          </div>
        </div>

        {/* Amount + actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-display font-bold text-ink tabular-nums">
            ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </span>
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit?.(expense)}
              className="p-1.5 rounded-lg text-ink-faint hover:text-accent hover:bg-accent/10 transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-lg text-ink-faint hover:text-danger hover:bg-danger/10 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      {expanded && expense.description && (
        <div className="px-4 pb-3 pt-0">
          <p className="text-sm text-ink-muted pl-13 ml-13">{expense.description}</p>
        </div>
      )}
    </div>
  )
}
