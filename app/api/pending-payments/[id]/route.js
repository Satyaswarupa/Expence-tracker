import { revalidateTag } from 'next/cache'
import { connectDB } from '@/lib/mongodb'
import PendingPayment from '@/models/PendingPayment'
import { getTokenFromRequest } from '@/lib/auth'

export async function PUT(request, { params }) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { addPayment } = await request.json()

    const amount = parseFloat(addPayment)
    if (!amount || amount <= 0) {
      return Response.json({ error: 'Enter a valid payment amount' }, { status: 400 })
    }

    await connectDB()

    const existing = await PendingPayment.findOne({ _id: id, userId: payload.userId })
    if (!existing) return Response.json({ error: 'Payment not found' }, { status: 404 })

    const newPaidAmount = Math.min(existing.paidAmount + amount, existing.totalAmount)

    const payment = await PendingPayment.findOneAndUpdate(
      { _id: id, userId: payload.userId },
      { paidAmount: newPaidAmount },
      { returnDocument: 'after', runValidators: true }
    )

    revalidateTag(`pending-payments:${payload.userId}`)

    return Response.json({ payment })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const payment = await PendingPayment.findOneAndDelete({ _id: id, userId: payload.userId })
    if (!payment) return Response.json({ error: 'Payment not found' }, { status: 404 })

    revalidateTag(`pending-payments:${payload.userId}`)

    return Response.json({ message: 'Payment removed' })
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
