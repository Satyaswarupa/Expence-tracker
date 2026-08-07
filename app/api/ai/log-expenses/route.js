import { revalidateTag } from 'next/cache'
import { connectDB } from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { getTokenFromRequest } from '@/lib/auth'
import { CATEGORIES } from '@/lib/budget'

const PAYMENT_METHODS = ['Cash', 'UPI']

// Inserts already-structured expenses straight into the DB — used by the
// voice assistant's log_expense tool call, where Gemini's live audio model
// has already done the extraction, so there's no text to re-parse.
export async function POST(request) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

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

    const created = await Promise.all(
      valid.map((e) =>
        Expense.create({
          userId: payload.userId,
          title: e.title || e.category,
          amount: e.amount,
          category: e.category,
          description: 'Added via voice assistant',
          paymentMethod: e.paymentMethod,
          date: new Date(),
        })
      )
    )

    revalidateTag(`expenses:${payload.userId}`)
    revalidateTag(`expense-stats:${payload.userId}`)

    return Response.json({ created }, { status: 201 })
  } catch (err) {
    console.error('Voice log-expenses error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
