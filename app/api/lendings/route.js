import { unstable_cache, revalidateTag } from 'next/cache'
import { connectDB } from '@/lib/mongodb'
import Lending from '@/models/Lending'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(request) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const getCachedLendings = unstable_cache(
      async (userId) => {
        await connectDB()
        return Lending.find({ userId }).sort({ dateGiven: -1 })
      },
      [payload.userId],
      { tags: [`lendings:${payload.userId}`], revalidate: false }
    )

    const lendings = await getCachedLendings(payload.userId)

    return Response.json({ lendings })
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const payload = await getTokenFromRequest(request)
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

    revalidateTag(`lendings:${payload.userId}`)

    return Response.json({ lending }, { status: 201 })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
