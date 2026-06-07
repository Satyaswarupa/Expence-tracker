import { connectDB } from '@/lib/mongodb'
import Lending from '@/models/Lending'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(request) {
  try {
    const payload = getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const lendings = await Lending.find({ userId: payload.userId }).sort({ dateGiven: -1 })

    return Response.json({ lendings })
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const payload = getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { person, amount, note, paymentMethod, dateGiven, expectedReturnDate } = await request.json()

    if (!person?.trim() || !amount || amount <= 0) {
      return Response.json({ error: 'Person and amount are required' }, { status: 400 })
    }

    await connectDB()

    const lending = await Lending.create({
      userId: payload.userId,
      person: person.trim(),
      amount: parseFloat(amount),
      note: note || '',
      paymentMethod: paymentMethod || 'Cash',
      dateGiven: dateGiven ? new Date(dateGiven) : new Date(),
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
    })

    return Response.json({ lending }, { status: 201 })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
