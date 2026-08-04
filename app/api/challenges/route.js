import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import Challenge from '@/models/Challenge'
import Expense from '@/models/Expense'
import { getTokenFromRequest } from '@/lib/auth'
import { CATEGORIES } from '@/lib/budget'

const MAX_ACTIVE = 5

/**
 * Recompute every challenge's progress from the expense log, and settle the ones
 * whose window has closed (or that have already blown their cap). Progress is
 * never stored, so editing or deleting an expense always reflows the challenge.
 */
export async function decorateChallenges(userIdStr, challenges, now = new Date()) {
  if (!challenges.length) return []

  const userId = new mongoose.Types.ObjectId(userIdStr)
  const from = new Date(Math.min(...challenges.map((c) => new Date(c.startDate).getTime())))
  const to = new Date(Math.max(...challenges.map((c) => new Date(c.endDate).getTime())))

  // One pass over the widest window, then bucket in memory — challenge counts are small
  const expenses = await Expense.find(
    { userId, date: { $gte: from, $lte: to } },
    { amount: 1, category: 1, date: 1 }
  ).lean()

  const settled = []

  const decorated = challenges.map((c) => {
    const start = new Date(c.startDate)
    const end = new Date(c.endDate)
    const spent = expenses.reduce((sum, e) => {
      if (e.date < start || e.date > end) return sum
      if (c.scope === 'category' && e.category !== c.category) return sum
      return sum + e.amount
    }, 0)

    let status = c.status
    if (status === 'active') {
      if (spent > c.targetAmount) status = 'failed'
      else if (now > end) status = 'completed'
      if (status !== c.status) settled.push({ id: c._id, status })
    }

    const msLeft = end - now
    const daysLeft = Math.max(0, Math.ceil(msLeft / 86400000))
    const daysTotal = Math.max(1, Math.ceil((end - start) / 86400000))

    return {
      ...c,
      status,
      spent: Math.round(spent),
      remaining: Math.round(Math.max(0, c.targetAmount - spent)),
      usedPct: c.targetAmount > 0 ? Math.min(200, Math.round((spent / c.targetAmount) * 100)) : spent > 0 ? 200 : 0,
      daysLeft,
      daysTotal,
    }
  })

  if (settled.length) {
    await Challenge.bulkWrite(
      settled.map((s) => ({
        updateOne: { filter: { _id: s.id, userId }, update: { $set: { status: s.status } } },
      }))
    )
  }

  return decorated
}

export async function GET(request) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    // Fetched separately so a pile of finished challenges can never push the
    // running ones out of the result. Soonest deadline first among the active.
    const [activeDocs, pastDocs] = await Promise.all([
      Challenge.find({ userId: payload.userId, status: 'active' }).sort({ endDate: 1 }).lean(),
      Challenge.find({ userId: payload.userId, status: { $ne: 'active' } }).sort({ endDate: -1 }).limit(12).lean(),
    ])

    // Decorate together, then split on the settled status — an active challenge
    // whose window closed just now belongs in `past`.
    const decorated = await decorateChallenges(payload.userId, [...activeDocs, ...pastDocs])

    return Response.json({
      active: decorated.filter((c) => c.status === 'active'),
      past: decorated.filter((c) => c.status !== 'active'),
    })
  } catch (err) {
    console.error('Get challenges error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))

    const title = (body?.title || '').toString().trim().slice(0, 120)
    const targetAmount = parseFloat(body?.targetAmount)
    const days = parseInt(body?.days, 10)

    if (!title) return Response.json({ error: 'A challenge needs a title.' }, { status: 400 })
    if (!Number.isFinite(targetAmount) || targetAmount < 0) {
      return Response.json({ error: 'Enter a target amount.' }, { status: 400 })
    }
    if (!Number.isFinite(days) || days < 1 || days > 90) {
      return Response.json({ error: 'Challenges run between 1 and 90 days.' }, { status: 400 })
    }

    const scope = body?.scope === 'category' ? 'category' : 'total'
    const category = scope === 'category' && CATEGORIES.includes(body?.category) ? body.category : null
    if (scope === 'category' && !category) {
      return Response.json({ error: 'Pick a valid category for this challenge.' }, { status: 400 })
    }

    await connectDB()

    const activeCount = await Challenge.countDocuments({ userId: payload.userId, status: 'active' })
    if (activeCount >= MAX_ACTIVE) {
      return Response.json(
        { error: `You already have ${MAX_ACTIVE} challenges running. Finish or drop one first.` },
        { status: 409 }
      )
    }

    // Starts today at midnight so today's expenses count toward it
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + days)
    end.setHours(23, 59, 59, 999)

    const challenge = await Challenge.create({
      userId: payload.userId,
      title,
      description: (body?.description || '').toString().trim().slice(0, 400),
      scope,
      category,
      targetAmount: Math.round(targetAmount),
      difficulty: ['easy', 'medium', 'hard'].includes(body?.difficulty) ? body.difficulty : 'medium',
      startDate: start,
      endDate: end,
      status: 'active',
      source: body?.source === 'user' ? 'user' : 'ai',
    })

    const [decorated] = await decorateChallenges(payload.userId, [challenge.toObject()])

    return Response.json({ challenge: decorated }, { status: 201 })
  } catch (err) {
    console.error('Create challenge error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
