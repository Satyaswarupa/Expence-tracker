import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { signToken, setAuthCookie } from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email })
    if (!user) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = signToken({ userId: user._id.toString(), email: user.email })
    await setAuthCookie(token)

    return Response.json({ user: user.toJSON(), message: 'Login successful' })
  } catch (err) {
    console.error('Login error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
