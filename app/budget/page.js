'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { onExpensesChanged } from '@/lib/expenseEvents'
import BudgetRing from '@/components/BudgetRing'
import AiCoach from '@/components/AiCoach'
import ChallengeCard from '@/components/ChallengeCard'
import BottomNav from '@/components/BottomNav'
import ExpenseForm from '@/components/ExpenseForm'
import { Skeleton, SkeletonPage } from '@/components/Skeleton'
import { fmtCurrency, MONTH_NAMES, STATUS_LABEL, STATUS_TONE, budgetPace } from '@/lib/budget'
import { Pencil, ChevronDown, Wallet, CalendarDays, TrendingUp, X, Check, Trophy } from 'lucide-react'

const QUICK_AMOUNTS = [5000, 10000, 15000, 20000, 30000, 50000]

const TONE_TEXT = {
  success: 'text-success bg-success/12',
  'accent-yellow': 'text-accent-yellow bg-accent-yellow/12',
  danger: 'text-danger bg-danger/12',
  'ink-faint': 'text-ink-faint bg-cream',
}

function Sheet({ open, onClose, children }) {
  // Mount state is derived during render, not in an effect: opening must show the
  // sheet immediately, while closing waits for the slide-down to finish so the
  // exit animation isn't cut off by an early unmount.
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center">
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        onAnimationEnd={() => { if (!open) setMounted(false) }}
        className={`relative w-full lg:max-w-md bg-card border-t lg:border border-line rounded-t-2xl lg:rounded-2xl ${open ? 'sheet-enter' : 'sheet-exit'}`}
      >
        <div className="flex justify-center pt-3 pb-1 lg:hidden">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>
        <div className="popup-scroll px-4 pb-6 pt-2 lg:p-6 max-h-[85vh] overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  )
}

