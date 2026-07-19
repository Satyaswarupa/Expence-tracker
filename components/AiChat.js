'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, X, Check } from 'lucide-react'
import { CATEGORY_COLORS_MAP } from '@/components/Charts'

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const GREETING = {
  role: 'assistant',
  text: "Hi! Just tell me what you spent — like “food 400, fuel 480, medicine 300” — and I'll add it to your expenses.",
}

function ExpenseChips({ expenses }) {
  if (!expenses?.length) return null
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {expenses.map((e) => (
        <div key={e._id} className="flex items-center gap-2 bg-cream rounded-xl px-3 py-2">
          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: CATEGORY_COLORS_MAP[e.category] || '#B9A99C' }} />
          <span className="text-ink text-sm font-medium truncate flex-1">{e.title}</span>
          <span className="text-ink-faint text-[11px]">{e.category}</span>
          <span className="font-display text-ink font-bold text-sm tabular-nums">{fmt(e.amount)}</span>
        </div>
      ))}
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-ink-faint animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: '1s' }}
        />
      ))}
    </div>
  )
}

export default function AiChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const send = async (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    setLoading(true)
    try {
      const res = await fetch('/api/ai/parse-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages((m) => [...m, { role: 'assistant', text: data.error || 'Something went wrong.' }])
      } else {
        const count = data.created?.length || 0
        const fallback = count ? `Added ${count} expense${count > 1 ? 's' : ''}.` : 'Okay.'
        setMessages((m) => [...m, { role: 'assistant', text: data.reply || fallback, expenses: data.created }])
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: 'Network error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating launcher — sits above the mobile bottom nav */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI assistant"
          className="fixed z-40 bottom-24 right-4 lg:bottom-6 lg:right-6 w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center fab-accent transition-transform active:scale-95 hover:-translate-y-0.5"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed z-50 bottom-24 right-4 left-4 lg:left-auto lg:bottom-6 lg:right-6 lg:w-[380px] flex flex-col glass-card rounded-2xl overflow-hidden animate-fade-in-up h-[70vh] max-h-[560px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-line-soft flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="leading-tight">
                <div className="font-display text-sm font-bold text-ink">AI Assistant</div>
                <div className="text-[11px] text-ink-faint">Logs expenses for you</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="p-2 rounded-full bg-cream text-ink-soft hover:text-accent transition-all"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="popup-scroll flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${m.role === 'user' ? '' : 'w-full'}`}>
                  <div
                    className={`px-3 py-2 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-accent text-white rounded-2xl rounded-br-md'
                        : 'bg-cream text-ink-soft rounded-2xl rounded-bl-md'
                    }`}
                  >
                    {m.role === 'assistant' && m.expenses?.length ? (
                      <span className="flex items-center gap-1.5 font-medium text-ink">
                        <Check className="w-4 h-4 text-success flex-shrink-0" strokeWidth={3} />
                        {m.text}
                      </span>
                    ) : (
                      m.text
                    )}
                    {m.role === 'assistant' && <ExpenseChips expenses={m.expenses} />}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-cream rounded-2xl rounded-bl-md">
                  <TypingDots />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={send} className="flex items-center gap-2 px-3 py-3 border-t border-line-soft flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. food 400, fuel 480"
              className="input-field flex-1 min-w-0"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send"
              className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center flex-shrink-0 fab-accent disabled:opacity-40 disabled:shadow-none transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
