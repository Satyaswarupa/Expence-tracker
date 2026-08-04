import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import Expense from '@/models/Expense'
import Budget from '@/models/Budget'
import Challenge from '@/models/Challenge'
import { getTokenFromRequest } from '@/lib/auth'
import { callGemini, hasGeminiKey } from '@/lib/gemini'
import { INSIGHT_SCHEMA, systemPrompt, sanitize, contextFingerprint } from '@/lib/coachPrompt'
import { MONTH_NAMES, budgetPace, daysInMonth } from '@/lib/budget'

// Everything the model is allowed to reason about, small enough to stay cheap
async function buildContext(userIdStr, month, year) {
  const userId = new mongoose.Types.ObjectId(userIdStr)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  const historyStart = new Date(year, month - 4, 1)

  const [budgetDoc, thisMonth, byCategory, prevByMonth, repeats, activeChallenges] = await Promise.all([
    Budget.findOne({ userId, month, year }).lean(),

    Expense.aggregate([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),

    Expense.aggregate([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),

    Expense.aggregate([
      { $match: { userId, date: { $gte: historyStart, $lt: start } } },
      {
        $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' }, category: '$category' },
          total: { $sum: '$amount' },
        },
      },
    ]),

    // Repeated purchases (same label) — this is where habits show up
    Expense.aggregate([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { title: { $toLower: '$title' }, category: '$category' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gte: 2 } } },
      { $sort: { total: -1 } },
      { $limit: 8 },
    ]),

    Challenge.find({ userId, status: 'active' }, { title: 1, category: 1, targetAmount: 1 }).lean(),
  ])

  // Fold the previous-month rows into one entry per month, keeping only each
  // month's five biggest categories — the tail doesn't change the advice.
  const prevMap = new Map()
  for (const row of prevByMonth) {
    const key = `${row._id.year}-${row._id.month}`
    if (!prevMap.has(key)) {
      prevMap.set(key, { month: MONTH_NAMES[row._id.month - 1], total: 0, byCategory: {} })
    }
    const entry = prevMap.get(key)
    entry.total += row.total
    entry.byCategory[row._id.category] = Math.round(row.total)
  }
  const previousMonths = [...prevMap.values()].map((m) => ({
    month: m.month,
    total: Math.round(m.total),
    top: Object.fromEntries(
      Object.entries(m.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5)
    ),
  }))

  const spent = Math.round(thisMonth[0]?.total || 0)
  const budget = budgetDoc?.amount || 0
  const pace = budgetPace({ budget, spent, month, year })
  const avgPrevious = previousMonths.length
    ? Math.round(previousMonths.reduce((s, m) => s + m.total, 0) / previousMonths.length)
    : 0

  // Only what the model actually reasons from. Anything it can derive (days left,
  // today's date) or that is too small to matter (the long tail of categories) is
  // left out — every field here is paid for on each call.
  return {
    hasData: (thisMonth[0]?.count || 0) > 0 || previousMonths.length > 0,
    context: {
      month: `${MONTH_NAMES[month - 1]} ${year}`,
      day: `${pace.daysElapsed} of ${daysInMonth(month, year)}`,
      budget: budget || null,
      spent,
      transactions: thisMonth[0]?.count || 0,
      projected: pace.projected,
      avgPrevMonths: avgPrevious || null,
      byCategory: byCategory
        .slice(0, 6)
        .map((c) => ({ category: c._id, total: Math.round(c.total), count: c.count })),
      prevMonths: previousMonths,
      repeats: repeats.slice(0, 5).map((r) => ({
        item: r._id.title,
        category: r._id.category,
        times: r.count,
        total: Math.round(r.total),
      })),
      running: activeChallenges.map((c) => c.title),
    },
  }
}

// Cached analysis for the month, so opening the page doesn't spend a model call
export async function GET(request) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const { searchParams } = request.nextUrl
    const month = parseInt(searchParams.get('month'), 10) || now.getMonth() + 1
    const year = parseInt(searchParams.get('year'), 10) || now.getFullYear()

    await connectDB()
    const doc = await Budget.findOne({ userId: payload.userId, month, year }, { insight: 1 }).lean()

    return Response.json({
      insight: doc?.insight?.data || null,
      generatedAt: doc?.insight?.generatedAt || null,
      configured: hasGeminiKey(),
    })
  } catch (err) {
    console.error('Get insights error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    if (!hasGeminiKey()) {
      return Response.json(
        { error: 'AI is not configured. Add GEMINI_API_KEY to your environment to enable the coach.' },
        { status: 503 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const now = new Date()
    const month = parseInt(body?.month, 10) || now.getMonth() + 1
    const year = parseInt(body?.year, 10) || now.getFullYear()
    if (month < 1 || month > 12 || year < 2000 || year > 2200) {
      return Response.json({ error: 'Invalid month.' }, { status: 400 })
    }

    await connectDB()

    const { hasData, context } = await buildContext(payload.userId, month, year)
    if (!hasData) {
      return Response.json(
        { error: 'Add a few expenses first — there is nothing to analyse yet.' },
        { status: 400 }
      )
    }

    // Re-analysing an unchanged month would spend a full call to reproduce the
    // answer already on file, so serve that instead. This is what makes the
    // refresh button free until the user's spending actually moves.
    const fingerprint = contextFingerprint(context)
    const existing = await Budget.findOne({ userId: payload.userId, month, year }, { insight: 1 }).lean()
    if (existing?.insight?.data && existing.insight.fingerprint === fingerprint) {
      return Response.json({
        insight: existing.insight.data,
        generatedAt: existing.insight.generatedAt,
        reused: true,
      })
    }

    let raw
    try {
      raw = await callGemini({
        system: systemPrompt(),
        user: JSON.stringify(context),
        schema: INSIGHT_SCHEMA,
        temperature: 0.4,
        timeoutMs: 45000,
        // Guard against a runaway response; observed output is 420-690 tokens
        maxOutputTokens: 2048,
      })
    } catch (err) {
      console.error('AI insight error:', err)
      return Response.json({ error: 'The coach is unavailable right now. Please try again.' }, { status: 502 })
    }

    if (!raw) {
      return Response.json({ error: 'The coach had nothing to say. Please try again.' }, { status: 502 })
    }

    const fallbackStatus = context.budget
      ? budgetPace({ budget: context.budget, spent: context.spent, month, year }).status
      : 'no_data'
    const insight = sanitize(raw, fallbackStatus)
    const generatedAt = new Date()

    await Budget.findOneAndUpdate(
      { userId: payload.userId, month, year },
      {
        $set: {
          insight: {
            generatedAt,
            data: insight,
            fingerprint,
            basis: { spent: context.spent, count: context.transactions, budget: context.budget || 0 },
          },
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    )

    return Response.json({ insight, generatedAt })
  } catch (err) {
    console.error('AI insight route error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
