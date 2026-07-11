import { revalidateTag } from 'next/cache'
import { connectDB } from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const expense = await Expense.findOne({ _id: id, userId: payload.userId })
    if (!expense) return Response.json({ error: 'Expense not found' }, { status: 404 })

    return Response.json({ expense })
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { title, amount, category, description, paymentMethod, date } = await request.json()

    await connectDB()

    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: payload.userId },
      {
        title: title?.trim() || category,
        amount: parseFloat(amount),
        category,
        description,
        paymentMethod: paymentMethod || 'Cash',
        date: date ? new Date(date) : undefined,
      },
      { returnDocument: 'after', runValidators: true }
    )

    if (!expense) return Response.json({ error: 'Expense not found' }, { status: 404 })

    if (global.io) {
      global.io.to(`user:${payload.userId}`).emit('expense:updated', expense)
    }

    revalidateTag(`expenses:${payload.userId}`)
    revalidateTag(`expense-stats:${payload.userId}`)

    return Response.json({ expense })
  } catch (err) {
    console.error('PUT /api/expenses/[id]:', err)
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const expense = await Expense.findOneAndDelete({ _id: id, userId: payload.userId })
    if (!expense) return Response.json({ error: 'Expense not found' }, { status: 404 })

    if (global.io) {
      global.io.to(`user:${payload.userId}`).emit('expense:deleted', { id })
    }

    revalidateTag(`expenses:${payload.userId}`)
    revalidateTag(`expense-stats:${payload.userId}`)

    return Response.json({ message: 'Expense deleted' })
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
