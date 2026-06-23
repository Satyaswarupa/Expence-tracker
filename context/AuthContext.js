'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth as useClerkAuth, useSignIn, useSignUp } from '@clerk/nextjs'

const AuthContext = createContext(null)

function errorMessage(error, fallback) {
  return error?.longMessage || error?.message || fallback
}

export function AuthProvider({ children }) {
  const router = useRouter()
  const { isLoaded: clerkLoaded, isSignedIn, signOut } = useClerkAuth()
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [pendingClientTrust, setPendingClientTrust] = useState(false)

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    if (!clerkLoaded) return
    if (!isSignedIn) {
      setUser(null)
      setLoading(false)
      return
    }
    fetchMe().finally(() => setLoading(false))
  }, [clerkLoaded, isSignedIn, fetchMe])

  async function login(email, password) {
    if (!signIn) throw new Error('Auth is still loading, try again')

    const { error } = await signIn.password({ identifier: email, password })
    if (error) throw new Error(errorMessage(error, 'Login failed'))

    if (signIn.status === 'complete') {
      const { error: finalizeError } = await signIn.finalize()
      if (finalizeError) throw new Error(errorMessage(finalizeError, 'Login failed'))
      await fetchMe()
      return { needsVerification: false }
    }

    if (signIn.status === 'needs_client_trust') {
      const { error: codeError } = await signIn.mfa.sendEmailCode()
      if (codeError) throw new Error(errorMessage(codeError, 'Could not send verification code'))
      setPendingClientTrust(true)
      return { needsVerification: true }
    }

    throw new Error('This account needs additional verification that is not supported here')
  }

  async function verifyLoginCode(code) {
    if (!signIn) throw new Error('Auth is still loading, try again')

    const { error } = await signIn.mfa.verifyEmailCode({ code })
    if (error) throw new Error(errorMessage(error, 'Invalid verification code'))

    if (signIn.status !== 'complete') {
      throw new Error('Verification incomplete')
    }

    const { error: finalizeError } = await signIn.finalize()
    if (finalizeError) throw new Error(errorMessage(finalizeError, 'Login failed'))

    setPendingClientTrust(false)
    await fetchMe()
  }

  async function signup(name, email, password) {
    if (!signUp) throw new Error('Auth is still loading, try again')

    const [firstName, ...rest] = name.trim().split(' ')
    const lastName = rest.join(' ') || undefined

    const { error } = await signUp.password({ emailAddress: email, password, firstName, lastName })
    if (error) throw new Error(errorMessage(error, 'Signup failed'))

    if (signUp.status === 'complete') {
      const { error: finalizeError } = await signUp.finalize()
      if (finalizeError) throw new Error(errorMessage(finalizeError, 'Signup failed'))
      await fetchMe()
      return { needsVerification: false }
    }

    if (signUp.unverifiedFields.includes('email_address')) {
      const { error: codeError } = await signUp.verifications.sendEmailCode()
      if (codeError) throw new Error(errorMessage(codeError, 'Could not send verification code'))
      setPendingVerification(true)
      return { needsVerification: true }
    }

    throw new Error('Could not complete signup')
  }

  async function verifyEmail(code) {
    if (!signUp) throw new Error('Auth is still loading, try again')

    const { error } = await signUp.verifications.verifyEmailCode({ code })
    if (error) throw new Error(errorMessage(error, 'Invalid verification code'))

    if (signUp.status !== 'complete') {
      throw new Error('Verification incomplete')
    }

    const { error: finalizeError } = await signUp.finalize()
    if (finalizeError) throw new Error(errorMessage(finalizeError, 'Signup failed'))

    setPendingVerification(false)
    await fetchMe()
  }

  async function logout() {
    try {
      await signOut()
    } catch (err) {
      console.error('Sign out cleanup failed, session was still cleared:', err)
    }
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        fetchMe,
        pendingVerification,
        verifyEmail,
        pendingClientTrust,
        verifyLoginCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
