import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(request) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const user = await User.findById(payload.userId)
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    return Response.json({ user: user.toJSON() })
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
