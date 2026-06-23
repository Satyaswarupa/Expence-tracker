import { connectDB } from '@/lib/mongodb'
import PendingPayment from '@/models/PendingPayment'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(request) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const payments = await PendingPayment.find({ userId: payload.userId }).sort({ date: -1 })

    return Response.json({ payments })
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { person, totalAmount, paidAmount, note, paymentMethod, date } = await request.json()

    if (!person?.trim() || !totalAmount || totalAmount <= 0) {
      return Response.json({ error: 'Person and total amount are required' }, { status: 400 })
    }

    const paid = paidAmount ? parseFloat(paidAmount) : 0
    if (paid < 0 || paid > parseFloat(totalAmount)) {
      return Response.json({ error: 'Amount paid must be between 0 and the total amount' }, { status: 400 })
    }

    await connectDB()

    const payment = await PendingPayment.create({
      userId: payload.userId,
      person: person.trim(),
      totalAmount: parseFloat(totalAmount),
      paidAmount: paid,
      note: note || '',
      paymentMethod: paymentMethod || 'Cash',
      date: date ? new Date(date) : new Date(),
    })

    return Response.json({ payment }, { status: 201 })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
