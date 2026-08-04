import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import Budget from '@/models/Budget'
import Expense from '@/models/Expense'
import { getTokenFromRequest } from '@/lib/auth'
import { budgetPace } from '@/lib/budget'

const MAX_BUDGET = 100000000 // ₹10 crore — a typo guard, not a real limit

function resolveMonth(searchParams) {
  const now = new Date()
  const month = parseInt(searchParams.get('month') || '', 10)
  const year = parseInt(searchParams.get('year') || '', 10)
  return {
    month: month >= 1 && month <= 12 ? month : now.getMonth() + 1,
    year: year >= 2000 && year <= 2200 ? year : now.getFullYear(),
  }
}

// Spend for a month plus the three months before it — the trailing average is
// what we suggest as a starting budget when the user has never set one.
async function loadSpending(userIdStr, month, year) {
  const userId = new mongoose.Types.ObjectId(userIdStr)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  const historyStart = new Date(year, month - 4, 1)

  const [current, history] = await Promise.all([
    Expense.aggregate([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: { userId, date: { $gte: historyStart, $lt: start } } },
      {
        $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ])

  const months = history.map((h) => ({ month: h._id.month, year: h._id.year, total: Math.round(h.total) }))
  const avg = months.length ? Math.round(months.reduce((s, m) => s + m.total, 0) / months.length) : 0

  return {
    spent: Math.round(current[0]?.total || 0),
    count: current[0]?.count || 0,
    history: months,
    // Rounded to the nearest ₹500 so the suggestion reads like a decision, not a mean
    suggested: avg ? Math.max(500, Math.round(avg / 500) * 500) : 0,
  }
}

export async function GET(request) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { month, year } = resolveMonth(request.nextUrl.searchParams)

    await connectDB()

    const [doc, spending] = await Promise.all([
      Budget.findOne({ userId: payload.userId, month, year }).lean(),
      loadSpending(payload.userId, month, year),
    ])

    const amount = doc?.amount || 0

    return Response.json({
      month,
      year,
      budget: amount > 0 ? { amount, source: doc.source } : null,
      spent: spending.spent,
      count: spending.count,
      history: spending.history,
      suggested: spending.suggested,
      pace: budgetPace({ budget: amount, spent: spending.spent, month, year }),
      // `stale` lets the page grey out the re-analyse button when a fresh call
      // would only reproduce the analysis already on file.
      insight: doc?.insight?.data
        ? {
            generatedAt: doc.insight.generatedAt,
            data: doc.insight.data,
            stale:
              (doc.insight.basis?.spent ?? -1) !== spending.spent ||
              (doc.insight.basis?.count ?? -1) !== spending.count ||
              (doc.insight.basis?.budget ?? -1) !== amount,
          }
        : null,
    })
  } catch (err) {
    console.error('Get budget error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const amount = parseFloat(body?.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json({ error: 'Enter a budget amount greater than zero.' }, { status: 400 })
    }
    if (amount > MAX_BUDGET) {
      return Response.json({ error: 'That budget looks too large — check the amount.' }, { status: 400 })
    }

    const now = new Date()
    const month = parseInt(body?.month, 10) || now.getMonth() + 1
    const year = parseInt(body?.year, 10) || now.getFullYear()
    if (month < 1 || month > 12 || year < 2000 || year > 2200) {
      return Response.json({ error: 'Invalid month.' }, { status: 400 })
    }

    await connectDB()

    const doc = await Budget.findOneAndUpdate(
      { userId: payload.userId, month, year },
      { $set: { amount: Math.round(amount), source: body?.source === 'ai' ? 'ai' : 'user' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean()

    const spending = await loadSpending(payload.userId, month, year)

    return Response.json({
      month,
      year,
      budget: { amount: doc.amount, source: doc.source },
      spent: spending.spent,
      pace: budgetPace({ budget: doc.amount, spent: spending.spent, month, year }),
    })
  } catch (err) {
    console.error('Set budget error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { month, year } = resolveMonth(request.nextUrl.searchParams)

    await connectDB()
    // Keep the doc so a cached insight survives — only the budget is cleared
    await Budget.updateOne({ userId: payload.userId, month, year }, { $set: { amount: 0 } })

    return Response.json({ message: 'Budget cleared' })
  } catch (err) {
    console.error('Clear budget error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
