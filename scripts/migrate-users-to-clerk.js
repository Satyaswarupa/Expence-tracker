// One-time migration: import existing Mongo users (with bcrypt password hashes) into Clerk,
// and stamp the resulting Clerk user id back onto each Mongo User document as `clerkId`.
// Run once with: node scripts/migrate-users-to-clerk.js
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const { createClerkClient } = require('@clerk/backend')

const envPath = path.join(__dirname, '..', '.env.local')
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const idx = trimmed.indexOf('=')
  if (idx === -1) continue
  const key = trimmed.slice(0, idx).trim()
  const val = trimmed.slice(idx + 1).trim()
  if (key && !process.env[key]) process.env[key] = val
}

if (!process.env.CLERK_SECRET_KEY) {
  console.error('Missing CLERK_SECRET_KEY in .env.local')
  process.exit(1)
}

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

const legacyUserSchema = new mongoose.Schema(
  { name: String, email: String, password: String, clerkId: String },
  { strict: false }
)
const LegacyUser = mongoose.model('LegacyUser', legacyUserSchema, 'users')

function splitName(name) {
  const [firstName, ...rest] = (name || '').trim().split(/\s+/)
  return { firstName: firstName || undefined, lastName: rest.join(' ') || undefined }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI)

  const users = await LegacyUser.find({ clerkId: { $exists: false } })
  console.log(`Found ${users.length} user(s) to migrate`)

  for (const user of users) {
    const { firstName, lastName } = splitName(user.name)
    const isBcryptHash = typeof user.password === 'string' && user.password.startsWith('$2')

    try {
      const clerkUser = await clerk.users.createUser({
        emailAddress: [user.email],
        firstName,
        lastName,
        skipPasswordChecks: true,
        ...(isBcryptHash
          ? { passwordDigest: user.password, passwordHasher: 'bcrypt' }
          : {}),
      })

      user.clerkId = clerkUser.id
      await user.save()

      console.log(`Migrated ${user.email} -> ${clerkUser.id}${isBcryptHash ? '' : ' (no password imported, needs password reset)'}`)
    } catch (err) {
      console.error(`Failed to migrate ${user.email}:`, err.errors?.[0]?.longMessage || err.message)
    }
  }

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
