'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [otpSent, setOtpSent] = useState(false)
  const [otpPhone, setOtpPhone] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      fetchMe(token).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const fetchMe = useCallback(async (token) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
        localStorage.removeItem('authToken')
      }
    } catch {
      setUser(null)
      localStorage.removeItem('authToken')
    }
  }, [])

  async function sendOtp(phone) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, action: 'send-otp' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP')

      setOtpPhone(phone)
      setOtpSent(true)
    } catch (err) {
      throw new Error(err.message)
    }
  }

  async function verifyOtp(otp) {
    if (!otpPhone) throw new Error('Phone not set')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone, otp, action: 'verify-otp' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP')

      localStorage.setItem('authToken', data.token)
      setUser(data.user)
      setOtpSent(false)
      setOtpPhone(null)
      router.push('/dashboard')
    } catch (err) {
      throw new Error(err.message)
    }
  }

  async function signup(name, email, phone) {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Signup failed')

      localStorage.setItem('authToken', data.token)
      setOtpPhone(phone)
      setOtpSent(true)
    } catch (err) {
      throw new Error(err.message)
    }
  }

  async function logout() {
    localStorage.removeItem('authToken')
    setUser(null)
    setOtpSent(false)
    setOtpPhone(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        otpSent,
        otpPhone,
        sendOtp,
        verifyOtp,
        signup,
        logout,
        fetchMe,
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
