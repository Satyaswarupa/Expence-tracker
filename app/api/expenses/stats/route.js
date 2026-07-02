import { connectDB } from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { getTokenFromRequest } from '@/lib/auth'
import mongoose from 'mongoose'

export async function GET(request) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const userId = new mongoose.Types.ObjectId(payload.userId)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const { searchParams } = request.nextUrl
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    // byCategory match — scoped to the requested month when given, all-time otherwise
    const categoryMatch = { userId }
    if (month && year) {
      categoryMatch.date = {
        $gte: new Date(parseInt(year), parseInt(month) - 1, 1),
        $lt: new Date(parseInt(year), parseInt(month), 1),
      }
    }

    const [allTime, thisMonth, byCategory, monthlyTrend] = await Promise.all([
      Expense.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      Expense.aggregate([
        { $match: { userId, date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      Expense.aggregate([
        { $match: categoryMatch },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),

      Expense.aggregate([
        { $match: { userId, date: { $gte: startOfYear } } },
        {
          $group: {
            _id: { month: { $month: '$date' }, year: { $year: '$date' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ])

    return Response.json({
      allTime: allTime[0] || { total: 0, count: 0 },
      thisMonth: thisMonth[0] || { total: 0, count: 0 },
      byCategory,
      monthlyTrend,
    })
  } catch (err) {
    console.error('Stats error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
