'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Wallet, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const { login, pendingClientTrust, verifyLoginCode } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [code, setCode] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await login(form.email, form.password)
      if (!result.needsVerification) router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await verifyLoginCode(code)
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] rounded-full bg-indigo-600/8 blur-[80px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">SpendWise</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {pendingClientTrust ? 'Verify it\'s you' : 'Welcome back'}
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {pendingClientTrust ? `Enter the code we sent to ${form.email}` : 'Sign in to your account'}
          </p>
        </div>

        {/* Card */}
        {pendingClientTrust ? (
          <div className="glass-card rounded-2xl border border-purple-500/20 p-8">
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Verification Code</label>
                <input
                  name="code"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError('') }}
                  placeholder="123456"
                  required
                  autoFocus
                  className="input-field text-center text-lg tracking-widest"
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
          </div>
        ) : (
        <div className="glass-card rounded-2xl border border-purple-500/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Email Address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Your password"
                  required
                  className="input-field pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
        )}

        {!pendingClientTrust && (
        <p className="text-center text-slate-400 text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
            Sign up free
          </Link>
        </p>
        )}
      </div>
    </div>
  )
}
