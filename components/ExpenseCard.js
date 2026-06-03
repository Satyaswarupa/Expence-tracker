'use client'

import { useState } from 'react'
import { Trash2, Pencil, ChevronDown, ChevronUp } from 'lucide-react'

const CATEGORY_EMOJIS = {
  Food: '🍕',
  Transport: '🚗',
  Entertainment: '🎮',
  Shopping: '🛍️',
  Health: '💊',
  Education: '📚',
  Bills: '📋',
  Other: '📦',
}

const CATEGORY_COLORS = {
  Food: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Transport: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Entertainment: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  Shopping: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  Health: 'text-red-400 bg-red-500/10 border-red-500/20',
  Education: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  Bills: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  Other: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
}

export default function ExpenseCard({ expense, onDelete, onEdit }) {
  const [deleting, setDeleting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this expense?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/expenses/${expense._id}`, { method: 'DELETE' })
      if (res.ok) onDelete?.(expense._id)
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
    <div className="glass-card rounded-xl border border-white/5 hover:border-purple-500/20 transition-all duration-200 group">
      <div className="flex items-center gap-3 p-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${colorClass} border`}>
          {CATEGORY_EMOJIS[expense.category]}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white text-sm truncate">{expense.title}</span>
            {expense.description && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
              {expense.category}
            </span>
            <span className="text-xs text-slate-500">{dateStr}</span>
          </div>
        </div>

        {/* Amount + actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-bold text-white tabular-nums">
            ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </span>
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit?.(expense)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      {expanded && expense.description && (
        <div className="px-4 pb-3 pt-0">
          <p className="text-sm text-slate-400 pl-13 ml-13">{expense.description}</p>
        </div>
      )}
    </div>
  )
}
