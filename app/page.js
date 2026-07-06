'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { BarChart3, Shield, Zap, ArrowRight, Receipt, PieChart, Bell } from 'lucide-react'

const features = [
  {
    icon: Receipt,
    title: 'Track Every Rupee',
    desc: 'Log expenses by category with detailed notes and dates. Never lose track of your spending again.',
    color: 'bg-accent',
  },
  {
    icon: PieChart,
    title: 'Visual Analytics',
    desc: 'Beautiful charts showing spending patterns, category breakdowns, and monthly trends.',
    color: 'bg-[#E0719A]',
  },
  {
    icon: Zap,
    title: 'Real-time Updates',
    desc: 'Socket.io powered live sync across all your devices. Add expense on phone, see on desktop instantly.',
    color: 'bg-[#F4A93B]',
  },
  {
    icon: Shield,
    title: 'Your Data, Only Yours',
    desc: 'Every user sees only their own data. Secure authentication powered by Clerk.',
    color: 'bg-success',
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
    <div className="min-h-screen bg-cream">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-success/8 blur-[100px]" />
      </div>

      {/* Nav — only visible to logged-out users; Navbar in layout returns null when !user */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
            <span className="font-display font-extrabold text-sm text-white leading-none">M</span>
          </div>
          <span className="gradient-text text-lg">MoneyJot</span>
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm mb-8">
          <Bell className="w-3.5 h-3.5" />
          <span>Real-time expense tracking with live sync</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold text-ink leading-tight mb-6">
          Master Your{' '}
          <span className="gradient-text">Finances</span>
          <br />
          With Clarity
        </h1>

        <p className="text-lg sm:text-xl text-ink-muted max-w-2xl mx-auto mb-10 leading-relaxed">
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
              <div className="font-display text-3xl font-bold text-ink">{stat.value}</div>
              <div className="text-sm text-ink-faint mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="relative z-10 px-6 mb-24 max-w-5xl mx-auto">
        <div className="glass-card rounded-3xl border-line p-1 shadow-2xl shadow-black/5">
          <div className="rounded-2xl bg-cream p-6">
            {/* Fake dashboard UI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total Spent', val: '₹48,250', color: 'bg-accent' },
                { label: 'This Month', val: '₹12,800', color: 'bg-success' },
                { label: 'Transactions', val: '142', color: 'bg-[#F4A93B]' },
                { label: 'Categories', val: '8', color: 'bg-[#E0719A]' },
              ].map((c) => (
                <div key={c.label} className="rounded-xl bg-card border border-line p-3 min-w-0">
                  <div className={`w-7 h-7 rounded-lg ${c.color} mb-2`} />
                  <div className="font-display text-ink font-bold text-lg truncate">{c.val}</div>
                  <div className="text-ink-faint text-xs">{c.label}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="sm:col-span-3 rounded-xl bg-card border border-line h-36 flex items-center justify-center text-ink-faint text-sm">
                📊 Monthly Trend Chart
              </div>
              <div className="sm:col-span-2 rounded-xl bg-card border border-line h-36 flex items-center justify-center text-ink-faint text-sm">
                🥧 Category Pie
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 pb-24 max-w-6xl mx-auto">
        <h2 className="text-3xl font-display font-bold text-ink text-center mb-3">
          Everything You Need
        </h2>
        <p className="text-ink-muted text-center mb-12">Built with the modern stack you love</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="glass-card rounded-2xl p-6 hover:border-accent/25 transition-all duration-300 group">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-ink mb-2">{title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-24 max-w-2xl mx-auto text-center">
        <div className="glass-card rounded-3xl border-line p-10">
          <h2 className="text-3xl font-display font-bold text-ink mb-4">Ready to Take Control?</h2>
          <p className="text-ink-muted mb-8">Join and start tracking your expenses today. Free forever.</p>
          <Link href="/signup" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3.5">
            Create Free Account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-line py-6 text-center text-ink-faint text-sm">
        <div className="flex items-center justify-center gap-2">
          <span className="font-display font-extrabold text-accent">M</span>
          <span>MoneyJot — Built with Next.js, MongoDB &amp; Socket.io</span>
        </div>
      </footer>
    </div>
  )
}
