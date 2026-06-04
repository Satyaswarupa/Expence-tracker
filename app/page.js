'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { Wallet, BarChart3, Shield, Zap, ArrowRight, Receipt, PieChart, Bell } from 'lucide-react'

const features = [
  {
    icon: Receipt,
    title: 'Track Every Rupee',
    desc: 'Log expenses by category with detailed notes and dates. Never lose track of your spending again.',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    icon: PieChart,
    title: 'Visual Analytics',
    desc: 'Beautiful charts showing spending patterns, category breakdowns, and monthly trends.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: Zap,
    title: 'Real-time Updates',
    desc: 'Socket.io powered live sync across all your devices. Add expense on phone, see on desktop instantly.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: Shield,
    title: 'Your Data, Only Yours',
    desc: 'Every user sees only their own data. Military-grade JWT auth with secure HTTP-only cookies.',
    color: 'from-emerald-500 to-teal-600',
  },
]

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading])

  // Never render the landing page (including its own nav) when user is logged in
  if (loading || user) return null

  return (
    <div className="min-h-screen bg-[#0a0618]">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-violet-500/5 blur-[80px]" />
      </div>

      {/* Nav — only visible to logged-out users; Navbar in layout returns null when !user */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">SpendWise</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="btn-ghost landing-nav-btn">
            Sign In
          </Link>
          <Link href="/signup" className="btn-primary landing-nav-btn">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-20 pb-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-8">
          <Bell className="w-3.5 h-3.5" />
          <span>Real-time expense tracking with live sync</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
          Master Your{' '}
          <span className="gradient-text">Finances</span>
          <br />
          With Clarity
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Track expenses, visualize spending patterns, and take control of your money — all in one beautiful, secure dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup" className="btn-primary flex items-center gap-2 text-base px-8 py-3.5">
            Start for Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="btn-ghost flex items-center gap-2 text-base px-8 py-3.5">
            Sign In
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-12 mt-16">
          {[
            { label: 'Categories', value: '8' },
            { label: 'Real-time Sync', value: '⚡' },
            { label: 'Data Private', value: '🔒' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="relative z-10 px-6 mb-24 max-w-5xl mx-auto">
        <div className="glass-card rounded-3xl border border-purple-500/20 p-1 shadow-2xl shadow-purple-500/10">
          <div className="rounded-2xl bg-[#120d24] p-6">
            {/* Fake dashboard UI */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total Spent', val: '₹48,250', color: 'from-purple-500 to-indigo-600' },
                { label: 'This Month', val: '₹12,800', color: 'from-emerald-500 to-teal-600' },
                { label: 'Transactions', val: '142', color: 'from-amber-500 to-orange-600' },
                { label: 'Categories', val: '8', color: 'from-rose-500 to-pink-600' },
              ].map((c) => (
                <div key={c.label} className="rounded-xl bg-white/3 border border-white/5 p-3">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${c.color} mb-2`} />
                  <div className="text-white font-bold text-lg">{c.val}</div>
                  <div className="text-slate-500 text-xs">{c.label}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-3 rounded-xl bg-white/3 border border-white/5 h-36 flex items-center justify-center text-slate-600 text-sm">
                📊 Monthly Trend Chart
              </div>
              <div className="col-span-2 rounded-xl bg-white/3 border border-white/5 h-36 flex items-center justify-center text-slate-600 text-sm">
                🥧 Category Pie
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 pb-24 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-3">
          Everything You Need
        </h2>
        <p className="text-slate-400 text-center mb-12">Built with the modern stack you love</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="glass-card rounded-2xl border border-white/5 p-6 hover:border-purple-500/20 transition-all duration-300 group">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-24 max-w-2xl mx-auto text-center">
        <div className="glass-card rounded-3xl border border-purple-500/20 p-10">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Take Control?</h2>
          <p className="text-slate-400 mb-8">Join and start tracking your expenses today. Free forever.</p>
          <Link href="/signup" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3.5">
            Create Free Account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-slate-600 text-sm">
        <div className="flex items-center justify-center gap-2">
          <Wallet className="w-4 h-4" />
          <span>SpendWise — Built with Next.js, MongoDB & Socket.io</span>
        </div>
      </footer>
    </div>
  )
}
