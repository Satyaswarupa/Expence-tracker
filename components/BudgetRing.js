'use client'

import { fmtCurrency, STATUS_TONE } from '@/lib/budget'

const TONE_STROKE = {
  success: 'var(--success)',
  'accent-yellow': 'var(--accent-yellow)',
  danger: 'var(--danger)',
  'ink-faint': 'var(--ink-faint)',
}

/**
 * Spent-vs-budget ring with a tick showing where an even spend would put you
 * today — the gap between the arc and the tick is the whole story at a glance.
 */
export default function BudgetRing({ spent, budget, pace, size = 200 }) {
  const stroke = 14
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  // 270° arc, opened at the bottom so the numbers sit in the gap
  const sweep = 0.75
  const arc = circumference * sweep

  const ratio = budget > 0 ? Math.min(1, spent / budget) : 0
  const tone = STATUS_TONE[pace?.status] || 'ink-faint'
  const paceRatio = pace?.daysTotal ? Math.min(1, pace.daysElapsed / pace.daysTotal) : 0

  // Angle of the "you should be here today" tick, along the same 270° arc
  const tickAngle = 135 + paceRatio * 270
  const tickRad = (tickAngle * Math.PI) / 180
  const cx = size / 2
  const cy = size / 2
  const tickInner = radius - stroke / 2 - 3
  const tickOuter = radius + stroke / 2 + 3

  // Lakh-scale totals don't fit the ring's inner width at the largest size,
  // so the figure steps down as it gets longer rather than spilling out.
  const spentText = fmtCurrency(spent)
  const amountClass =
    spentText.length > 9 ? 'text-xl' : spentText.length > 7 ? 'text-2xl' : 'text-3xl'

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[225deg]" style={{ transformOrigin: 'center' }}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--cream)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circumference}`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={TONE_STROKE[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arc * ratio} ${circumference}`}
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Today marker */}
      {budget > 0 && pace?.isCurrentMonth && (
        <svg width={size} height={size} className="absolute inset-0 pointer-events-none">
          <line
            x1={cx + tickInner * Math.cos(tickRad)}
            y1={cy + tickInner * Math.sin(tickRad)}
            x2={cx + tickOuter * Math.cos(tickRad)}
            y2={cy + tickOuter * Math.sin(tickRad)}
            stroke="var(--ink)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5">
        <div className="text-[11px] font-semibold text-ink-faint uppercase tracking-wider">Spent</div>
        <div className={`font-display font-bold text-ink tabular-nums leading-tight mt-0.5 ${amountClass}`}>
          {spentText}
        </div>
        {budget > 0 ? (
          <div className="text-xs text-ink-muted mt-1 tabular-nums">of {fmtCurrency(budget)}</div>
        ) : (
          <div className="text-xs text-ink-faint mt-1">No budget set</div>
        )}
      </div>
    </div>
  )
}
