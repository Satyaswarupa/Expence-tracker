import { connectDB } from '@/lib/mongodb'
import Lending from '@/models/Lending'
import { getTokenFromRequest } from '@/lib/auth'

export async function DELETE(request, { params }) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const lending = await Lending.findOneAndDelete({ _id: id, userId: payload.userId })
    if (!lending) return Response.json({ error: 'Lending not found' }, { status: 404 })

    return Response.json({ message: 'Lending removed' })
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