function BudgetEditor({ current, suggested, onSave, onClear, onClose, monthLabel }) {
  const [value, setValue] = useState(current ? String(current) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    const amount = parseFloat(value)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(amount)
      onClose()
    } catch (err) {
      setError(err.message || 'Could not save your budget.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Monthly budget</h2>
          <p className="text-xs text-ink-faint mt-0.5">Roughly what you plan to spend in {monthLabel}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-full bg-cream text-ink-soft">
          <X className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>

      <div className="relative mb-3">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-2xl font-bold text-ink-faint">₹</span>
        <input
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0"
          className="input-field font-display text-3xl font-bold tabular-nums py-3 pl-11"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {suggested > 0 && (
          <button
            type="button"
            onClick={() => setValue(String(suggested))}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-accent/12 text-accent"
          >
            Your average · {fmtCurrency(suggested)}
          </button>
        )}
        {QUICK_AMOUNTS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setValue(String(a))}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-cream text-ink-soft"
          >
            {fmtCurrency(a)}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-danger mb-3">{error}</p>}

      <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
        {saving ? 'Saving…' : <><Check className="w-4 h-4" /> Set budget</>}
      </button>
      {current > 0 && (
        <button
          type="button"
          onClick={async () => { await onClear(); onClose() }}
          className="w-full text-xs text-ink-faint hover:text-danger transition-colors mt-3 font-semibold"
        >
          Remove budget
        </button>
      )}
    </form>
  )
}

// Spelled out rather than interpolated — Tailwind only ships classes it can see
const VALUE_TONE = { ink: 'text-ink', success: 'text-success', danger: 'text-danger' }

function PaceStat({ icon: Icon, label, value, hint, tone = 'ink' }) {
  return (
    // A phone can't fit three columns of currency side by side, so below `sm`
    // each stat is a full-width row with the number on the right.
    <div className="rounded-xl bg-cream px-3 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:block">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-faint uppercase tracking-wide min-w-0">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className="text-right sm:text-left min-w-0">
        <div className={`font-display text-lg font-bold tabular-nums sm:mt-1 ${VALUE_TONE[tone] || VALUE_TONE.ink}`}>
          {value}
        </div>
        {hint && <div className="text-[11px] text-ink-faint mt-0.5 leading-snug">{hint}</div>}
      </div>
    </div>
  )
}

export default function BudgetPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState({ month: now.getMonth() + 1, year: now.getFullYear() })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [insight, setInsight] = useState(null)
  const [generatedAt, setGeneratedAt] = useState(null)
  const [coachLoading, setCoachLoading] = useState(false)
  const [coachError, setCoachError] = useState('')
  const [coachNote, setCoachNote] = useState('')
  // No analysis yet counts as stale — the first run has to happen
  const [insightStale, setInsightStale] = useState(true)

  const [active, setActive] = useState([])
  const [past, setPast] = useState([])
  const [acceptedTitles, setAcceptedTitles] = useState([])

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading])

  const fetchBudget = useCallback(async (m = selectedMonth) => {
    const res = await fetch(`/api/budget?month=${m.month}&year=${m.year}`)
    if (!res.ok) return
    const json = await res.json()
    setData(json)
    setInsight(json.insight?.data || null)
    setGeneratedAt(json.insight?.generatedAt || null)
    setInsightStale(json.insight ? json.insight.stale : true)
  }, [selectedMonth])

  const fetchChallenges = useCallback(async () => {
    const res = await fetch('/api/challenges')
    if (!res.ok) return
    const json = await res.json()
    setActive(json.active || [])
    setPast(json.past || [])
  }, [])

  const fetchAll = useCallback(async () => {
    try {
      await Promise.all([fetchBudget(), fetchChallenges()])
    } finally {
      setLoading(false)
    }
  }, [fetchBudget, fetchChallenges])

  useEffect(() => {
    if (user) fetchAll()
  }, [user, selectedMonth])

  // Expenses added from the AI chat or the add sheet move every number on this page
  useEffect(() => {
    return onExpensesChanged(() => {
      fetchBudget()
      fetchChallenges()
    })
  }, [fetchBudget, fetchChallenges])

  const saveBudget = async (amount, source = 'user') => {
    const res = await fetch('/api/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, source, ...selectedMonth }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Could not save your budget.')
    // Reflect it immediately; pace math is shared with the server so they agree
    setData((prev) => (prev ? { ...prev, budget: json.budget, pace: json.pace } : prev))
    // A different target changes the advice, so the cached analysis no longer fits
    setInsightStale(true)
    return json
  }

  const clearBudget = async () => {
    await fetch(`/api/budget?month=${selectedMonth.month}&year=${selectedMonth.year}`, { method: 'DELETE' })
    setData((prev) =>
      prev
        ? { ...prev, budget: null, pace: budgetPace({ budget: 0, spent: prev.spent, ...selectedMonth }) }
        : prev
    )
    setInsightStale(true)
  }

  const analyze = async () => {
    setCoachLoading(true)
    setCoachError('')
    setCoachNote('')
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedMonth),
      })
      const json = await res.json()
      if (!res.ok) {
        setCoachError(json.error || 'Could not analyse your spending.')
        return
      }
      setInsight(json.insight)
      setGeneratedAt(json.generatedAt)
      setInsightStale(false)
      // The server skipped the model because the numbers hadn't moved — say so
      // rather than letting it look like a re-analysis that changed nothing.
      if (json.reused) setCoachNote('Your spending hasn\'t changed since this analysis, so here it is again — no new AI call needed.')
      else setAcceptedTitles([])
    } catch {
      setCoachError('Network error. Please try again.')
    } finally {
      setCoachLoading(false)
    }
  }

  const acceptChallenge = async (challenge) => {
    const res = await fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...challenge, source: 'ai' }),
    })
    const json = await res.json()
    if (!res.ok) {
      setCoachError(json.error || 'Could not start that challenge.')
      return
    }
    setActive((prev) => [json.challenge, ...prev])
    setAcceptedTitles((prev) => [...prev, challenge.title])
  }

  const abandonChallenge = async (id) => {
    const res = await fetch(`/api/challenges/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'abandoned' }),
    })
    if (!res.ok) return
    const dropped = active.find((c) => c._id === id)
    setActive((prev) => prev.filter((c) => c._id !== id))
    if (dropped) setPast((prev) => [{ ...dropped, status: 'abandoned' }, ...prev])
  }

  if (authLoading || !user) return <SkeletonPage />

  const budgetAmount = data?.budget?.amount || 0
  const spent = data?.spent || 0
  const pace = data?.pace || { status: 'no_budget' }
  const tone = STATUS_TONE[pace.status] || 'ink-faint'
  const monthLabel = `${MONTH_NAMES[selectedMonth.month - 1]} ${selectedMonth.year}`
  const monthOptions = Array.from({ length: now.getMonth() + 1 }, (_, i) => ({ month: i + 1, year: now.getFullYear() }))

  return (
    <div className="min-h-screen pt-16 lg:pt-10 pb-28 lg:pb-12 px-4 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Budget</h1>
          <p className="text-ink-muted text-sm mt-1">Set a target, then let the coach keep you on it</p>
        </div>
        <div className="relative flex-shrink-0">
          <select
            value={`${selectedMonth.month}-${selectedMonth.year}`}
            onChange={(e) => {
              const [m, y] = e.target.value.split('-').map(Number)
              setSelectedMonth({ month: m, year: y })
            }}
            className="appearance-none bg-card border border-line rounded-xl pl-3 pr-8 py-2 text-sm font-semibold text-ink-soft cursor-pointer"
          >
            {monthOptions.map((o) => (
              <option key={`${o.month}-${o.year}`} value={`${o.month}-${o.year}`}>
                {MONTH_NAMES[o.month - 1]} {o.year}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-ink-faint absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        {/* Budget card */}
        <div className="glass-card card-top-accent rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-sm font-bold text-ink">{monthLabel}</h2>
              <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 ${TONE_TEXT[tone]}`}>
                {STATUS_LABEL[pace.status]}
              </span>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-accent px-3 py-2 rounded-xl bg-cream"
            >
              <Pencil className="w-3.5 h-3.5" />
              {budgetAmount > 0 ? 'Edit' : 'Set budget'}
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <Skeleton className="w-[200px] h-[200px] rounded-full" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : (
            <>
              <div className="flex justify-center py-2">
                <BudgetRing spent={spent} budget={budgetAmount} pace={pace} />
              </div>

              {budgetAmount > 0 ? (
                <>
                  <p className="text-center text-sm text-ink-soft leading-relaxed mt-1 mb-4 px-2">
                    {pace.status === 'over' ? (
                      <>You&apos;re <span className="font-bold text-danger">{fmtCurrency(pace.over)}</span> past your budget with {pace.daysLeft} day{pace.daysLeft === 1 ? '' : 's'} to go.</>
                    ) : pace.status === 'at_risk' ? (
                      <>At this pace you&apos;ll finish around <span className="font-bold text-accent-yellow">{fmtCurrency(pace.projected)}</span> — about {fmtCurrency(pace.projected - budgetAmount)} over.</>
                    ) : pace.isCurrentMonth ? (
                      <>You&apos;re <span className="font-bold text-success">{fmtCurrency(Math.abs(pace.aheadBy))}</span> {pace.aheadBy >= 0 ? 'under' : 'over'} where an even pace would put you today.</>
                    ) : (
                      <>You finished {monthLabel} at <span className="font-bold text-ink">{fmtCurrency(spent)}</span>.</>
                    )}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <PaceStat
                      icon={Wallet}
                      label="Left"
                      value={fmtCurrency(pace.left)}
                      hint={`${pace.usedPct}% used`}
                      tone={pace.left > 0 ? 'ink' : 'danger'}
                    />
                    <PaceStat
                      icon={CalendarDays}
                      label="Per day"
                      value={pace.daysLeft > 0 ? fmtCurrency(pace.dailyAllowance) : '—'}
                      hint={pace.daysLeft > 0 ? `for ${pace.daysLeft} day${pace.daysLeft === 1 ? '' : 's'}` : 'month over'}
                    />
                    <PaceStat
                      icon={TrendingUp}
                      label="Projected"
                      value={fmtCurrency(pace.projected)}
                      hint="at this pace"
                      tone={pace.projected > budgetAmount ? 'danger' : 'success'}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center mt-2">
                  <p className="text-sm text-ink-soft leading-relaxed px-2">
                    Pick roughly what you want to spend this month. Everything else on this page works off that number.
                  </p>
                  <button onClick={() => setEditing(true)} className="btn-primary mx-auto mt-4">
                    <Wallet className="w-4 h-4" />
                    {data?.suggested > 0 ? `Start at ${fmtCurrency(data.suggested)}` : 'Set my budget'}
                  </button>
                  {data?.suggested > 0 && (
                    <p className="text-[11px] text-ink-faint mt-2">Based on your last few months</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* AI coach */}
        <AiCoach
          insight={insight}
          generatedAt={generatedAt}
          loading={coachLoading}
          error={coachError}
          note={coachNote}
          stale={insightStale}
          onAnalyze={analyze}
          onApplyBudget={(amount) => saveBudget(amount, 'ai')}
          onAcceptChallenge={acceptChallenge}
          acceptedTitles={acceptedTitles}
          budgetAmount={budgetAmount}
        />
      </div>

      {/* Challenges */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-accent-yellow" />
          <h2 className="font-display text-sm font-bold text-ink">Your challenges</h2>
          {active.length > 0 && (
            <span className="text-[11px] font-bold text-accent bg-accent/12 px-2 py-0.5 rounded-full">
              {active.length} running
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[0, 1].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : active.length === 0 && past.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-3xl mb-2">🔥</div>
            <p className="text-ink font-medium text-sm mb-1">No challenges yet</p>
            <p className="text-ink-faint text-xs">Ask the coach to analyse your spending and it&apos;ll set you a few.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {active.map((c) => (
              <ChallengeCard key={c._id} challenge={c} onAbandon={abandonChallenge} />
            ))}
            {past.map((c) => (
              <ChallengeCard key={c._id} challenge={c} onAbandon={abandonChallenge} />
            ))}
          </div>
        )}
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)}>
        <BudgetEditor
          current={budgetAmount}
          suggested={data?.suggested || 0}
          monthLabel={monthLabel}
          onSave={saveBudget}
          onClear={clearBudget}
          onClose={() => setEditing(false)}
        />
      </Sheet>

      <Sheet open={showForm} onClose={() => setShowForm(false)}>
        <ExpenseForm
          onSuccess={() => { setShowForm(false); fetchBudget(); fetchChallenges() }}
          onClose={() => setShowForm(false)}
        />
      </Sheet>

      <BottomNav onAdd={() => setShowForm(true)} />
    </div>
  )
}
