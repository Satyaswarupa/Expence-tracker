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

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')

    const { error } = await signIn.ticket({ ticket: data.ticket })
    if (error) throw new Error(errorMessage(error, 'Login failed'))

    if (signIn.status !== 'complete') {
      throw new Error('Could not complete login')
    }

    const { error: finalizeError } = await signIn.finalize()
    if (finalizeError) throw new Error(errorMessage(finalizeError, 'Login failed'))
    await fetchMe()
  }

  async function signup(name, email, password) {
    if (!signIn) throw new Error('Auth is still loading, try again')

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Signup failed')

    const { error } = await signIn.ticket({ ticket: data.ticket })
    if (error) throw new Error(errorMessage(error, 'Signup failed'))

    if (signIn.status !== 'complete') {
      throw new Error('Could not complete signup')
    }

    const { error: finalizeError } = await signIn.finalize()
    if (finalizeError) throw new Error(errorMessage(finalizeError, 'Signup failed'))
    await fetchMe()
  }

  async function loginWithGoogle() {
    if (!signIn) throw new Error('Auth is still loading, try again')

    const { error } = await signIn.sso({
      strategy: 'oauth_google',
      redirectUrl: '/dashboard',
      redirectCallbackUrl: '/sso-callback',
    })
    if (error) throw new Error(errorMessage(error, 'Google sign-in failed'))
  }

  async function signupWithGoogle() {
    if (!signUp) throw new Error('Auth is still loading, try again')

    const { error } = await signUp.sso({
      strategy: 'oauth_google',
      redirectUrl: '/dashboard',
      redirectCallbackUrl: '/sso-callback',
    })
    if (error) throw new Error(errorMessage(error, 'Google sign-up failed'))
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
        loginWithGoogle,
        signupWithGoogle,
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
