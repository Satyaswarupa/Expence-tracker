// Prompt, response schema and output clamping for the AI money coach.
// Kept out of the route so the contract with the model can be exercised on its own.
import { CATEGORIES } from '@/lib/budget'

// Gemini uses an OpenAPI-subset schema (UPPERCASE types, no additionalProperties)
export const INSIGHT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    headline: {
      type: 'STRING',
      description: 'One sentence summarising the month so far, naming the single biggest thing to fix. Max 140 characters.',
    },
    status: {
      type: 'STRING',
      enum: ['on_track', 'at_risk', 'over', 'no_data'],
      description: 'How the month is going against the budget.',
    },
    observations: {
      type: 'ARRAY',
      description: 'Two to four things worth noticing about where the money went. Compare against the previous months when useful.',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING', description: 'Short label, e.g. "Food is up 62%".' },
          detail: { type: 'STRING', description: 'One sentence with the concrete rupee figures behind it.' },
          category: { type: 'STRING', description: 'The category this is about, if any.' },
          tone: { type: 'STRING', enum: ['good', 'warn', 'bad'] },
        },
        required: ['title', 'detail', 'tone'],
        propertyOrdering: ['title', 'detail', 'category', 'tone'],
      },
    },
    savings: {
      type: 'ARRAY',
      description: 'Two to four specific, realistic cuts. Each must name a rupee amount the user could keep every month.',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING', description: 'The action, e.g. "Cook two dinners a week".' },
          detail: { type: 'STRING', description: 'One sentence on how, grounded in what they actually spent.' },
          category: { type: 'STRING', description: 'The category it comes out of.' },
          monthlySaving: { type: 'NUMBER', description: 'Rupees saved per month if they do this. Be conservative.' },
        },
        required: ['title', 'detail', 'monthlySaving'],
        propertyOrdering: ['title', 'detail', 'category', 'monthlySaving'],
      },
    },
    suggestedBudget: {
      type: 'OBJECT',
      description: 'A monthly spending target that is tighter than their recent average but genuinely reachable.',
      properties: {
        amount: { type: 'NUMBER', description: 'Rupees per month. Round to the nearest 500.' },
        reason: { type: 'STRING', description: 'One sentence on why this number is the right stretch.' },
      },
      required: ['amount', 'reason'],
      propertyOrdering: ['amount', 'reason'],
    },
    challenges: {
      type: 'ARRAY',
      description: 'Two or three short, winnable spending challenges tailored to their weak spots.',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING', description: 'Punchy name, e.g. "No delivery for 10 days".' },
          description: { type: 'STRING', description: 'One sentence on the rule and what it saves.' },
          scope: { type: 'STRING', enum: ['category', 'total'], description: 'Whether the cap covers one category or all spending.' },
          category: { type: 'STRING', description: 'Required when scope is category.' },
          targetAmount: { type: 'NUMBER', description: 'The rupee cap for the whole challenge window (not per day).' },
          days: { type: 'NUMBER', description: 'Length in days, between 3 and 30.' },
          difficulty: { type: 'STRING', enum: ['easy', 'medium', 'hard'] },
        },
        required: ['title', 'description', 'scope', 'targetAmount', 'days', 'difficulty'],
        propertyOrdering: ['title', 'description', 'scope', 'category', 'targetAmount', 'days', 'difficulty'],
      },
    },
  },
  required: ['headline', 'status', 'observations', 'savings', 'suggestedBudget', 'challenges'],
  propertyOrdering: ['headline', 'status', 'observations', 'savings', 'suggestedBudget', 'challenges'],
}

