import { auth, currentUser } from '@clerk/nextjs/server'
import { connectDB } from './mongodb'
import User from '@/models/User'

async function resolveUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  await connectDB()

  const existing = await User.findOne({ clerkId })
  if (existing) return existing

  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase()
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || email

  return User.findOneAndUpdate(
    { email },
    { $set: { clerkId }, $setOnInsert: { name, email } },
    { upsert: true, new: true }
  )
}

export async function getAuthUser() {
  const user = await resolveUser()
  if (!user) return null
  return { userId: user._id.toString(), email: user.email }
}

export async function getTokenFromRequest() {
  return getAuthUser()
}
