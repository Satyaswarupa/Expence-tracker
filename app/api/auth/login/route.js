import { createClerkClient } from '@clerk/backend'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email?.trim() || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const userList = await clerk.users.getUserList({ emailAddress: [email.trim().toLowerCase()] })
    const user = userList.data[0]
    if (!user) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    try {
      await clerk.users.verifyPassword({ userId: user.id, password })
    } catch {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: user.id,
      expiresInSeconds: 60,
    })

    return Response.json({ ticket: signInToken.token })
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