export function systemPrompt() {
  return [
    'You are the money coach inside MoneyJot, a personal expense tracker used in India. All amounts are Indian rupees.',
    'You are given one user\'s real spending data as JSON: this month by category, the previous months for comparison, their most repeated purchases, and their budget if they set one.',
    'Your job is to tell them where the money is going, what they can realistically claw back, what monthly target to aim for, and give them a few short challenges.',
    '',
    'Rules:',
    '- Use their actual numbers. Every claim must be traceable to the data given — never invent a category, a merchant, or an amount.',
    '- Compare this month against the previous months when the data supports it. If there is only one month of data, say so plainly instead of inventing trends.',
    '- Ignore categories with tiny amounts. Focus on the two or three that actually move the total.',
    '- Bills, Health, Education and Investment are mostly non-negotiable — do not suggest cutting them unless they are wildly out of line. Prefer Food, Entertainment, Shopping, Grocery and Transport for savings.',
    '- Savings must be conservative and concrete. "Cut food by 30%" is bad; "Cook two dinners a week instead of ordering, around ₹1,200/month" is good.',
    '- suggestedBudget must be below their recent average but above the floor of what they clearly cannot avoid. A 5-15% trim is usually right. Round to the nearest 500.',
    '- If they already set a budget, only propose a different number when theirs does not match their history. If you are raising it, say so outright in the reason and explain why their current one is not reachable yet.',
    '- Challenges must be short and winnable. targetAmount is the cap for the entire window. Set it slightly below what they currently spend in that window, not at zero, unless the challenge is explicitly a no-spend one.',
    '- Do not repeat a challenge the user already has running.',
    '- Write every amount with the rupee symbol and Indian digit grouping: ₹1,200 and ₹24,300, never "1200 rupees".',
    '- Write like a blunt friend who is good with money: short sentences, second person, no jargon, no emoji, no markdown.',
  ].join('\n')
}

/**
 * Identity of the spending picture the analysis was based on. If this hasn't
 * moved, a re-analysis would be the same model call on the same numbers, so the
 * route serves the cached insight instead of spending tokens on it.
 *
 * Category totals are included so recategorising an expense — which leaves the
 * month's total and count untouched — still counts as a change.
 */
export function contextFingerprint(ctx) {
  return [
    ctx.month,
    ctx.spent,
    ctx.transactions,
    ctx.budget || 0,
    ctx.byCategory.map((c) => `${c.category}:${c.total}`).join(','),
    ctx.running.join('|'),
  ].join('~')
}

// The model is a suggestion engine, not a source of truth — everything it returns
// is clamped before it reaches the UI or the database.
export function sanitize(raw, fallbackStatus) {
  const str = (v, max) => (v == null ? '' : v.toString().trim().slice(0, max))
  const cat = (v) => (CATEGORIES.includes(v) ? v : null)
  const num = (v) => {
    const n = parseFloat(v)
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : null
  }

  const observations = (Array.isArray(raw?.observations) ? raw.observations : [])
    .map((o) => ({
      title: str(o?.title, 90),
      detail: str(o?.detail, 240),
      category: cat(o?.category),
      tone: ['good', 'warn', 'bad'].includes(o?.tone) ? o.tone : 'warn',
    }))
    .filter((o) => o.title && o.detail)
    .slice(0, 4)

  const savings = (Array.isArray(raw?.savings) ? raw.savings : [])
    .map((s) => ({
      title: str(s?.title, 90),
      detail: str(s?.detail, 240),
      category: cat(s?.category),
      monthlySaving: num(s?.monthlySaving),
    }))
    .filter((s) => s.title && s.monthlySaving > 0)
    .slice(0, 4)

  const challenges = (Array.isArray(raw?.challenges) ? raw.challenges : [])
    .map((c) => {
      const scope = c?.scope === 'category' ? 'category' : 'total'
      const category = cat(c?.category)
      const days = num(c?.days)
      return {
        title: str(c?.title, 90),
        description: str(c?.description, 240),
        // A category challenge without a valid category can't be scored — widen it
        scope: scope === 'category' && category ? 'category' : 'total',
        category: scope === 'category' ? category : null,
        targetAmount: num(c?.targetAmount),
        days: days ? Math.min(30, Math.max(3, days)) : 7,
        difficulty: ['easy', 'medium', 'hard'].includes(c?.difficulty) ? c.difficulty : 'medium',
      }
    })
    .filter((c) => c.title && c.targetAmount !== null)
    .slice(0, 3)

  const suggestedAmount = num(raw?.suggestedBudget?.amount)

  return {
    headline: str(raw?.headline, 160),
    status: ['on_track', 'at_risk', 'over', 'no_data'].includes(raw?.status) ? raw.status : fallbackStatus,
    observations,
    savings,
    suggestedBudget: suggestedAmount > 0
      ? { amount: Math.round(suggestedAmount / 500) * 500 || suggestedAmount, reason: str(raw?.suggestedBudget?.reason, 240) }
      : null,
    challenges,
    totalMonthlySaving: savings.reduce((sum, s) => sum + s.monthlySaving, 0),
  }
}
