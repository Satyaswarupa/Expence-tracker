import { connectDB } from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(request) {
  try {
    const payload = getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const { searchParams } = request.nextUrl
    const category = searchParams.get('category')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const limit = parseInt(searchParams.get('limit') || '100')

    const query = { userId: payload.userId }

    if (category && category !== 'All') query.category = category

    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1)
      const end = new Date(parseInt(year), parseInt(month), 1)
      query.date = { $gte: start, $lt: end }
    } else if (year) {
      const start = new Date(parseInt(year), 0, 1)
      const end = new Date(parseInt(year) + 1, 0, 1)
      query.date = { $gte: start, $lt: end }
    }

    const expenses = await Expense.find(query).sort({ date: -1 }).limit(limit)

    const total = expenses.reduce((sum, e) => sum + e.amount, 0)

    return Response.json({ expenses, total })
  } catch (err) {
    console.error('Get expenses error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const payload = getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, amount, category, description, date } = await request.json()

    if (!title || !amount || !category) {
      return Response.json({ error: 'Title, amount, and category are required' }, { status: 400 })
    }

    if (amount <= 0) {
      return Response.json({ error: 'Amount must be positive' }, { status: 400 })
    }

    await connectDB()

    const expense = await Expense.create({
      userId: payload.userId,
      title,
      amount: parseFloat(amount),
      category,
      description: description || '',
      date: date ? new Date(date) : new Date(),
    })

    if (global.io) {
      global.io.to(`user:${payload.userId}`).emit('expense:created', expense)
    }

    return Response.json({ expense }, { status: 201 })
  } catch (err) {
    console.error('Create expense error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
