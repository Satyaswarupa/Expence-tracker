import { connectDB } from '@/lib/mongodb'
import Challenge from '@/models/Challenge'
import { getTokenFromRequest } from '@/lib/auth'

export async function PATCH(request, { params }) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json().catch(() => ({}))

    // Giving up is the only status a user sets by hand — completed/failed are
    // decided by the expense log in GET /api/challenges.
    if (body?.status !== 'abandoned') {
      return Response.json({ error: 'Unsupported update.' }, { status: 400 })
    }

    await connectDB()

    const challenge = await Challenge.findOneAndUpdate(
      { _id: id, userId: payload.userId, status: 'active' },
      { $set: { status: 'abandoned' } },
      { new: true }
    )
    if (!challenge) return Response.json({ error: 'Challenge not found' }, { status: 404 })

    return Response.json({ challenge })
  } catch (err) {
    console.error('Update challenge error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const challenge = await Challenge.findOneAndDelete({ _id: id, userId: payload.userId })
    if (!challenge) return Response.json({ error: 'Challenge not found' }, { status: 404 })

    return Response.json({ message: 'Challenge removed' })
  } catch (err) {
    console.error('Delete challenge error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
