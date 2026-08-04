'use client'

import { useState } from 'react'
import { Trophy, Flame, X, Check, Clock } from 'lucide-react'
import { CATEGORY_COLORS_MAP } from '@/components/Charts'
import { fmtCurrency } from '@/lib/budget'

const DIFFICULTY = {
  easy: { label: 'Easy', className: 'text-success bg-success/12' },
  medium: { label: 'Medium', className: 'text-accent-yellow bg-accent-yellow/12' },
  hard: { label: 'Hard', className: 'text-danger bg-danger/12' },
}

const STATUS_BADGE = {
  completed: { label: 'Won', icon: Trophy, className: 'text-success bg-success/12' },
  failed: { label: 'Missed', icon: X, className: 'text-danger bg-danger/12' },
  abandoned: { label: 'Dropped', icon: X, className: 'text-ink-faint bg-cream' },
}

function scopeLabel(challenge) {
  return challenge.scope === 'category' ? challenge.category : 'All spending'
}

/** A challenge the AI has proposed but the user hasn't taken on yet. */
export function ChallengeSuggestion({ challenge, onAccept, accepting, taken }) {
  const diff = DIFFICULTY[challenge.difficulty] || DIFFICULTY.medium
  const color = challenge.category ? CATEGORY_COLORS_MAP[challenge.category] : 'var(--accent)'

  return (
    <div className="rounded-xl bg-cream p-3.5">
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${color}22`, color }}
        >
          <Flame className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-display text-sm font-bold text-ink leading-snug">{challenge.title}</h4>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${diff.className}`}>
              {diff.label}
            </span>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed mt-1">{challenge.description}</p>
          {/* Wraps rather than overflowing when the category name is a long one */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2.5 text-[11px] text-ink-faint">
            <span className="font-semibold text-ink-soft tabular-nums">
              Under {fmtCurrency(challenge.targetAmount)}
            </span>
            <span>·</span>
            <span>{scopeLabel(challenge)}</span>
            <span>·</span>
            <span>{challenge.days} days</span>
          </div>
        </div>
      </div>
      <button
        onClick={() => onAccept(challenge)}
        disabled={accepting || taken}
        className="btn-primary w-full justify-center mt-3 text-xs py-2"
      >
        {taken ? <><Check className="w-3.5 h-3.5" /> Accepted</> : accepting ? 'Starting…' : 'Accept challenge'}
      </button>
    </div>
  )
}

/** A challenge that is running or finished, with progress read off real expenses. */
export default function ChallengeCard({ challenge, onAbandon }) {
  const [busy, setBusy] = useState(false)
  const active = challenge.status === 'active'
  const badge = STATUS_BADGE[challenge.status]
  const color = challenge.category ? CATEGORY_COLORS_MAP[challenge.category] : 'var(--accent)'

  const over = challenge.spent > challenge.targetAmount
  const barColor = over ? 'var(--danger)' : challenge.usedPct > 80 ? 'var(--accent-yellow)' : 'var(--success)'

  const abandon = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onAbandon(challenge._id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`glass-card rounded-2xl p-4 ${active ? '' : 'opacity-70'}`}>
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}22`, color }}
        >
          {badge ? <badge.icon className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-display text-sm font-bold text-ink leading-snug truncate">{challenge.title}</h4>
            {badge ? (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${badge.className}`}>
                {badge.label}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-ink-faint flex-shrink-0">
                <Clock className="w-3 h-3" />
                {challenge.daysLeft === 0 ? 'Last day' : `${challenge.daysLeft}d left`}
              </span>
            )}
          </div>
          <p className="text-[11px] text-ink-faint mt-0.5">{scopeLabel(challenge)}</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-2 rounded-full bg-cream overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, challenge.usedPct)}%`, background: barColor }}
          />
        </div>
        <div className="flex items-center justify-between gap-2 mt-2 text-[11px]">
          <span className="text-ink-soft tabular-nums font-medium truncate">
            {fmtCurrency(challenge.spent)} of {fmtCurrency(challenge.targetAmount)}
          </span>
          <span className={`tabular-nums font-bold flex-shrink-0 ${over ? 'text-danger' : 'text-success'}`}>
            {over
              ? `${fmtCurrency(challenge.spent - challenge.targetAmount)} over`
              : `${fmtCurrency(challenge.remaining)} left`}
          </span>
        </div>
      </div>

      {active && (
        <button
          onClick={abandon}
          disabled={busy}
          className="text-[11px] text-ink-faint hover:text-danger transition-colors mt-2.5 font-semibold disabled:opacity-50"
        >
          Give up
        </button>
      )}
    </div>
  )
}
