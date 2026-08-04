// Pure budget/pacing math. Lives here so the API and the client agree on the
// numbers — the page recomputes locally after an optimistic budget change.

// Single source of truth for the category list — models/Expense.js takes its enum
// from here, and the AI routes validate against it.
export const CATEGORIES = ['Food', 'Grocery', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Education', 'Bills', 'Fuel', 'Labour', 'Material', 'Investment', 'Other']

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate()
}

/**
 * Where the user stands in a budgeted month.
 *
 * For the month in progress `dayOfMonth` is today; for a past month the whole
 * month has elapsed, so pace and projection collapse to the actual total.
 */
export function budgetPace({ budget, spent, month, year, now = new Date() }) {
  const total = daysInMonth(month, year)
  const isCurrent = month === now.getMonth() + 1 && year === now.getFullYear()
  const isFuture = new Date(year, month - 1, 1) > now
  const elapsed = isFuture ? 0 : isCurrent ? now.getDate() : total
  const remaining = Math.max(0, total - elapsed)

  const left = Math.max(0, budget - spent)
  const over = Math.max(0, spent - budget)
  const usedPct = budget > 0 ? (spent / budget) * 100 : 0

  // What you'd finish the month at if the rest of it looks like the days so far
  const perDay = elapsed > 0 ? spent / elapsed : 0
  const projected = isCurrent ? Math.round(perDay * total) : spent

  // What's left to spend, spread evenly over the days that remain
  const dailyAllowance = remaining > 0 ? Math.round(left / remaining) : 0

  // Budget you "should" have used by now if you spent evenly
  const paceTarget = budget > 0 ? (budget / total) * elapsed : 0
  const aheadBy = Math.round(paceTarget - spent) // positive = under pace, good

  let status = 'no_budget'
  if (budget > 0) {
    if (spent > budget) status = 'over'
    else if (projected > budget * 1.02) status = 'at_risk'
    else status = 'on_track'
  }

  return {
    daysTotal: total,
    daysElapsed: elapsed,
    daysLeft: remaining,
    isCurrentMonth: isCurrent,
    left,
    over,
    usedPct: Math.round(usedPct),
    projected,
    dailyAllowance,
    aheadBy,
    status,
  }
}

export const STATUS_LABEL = {
  on_track: 'On track',
  at_risk: 'At risk',
  over: 'Over budget',
  no_budget: 'No budget set',
  no_data: 'Not enough data',
}

// Semantic colour token per status — keeps the ring, pills and copy in sync
export const STATUS_TONE = {
  on_track: 'success',
  at_risk: 'accent-yellow',
  over: 'danger',
  no_budget: 'ink-faint',
  no_data: 'ink-faint',
}

export const fmtCurrency = (n) =>
  `₹${Math.round(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
