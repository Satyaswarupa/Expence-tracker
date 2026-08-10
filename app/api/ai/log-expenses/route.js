import { revalidateTag } from 'next/cache'
import { connectDB } from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { getTokenFromRequest } from '@/lib/auth'
import { CATEGORIES } from '@/lib/budget'

const PAYMENT_METHODS = ['Cash', 'UPI']

// Inserts already-structured expenses straight into the DB — used by the
// voice assistant's log_expense tool call, where Gemini's live audio model
// has already done the extraction, so there's no text to re-parse.
// Temporary timing breakdown to find where voice-command latency actually
// goes (dev-only — DEBUG_TIMING removed once the slow hop is identified).
const DEBUG_TIMING = process.env.NODE_ENV !== 'production'

export async function POST(request) {
  const t0 = Date.now()
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const tAuth = Date.now()

    const body = await request.json().catch(() => ({}))
    const candidates = Array.isArray(body?.expenses) ? body.expenses : []
    const valid = candidates
      .map((e) => ({
        title: (e?.title || '').toString().trim().slice(0, 200),
        amount: parseFloat(e?.amount),
        category: CATEGORIES.includes(e?.category) ? e.category : 'Other',
        paymentMethod: PAYMENT_METHODS.includes(e?.paymentMethod) ? e.paymentMethod : 'Cash',
      }))
      .filter((e) => Number.isFinite(e.amount) && e.amount > 0)

    if (valid.length === 0) {
      return Response.json({ created: [] })
    }

    await connectDB()
    const tConnect = Date.now()

    const created = await Expense.insertMany(
      valid.map((e) => ({
        userId: payload.userId,
        title: e.title || e.category,
        amount: e.amount,
        category: e.category,
        description: 'Added via voice assistant',
        paymentMethod: e.paymentMethod,
        date: new Date(),
      }))
    )
    const tInsert = Date.now()

    revalidateTag(`expenses:${payload.userId}`)
    revalidateTag(`expense-stats:${payload.userId}`)

    if (DEBUG_TIMING) {
      console.log(
        `[log-expenses] auth=${tAuth - t0}ms connect=${tConnect - tAuth}ms insert=${tInsert - tConnect}ms total=${Date.now() - t0}ms`
      )
    }

    return Response.json({ created }, { status: 201 })
  } catch (err) {
    console.error('Voice log-expenses error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
