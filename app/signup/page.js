'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, ArrowRight, Mail, Lock, User } from 'lucide-react'
import GoogleIcon from '@/components/GoogleIcon'

const FEATURES = [
  'Free forever',
  'Private & secure',
  'Real-time sync',
]

export default function SignupPage() {
  const { signup, signupWithGoogle } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      await signupWithGoogle()
    } catch (err) {
      setError(err.message)
      setGoogleLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    try {
      await signup(form.name, form.email, form.password)
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left brand panel — desktop only */}
      <div className="hidden lg:flex lg:w-[46%] bg-accent text-white p-14 flex-col relative overflow-hidden">
        <div className="absolute w-[420px] h-[420px] rounded-full bg-white/10 -right-36 -top-32 pointer-events-none" />
        <div className="absolute w-[260px] h-[260px] rounded-full bg-white/10 -left-24 -bottom-20 pointer-events-none" />

        <Link href="/" className="flex items-center gap-3 relative z-10 w-fit">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="font-display font-extrabold text-xl leading-none">M</span>
          </div>
          <span className="font-display font-bold text-xl">MoneyJot</span>
        </Link>

        <div className="flex-1" />

        <div className="relative z-10 max-w-md">
          <h2 className="font-display font-bold text-4xl leading-tight mb-4">
            Start jotting. Stay in control of your money.
          </h2>
          <p className="text-white/85 mb-8 leading-relaxed">
            Create your free account and track daily spends, split shared bills, and follow money you&apos;ve lent — all in one warm little place.
          </p>
          <div className="flex flex-col gap-3.5">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm font-medium">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">✦</div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile-only header */}
          <div className="lg:hidden text-center mb-9">
            <div className="w-16 h-16 rounded-2xl bg-accent inline-flex items-center justify-center shadow-lg shadow-accent/30">
              <span className="font-display font-extrabold text-3xl text-white leading-none">M</span>
            </div>
            <div className="font-display font-bold text-xl text-ink mt-3">MoneyJot</div>
            <div className="text-sm text-ink-muted mt-1">Your money, neatly jotted.</div>
          </div>

          <h1 className="font-display text-2xl font-bold text-ink">Create your account</h1>
          <p className="text-ink-muted text-sm mt-1 mb-7">Start tracking your expenses today.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">Full Name</label>
              <div className="input-field flex items-center gap-2.5">
                <User className="w-4 h-4 text-ink-faint flex-shrink-0" />
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-faint"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">Email Address</label>
              <div className="input-field flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-ink-faint flex-shrink-0" />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-faint"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">Password</label>
              <div className="input-field flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-ink-faint flex-shrink-0" />
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  required
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-faint"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-ink-faint hover:text-ink-soft transition-colors flex-shrink-0"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength */}
              {form.password && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        passwordStrength >= level
                          ? level === 1 ? 'bg-danger' : level === 2 ? 'bg-[#F4A93B]' : 'bg-success'
                          : 'bg-line'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="text-danger text-sm bg-danger/10 border border-danger/25 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6 text-ink-faint text-xs font-medium">
            <div className="flex-1 h-px bg-line" />
            or continue with
            <div className="flex-1 h-px bg-line" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-line hover:bg-cream text-sm font-semibold text-ink-soft transition-colors disabled:opacity-60"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-ink-faint/30 border-t-ink-faint rounded-full animate-spin" />
            ) : (
              <GoogleIcon className="w-4 h-4" />
            )}
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <p className="text-center text-ink-muted text-sm mt-7">
            Already have an account?{' '}
            <Link href="/login" className="text-accent font-bold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
