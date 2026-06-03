import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { signToken, setAuthCookie } from '@/lib/auth'

export async function POST(request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return Response.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    await connectDB()

    const existing = await User.findOne({ email })
    if (existing) {
      return Response.json({ error: 'Email already registered' }, { status: 409 })
    }

    const user = await User.create({ name, email, password })
    const token = signToken({ userId: user._id.toString(), email: user.email })
    await setAuthCookie(token)

    return Response.json({ user: user.toJSON(), message: 'Account created successfully' }, { status: 201 })
  } catch (err) {
    console.error('Signup error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
