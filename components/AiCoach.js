'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, Target, PiggyBank } from 'lucide-react'
import { CATEGORY_COLORS_MAP } from '@/components/Charts'
import { ChallengeSuggestion } from '@/components/ChallengeCard'
import { fmtCurrency } from '@/lib/budget'
import { Skeleton } from '@/components/Skeleton'

const TONE = {
  good: { icon: CheckCircle2, className: 'text-success bg-success/12' },
  warn: { icon: AlertTriangle, className: 'text-accent-yellow bg-accent-yellow/12' },
  bad: { icon: TrendingUp, className: 'text-danger bg-danger/12' },
}

function timeAgo(date) {
  if (!date) return ''
  const mins = Math.round((Date.now() - new Date(date)) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

function CoachSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-3/4" />
      <div className="space-y-2">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  )
}

export default function AiCoach({ insight, generatedAt, loading, error, note, stale = true, onAnalyze, onApplyBudget, onAcceptChallenge, acceptedTitles = [], budgetAmount }) {
  const [acceptingTitle, setAcceptingTitle] = useState(null)
  const [applyingBudget, setApplyingBudget] = useState(false)

  const accept = async (challenge) => {
    setAcceptingTitle(challenge.title)
    try {
      await onAcceptChallenge(challenge)
    } finally {
      setAcceptingTitle(null)
    }
  }

  const applyBudget = async () => {
    setApplyingBudget(true)
    try {
      await onApplyBudget(insight.suggestedBudget.amount)
    } finally {
      setApplyingBudget(false)
    }
  }

  return (
    <div className="glass-card card-top-purple rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-sm font-bold text-ink leading-tight">AI Coach</h2>
            <p className="text-[11px] text-ink-faint truncate">
              {insight && generatedAt
                ? `Analysed ${timeAgo(generatedAt)}${stale ? ' · new spending since' : ''}`
                : 'Reads your spending and finds the leaks'}
            </p>
          </div>
        </div>
        {insight && (
          <button
            onClick={onAnalyze}
            disabled={loading || !stale}
            aria-label={stale ? 'Re-analyse' : 'Already up to date'}
            title={stale ? 'Re-analyse with your latest spending' : 'Up to date — add or edit an expense to re-analyse'}
            className="p-2 rounded-xl bg-cream text-ink-muted hover:text-accent transition-colors disabled:opacity-40 disabled:hover:text-ink-muted disabled:cursor-not-allowed flex-shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-danger/10 text-danger text-xs px-3 py-2.5 mb-4 leading-relaxed">{error}</div>
      )}

      {note && !error && (
        <div className="rounded-xl bg-cream text-ink-muted text-xs px-3 py-2.5 mb-4 leading-relaxed">{note}</div>
      )}

      {loading && !insight ? (
        <CoachSkeleton />
      ) : !insight ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">🧠</div>
          <p className="text-sm text-ink-soft font-medium mb-1">Ask the coach where your money goes</p>
          <p className="text-xs text-ink-faint mb-4 max-w-xs mx-auto leading-relaxed">
            It reads this month against your last few, finds what you can cut, and sets you a target.
          </p>
          <button onClick={onAnalyze} disabled={loading} className="btn-primary mx-auto">
            <Sparkles className="w-4 h-4" /> Analyse my spending
          </button>
        </div>
      ) : (
        <div className={`space-y-5 transition-opacity ${loading ? 'opacity-50' : ''}`}>
          {/* Headline */}
          <p className="font-display text-base font-bold text-ink leading-snug">{insight.headline}</p>

          {/* Observations */}
          {insight.observations?.length > 0 && (
            <div className="space-y-2">
              {insight.observations.map((o, i) => {
                const tone = TONE[o.tone] || TONE.warn
                return (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl bg-cream px-3 py-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${tone.className}`}>
                      <tone.icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {o.category && (
                          <span
                            className="w-2 h-2 rounded-sm flex-shrink-0"
                            style={{ background: CATEGORY_COLORS_MAP[o.category] || '#B9A99C' }}
                          />
                        )}
                        <h4 className="text-sm font-semibold text-ink leading-snug">{o.title}</h4>
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed mt-0.5">{o.detail}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Savings */}
          {insight.savings?.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <PiggyBank className="w-4 h-4 text-success flex-shrink-0" />
                  <h3 className="text-sm font-bold text-ink truncate">Where you can save</h3>
                </div>
                {insight.totalMonthlySaving > 0 && (
                  <span className="text-xs font-bold text-success tabular-nums flex-shrink-0">
                    up to {fmtCurrency(insight.totalMonthlySaving)}/mo
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {insight.savings.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl bg-cream px-3 py-2.5">
                    <div className="w-7 h-7 rounded-lg bg-success/12 text-success flex items-center justify-center flex-shrink-0">
                      <TrendingDown className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-ink leading-snug">{s.title}</h4>
                      <p className="text-xs text-ink-muted leading-relaxed mt-0.5">{s.detail}</p>
                    </div>
                    <span className="font-display text-sm font-bold text-success tabular-nums flex-shrink-0">
                      +{fmtCurrency(s.monthlySaving)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested target */}
          {insight.suggestedBudget && (
            <div className="rounded-xl bg-cream p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Target className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold text-ink">Your target</h3>
              </div>
              <div className="font-display text-3xl font-bold text-ink tabular-nums">
                {fmtCurrency(insight.suggestedBudget.amount)}
                <span className="text-sm font-semibold text-ink-faint"> /month</span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed mt-1.5">{insight.suggestedBudget.reason}</p>
              <button
                onClick={applyBudget}
                disabled={applyingBudget || budgetAmount === insight.suggestedBudget.amount}
                className="btn-primary w-full justify-center mt-3 text-xs py-2"
              >
                {budgetAmount === insight.suggestedBudget.amount
                  ? <><CheckCircle2 className="w-3.5 h-3.5" /> This is your budget</>
                  : applyingBudget ? 'Setting…' : 'Make this my budget'}
              </button>
            </div>
          )}

          {/* Challenges */}
          {insight.challenges?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-base leading-none">🔥</span>
                <h3 className="text-sm font-bold text-ink">Challenges for you</h3>
              </div>
              <div className="space-y-2.5">
                {insight.challenges.map((c, i) => (
                  <ChallengeSuggestion
                    key={i}
                    challenge={c}
                    onAccept={accept}
                    accepting={acceptingTitle === c.title}
                    taken={acceptedTitles.includes(c.title)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
