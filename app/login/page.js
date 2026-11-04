'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ArrowRight, Phone, Lock } from 'lucide-react'
import Logo from '@/components/Logo'

const FEATURES = [
  'Auto category insights every month',
  'Split & partial payments made simple',
  'Know who owes you, instantly',
]

export default function LoginPage() {
  const { sendOtp, verifyOtp, otpSent, otpPhone } = useAuth()
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePhoneChange = (e) => {
    setPhone(e.target.value)
    setError('')
  }

  const handleOtpChange = (e) => {
    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
    setError('')
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await sendOtp(phone)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await verifyOtp(otp)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[46%] bg-accent text-white p-14 flex-col relative overflow-hidden">
        <div className="absolute w-[420px] h-[420px] rounded-full bg-white/10 -right-36 -top-32 pointer-events-none" />
        <div className="absolute w-[260px] h-[260px] rounded-full bg-white/10 -left-24 -bottom-20 pointer-events-none" />

        <Link href="/" className="flex items-center gap-3 relative z-10 w-fit">
          <Logo size={44} priority className="flex-shrink-0" />
          <span className="font-display font-bold text-xl">MoneyJot</span>
        </Link>

        <div className="flex-1" />

        <div className="relative z-10 max-w-md">
          <h2 className="font-display font-bold text-4xl leading-tight mb-4">
            Jot every rupee. See where it really goes.
          </h2>
          <p className="text-white/85 mb-8 leading-relaxed">
            Track daily spends, split shared bills, and follow money you&apos;ve lent — all in one warm little place.
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
            <Logo size={64} priority className="inline-block" />
            <div className="font-display font-bold text-xl text-ink mt-3">MoneyJot</div>
            <div className="text-sm text-ink-muted mt-1">Your money, neatly jotted.</div>
          </div>

          <h1 className="font-display text-2xl font-bold text-ink">Welcome back</h1>
          <p className="text-ink-muted text-sm mt-1 mb-7">Sign in with your phone number.</p>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">Phone Number</label>
                <div className="input-field flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-ink-faint flex-shrink-0" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+91 98765 43210"
                    required
                    className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-faint"
                  />
                </div>
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
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                  Enter OTP sent to {otpPhone}
                </label>
                <div className="input-field flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-ink-faint flex-shrink-0" />
                  <input
                    type="text"
                    value={otp}
                    onChange={handleOtpChange}
                    placeholder="000000"
                    maxLength="6"
                    inputMode="numeric"
                    required
                    className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-faint tracking-widest text-center"
                  />
                </div>
              </div>

              {error && (
                <div className="text-danger text-sm bg-danger/10 border border-danger/25 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={() => setPhone('')}
                className="w-full text-center text-accent font-semibold text-sm py-2"
              >
                Change Phone Number
              </button>
            </form>
          )}

          <p className="text-center text-ink-muted text-sm mt-7">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-accent font-bold">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
