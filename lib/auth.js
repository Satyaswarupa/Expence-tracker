import { auth, currentUser } from '@clerk/nextjs/server'
import { connectDB } from './mongodb'
import User from '@/models/User'

// Per-warm-instance cache so repeat requests hitting the same Vercel serverless
// instance skip the Mongo round trip to resolve clerkId -> app user. Every
// authenticated route calls this, so on a cold/underloaded deployment this one
// query was adding a full DB round trip to the critical path of every request
// (including the voice assistant's log_expense tool call). Mirrors the
// global.mongoose caching pattern in lib/mongodb.js.
const USER_CACHE_TTL_MS = 5 * 60 * 1000
let userCache = global.__userCache
if (!userCache) {
  userCache = global.__userCache = new Map()
}

async function resolveUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const cached = userCache.get(clerkId)
  if (cached && cached.expiresAt > Date.now()) return cached.user

  await connectDB()

  let user = await User.findOne({ clerkId })

  if (!user) {
    const clerkUser = await currentUser()
    if (!clerkUser) return null

    const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase()
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || email

    user = await User.findOneAndUpdate(
      { email },
      { $set: { clerkId }, $setOnInsert: { name, email } },
      { upsert: true, new: true }
    )
  }

  if (user) userCache.set(clerkId, { user, expiresAt: Date.now() + USER_CACHE_TTL_MS })
  return user
}

export async function getAuthUser() {
  const user = await resolveUser()
  if (!user) return null
  return { userId: user._id.toString(), email: user.email }
}

export async function getTokenFromRequest() {
  return getAuthUser()
}
