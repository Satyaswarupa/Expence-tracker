import { createClerkClient } from '@clerk/backend'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export async function POST(request) {
  try {
    const { name, email, password } = await request.json()

    if (!name?.trim() || !email?.trim() || !password) {
      return Response.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const [firstName, ...rest] = name.trim().split(/\s+/)
    const lastName = rest.join(' ') || undefined

    const user = await clerk.users.createUser({
      emailAddress: [email.trim().toLowerCase()],
      password,
      firstName,
      lastName,
    })

    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: user.id,
      expiresInSeconds: 60,
    })

    return Response.json({ ticket: signInToken.token })
  } catch (err) {
    const apiError = err.errors?.[0]
    const message = apiError?.longMessage || apiError?.message || 'Signup failed'
    const status = err.status >= 400 && err.status < 500 ? err.status : 500
    return Response.json({ error: message }, { status })
  }
}
