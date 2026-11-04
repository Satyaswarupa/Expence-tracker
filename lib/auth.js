import { connectDB } from './mongodb'
import User from '@/models/User'
import jwt from 'jsonwebtoken'

const USER_CACHE_TTL_MS = 5 * 60 * 1000
let userCache = global.__userCache
if (!userCache) {
  userCache = global.__userCache = new Map()
}

export async function getAuthUser() {
  const token = typeof window === 'undefined' ? null : localStorage?.getItem('authToken')
  if (!token) return null

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    return { userId: decoded.userId, email: decoded.email }
  } catch {
    return null
  }
}

export async function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')

    const cached = userCache.get(decoded.userId)
    if (cached && cached.expiresAt > Date.now()) return cached.user

    await connectDB()
    const user = await User.findById(decoded.userId)

    if (user) {
      userCache.set(decoded.userId, { user, expiresAt: Date.now() + USER_CACHE_TTL_MS })
    }

    return decoded
  } catch {
    return null
  }
}
