import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
  try {
    await clearAuthCookie()
    return Response.json({ message: 'Logged out successfully' })
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
