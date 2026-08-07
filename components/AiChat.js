'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, X, Check, Mic } from 'lucide-react'
import { CATEGORY_COLORS_MAP } from '@/components/Charts'
import { emitExpensesChanged } from '@/lib/expenseEvents'

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

// "kitna kharcha hua hai is mahine", "how much did I spend this month",
// "spending summary" etc. — a question about totals, not a new expense.
// Only used for the typed-text path; the voice call handles this itself
// (get_spending_summary tool, see lib/voiceAssistant.js).
const SPENDING_QUERY_RE =
  /kitna\s*(kharch|paisa|paise)|kharch.*kitna|kharcha\s*batao|mera\s*kharcha|how much.*(spen[dt]|i.*spent)|total.*spen[dt]|(spending|expense)\s*(summary|report)/i

// Builds the shown answer for a typed spending-summary question from
// /api/expenses/stats — no model call needed, the numbers are just a DB read.
function buildSpendingReply(stats) {
  const total = stats?.thisMonth?.total || 0
  const byCategory = stats?.byCategory || []
  if (total <= 0) {
    return { text: 'Boss, is mahine abhi tak koi kharcha record nahi hua hai.', byCategory: [] }
  }
  const top = byCategory[0]
  const text = top
    ? `Boss, is mahine ab tak ${fmt(total)} kharch hua hai. Sabse zyada kharcha ${top._id} category mein hua hai — ${fmt(top.total)}. Neeche pura breakdown hai.`
    : `Boss, is mahine ab tak ${fmt(total)} kharch hua hai.`
  return { text, byCategory }
}

// --- PCM <-> base64 helpers for the Live API's raw audio frames ---

function floatTo16BitPCM(float32) {
  const out = new Int16Array(float32.length)
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]))
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return out
}

function arrayBufferToBase64(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function base64ToInt16(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Int16Array(bytes.buffer)
}

function pcm16ToAudioBuffer(audioCtx, int16) {
  const float32 = new Float32Array(int16.length)
  for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768
  const buffer = audioCtx.createBuffer(1, float32.length, 24000)
  buffer.getChannelData(0).set(float32)
  return buffer
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

function CategoryBreakdown({ items }) {
  if (!items?.length) return null
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {items.slice(0, 6).map((c) => (
        <div key={c._id} className="flex items-center gap-2 bg-cream rounded-xl px-3 py-2">
          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: CATEGORY_COLORS_MAP[c._id] || '#B9A99C' }} />
          <span className="text-ink text-sm font-medium truncate flex-1">{c._id}</span>
          <span className="text-ink-faint text-[11px]">{c.count} txn{c.count > 1 ? 's' : ''}</span>
          <span className="font-display text-ink font-bold text-sm tabular-nums">{fmt(c.total)}</span>
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
  const [messages, setMessages] = useState([])
  // "listening" = the live voice call is open (mic streaming to Gemini).
  // "speaking" = Gemini's own audio is currently playing back.
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // Live session + audio plumbing (Gemini 2.5 Flash Native Audio Dialog)
  const sessionRef = useRef(null)
  const streamRef = useRef(null)
  const inputCtxRef = useRef(null)
  const processorRef = useRef(null)
  const playCtxRef = useRef(null)
  const nextPlayTimeRef = useRef(0)
  const playingSourcesRef = useRef([])
  const userTranscriptRef = useRef('')
  const assistantTranscriptRef = useRef('')
  const endRequestedRef = useRef(false)

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const stopPlayback = () => {
    playingSourcesRef.current.forEach((s) => {
      try { s.stop() } catch { /* already finished */ }
    })
    playingSourcesRef.current = []
    nextPlayTimeRef.current = playCtxRef.current ? playCtxRef.current.currentTime : 0
  }

  const playAudioChunk = (base64) => {
    const playCtx = playCtxRef.current
    if (!playCtx) return
    const buffer = pcm16ToAudioBuffer(playCtx, base64ToInt16(base64))
    const source = playCtx.createBufferSource()
    source.buffer = buffer
    source.connect(playCtx.destination)
    const startAt = Math.max(playCtx.currentTime, nextPlayTimeRef.current)
    source.start(startAt)
    nextPlayTimeRef.current = startAt + buffer.duration
    playingSourcesRef.current.push(source)
    source.onended = () => {
      playingSourcesRef.current = playingSourcesRef.current.filter((s) => s !== source)
    }
  }

  // Executes whatever Gemini asked for mid-call and reports the result back,
  // so it can keep talking with real data instead of guessing.
  const handleToolCall = async (toolCall) => {
    const responses = []
    for (const fc of toolCall.functionCalls || []) {
      if (fc.name === 'log_expense') {
        const expenses = Array.isArray(fc.args?.expenses) ? fc.args.expenses : []
        let created = []
        try {
          const res = await fetch('/api/ai/log-expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expenses }),
          })
          const data = await res.json()
          created = data.created || []
        } catch { /* reported back as created: 0 below */ }
        if (created.length) {
          setMessages((m) => [
            ...m,
            { role: 'assistant', text: `Added ${created.length} expense${created.length > 1 ? 's' : ''}.`, expenses: created },
          ])
          emitExpensesChanged()
        }
        responses.push({ id: fc.id, name: fc.name, response: { created: created.length } })
      } else if (fc.name === 'get_spending_summary') {
        let total = 0
        let byCategory = []
        try {
          const now = new Date()
          const res = await fetch(`/api/expenses/stats?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
          if (res.ok) {
            const data = await res.json()
            total = data.thisMonth?.total || 0
            byCategory = data.byCategory || []
          }
        } catch { /* reported back as total: 0 below */ }
        if (byCategory.length) {
          setMessages((m) => [...m, { role: 'assistant', text: "This month's spending so far:", categoryBreakdown: byCategory }])
        }
        responses.push({
          id: fc.id,
          name: fc.name,
          response: {
            total: Math.round(total),
            topCategory: byCategory[0]?._id || null,
            topCategoryTotal: byCategory[0] ? Math.round(byCategory[0].total) : 0,
            byCategory: byCategory.slice(0, 6).map((c) => ({ category: c._id, total: Math.round(c.total) })),
          },
        })
      } else if (fc.name === 'end_conversation') {
        endRequestedRef.current = true
        responses.push({ id: fc.id, name: fc.name, response: { ok: true } })
      }
    }
    if (responses.length) sessionRef.current?.sendToolResponse({ functionResponses: responses })
  }

  const handleLiveMessage = (message) => {
    if (message.toolCall) handleToolCall(message.toolCall)

    const content = message.serverContent
    if (!content) return

    // Model was talked over — drop whatever's still queued for playback.
    if (content.interrupted) stopPlayback()

    if (content.interimInputTranscription?.text) setInput(content.interimInputTranscription.text)
    if (content.inputTranscription?.text) userTranscriptRef.current += content.inputTranscription.text
    if (content.outputTranscription?.text) assistantTranscriptRef.current += content.outputTranscription.text

    for (const part of content.modelTurn?.parts || []) {
      if (part.inlineData?.data) {
        setSpeaking(true)
        playAudioChunk(part.inlineData.data)
      }
    }

    if (content.turnComplete) {
      const userText = userTranscriptRef.current.trim()
      const assistantText = assistantTranscriptRef.current.trim()
      userTranscriptRef.current = ''
      assistantTranscriptRef.current = ''
      setInput('')
      setSpeaking(false)
      if (userText) setMessages((m) => [...m, { role: 'user', text: userText }])
      if (assistantText) setMessages((m) => [...m, { role: 'assistant', text: assistantText }])
      if (endRequestedRef.current) {
        endRequestedRef.current = false
        stopVoiceCall()
      }
    }
  }

  // Tears down mic, audio contexts and the live session. Safe to call more
  // than once (e.g. both our own stop() and the server's onclose fire it).
  const endVoiceCallCleanup = () => {
    processorRef.current?.disconnect()
    processorRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    inputCtxRef.current?.close().catch(() => {})
    inputCtxRef.current = null
    stopPlayback()
    playCtxRef.current?.close().catch(() => {})
    playCtxRef.current = null
    sessionRef.current = null
    userTranscriptRef.current = ''
    assistantTranscriptRef.current = ''
    endRequestedRef.current = false
    setListening(false)
    setSpeaking(false)
    setConnecting(false)
    setInput('')
  }

  const stopVoiceCall = () => {
    sessionRef.current?.close()
    endVoiceCallCleanup()
  }

  // Feature-detect after mount (window/navigator aren't available during SSR,
  // so this can't be a lazy useState initializer without a hydration mismatch)
  // and hang up if the user navigates away mid-call.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above
    setVoiceSupported(!!(navigator.mediaDevices?.getUserMedia && (window.AudioContext || window.webkitAudioContext)))
    return () => stopVoiceCall()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startVoiceCall = async () => {
    if (!voiceSupported || sessionRef.current || connecting) return
    setConnecting(true)
    try {
      const tokenRes = await fetch('/api/ai/voice-token', { method: 'POST' })
      const tokenData = await tokenRes.json()
      if (!tokenRes.ok) {
        setMessages((m) => [...m, { role: 'assistant', text: tokenData.error || 'Could not start the voice assistant.' }])
        setConnecting(false)
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })
      streamRef.current = stream

      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const inputCtx = new AudioCtx({ sampleRate: 16000 })
      inputCtxRef.current = inputCtx
      const source = inputCtx.createMediaStreamSource(stream)
      // ScriptProcessorNode is deprecated but needs no extra worklet asset file
      // and every browser we target still supports it — simplest reliable option.
      const processor = inputCtx.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor
      processor.onaudioprocess = (e) => {
        const pcm16 = floatTo16BitPCM(e.inputBuffer.getChannelData(0))
        sessionRef.current?.sendRealtimeInput({
          audio: { data: arrayBufferToBase64(pcm16.buffer), mimeType: 'audio/pcm;rate=16000' },
        })
      }
      source.connect(processor)
      // Output is left silent (we never write to it) — this connection just
      // keeps onaudioprocess firing in browsers that require an active graph.
      processor.connect(inputCtx.destination)

      const playCtx = new AudioCtx({ sampleRate: 24000 })
      playCtxRef.current = playCtx
      nextPlayTimeRef.current = 0

      // Loaded on demand so the SDK only ships to users who actually use voice.
      const { GoogleGenAI } = await import('@google/genai')
      const ai = new GoogleGenAI({ apiKey: tokenData.token, httpOptions: { apiVersion: 'v1alpha' } })

      const session = await ai.live.connect({
        model: tokenData.model,
        config: {}, // locked server-side via the ephemeral token's liveConnectConstraints
        callbacks: {
          onopen: () => { setListening(true); setConnecting(false) },
          onmessage: handleLiveMessage,
          onerror: () => {
            setMessages((m) => [...m, { role: 'assistant', text: 'Voice call error. Please try again.' }])
            endVoiceCallCleanup()
          },
          onclose: endVoiceCallCleanup,
        },
      })
      sessionRef.current = session
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: 'Could not access the microphone. Please allow mic access and try again.' }])
      endVoiceCallCleanup()
    }
  }

  const toggleVoiceCall = () => {
    if (listening || connecting) stopVoiceCall()
    else startVoiceCall()
  }

  const openVoiceAssistant = () => {
    setOpen(true)
    startVoiceCall()
  }

  const close = () => {
    stopVoiceCall()
    setOpen(false)
  }

  // --- Typed chat (unchanged REST path) ---

  const answerSpendingQuery = async (heardText) => {
    setMessages((m) => [...m, { role: 'user', text: heardText }])
    setLoading(true)
    let replyText = ''
    let byCategory = []
    try {
      const now = new Date()
      const res = await fetch(`/api/expenses/stats?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
      if (res.ok) {
        const built = buildSpendingReply(await res.json())
        replyText = built.text
        byCategory = built.byCategory
      } else {
        replyText = 'Sorry boss, main abhi kharcha nikaal nahi paaya — please try again.'
      }
    } catch {
      replyText = 'Network error. Please try again.'
    } finally {
      setLoading(false)
    }
    setMessages((m) => [...m, { role: 'assistant', text: replyText, categoryBreakdown: byCategory }])
  }

  const send = async (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    if (SPENDING_QUERY_RE.test(text)) {
      await answerSpendingQuery(text)
      return
    }

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
        if (count) emitExpensesChanged()
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
          onClick={openVoiceAssistant}
          aria-label="Open voice assistant"
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
                <div className="text-[11px] text-ink-faint">
                  {connecting ? 'Connecting…' : speaking ? 'Speaking…' : listening ? 'Listening — just talk' : 'Logs expenses for you'}
                </div>
              </div>
            </div>
            <button
              onClick={close}
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
                    {m.role === 'assistant' && <CategoryBreakdown items={m.categoryBreakdown} />}
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
              placeholder={connecting ? 'Connecting…' : speaking ? 'Speaking…' : listening ? 'Listening…' : 'e.g. food 400, fuel 480'}
              className="input-field flex-1 min-w-0"
            />
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoiceCall}
                disabled={connecting}
                aria-label={listening ? 'End voice call' : 'Start voice call'}
                title={listening ? 'End voice call' : 'Start voice call'}
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 disabled:opacity-40 ${
                  speaking ? 'bg-accent text-white' : listening ? 'bg-danger text-white animate-pulse' : 'bg-cream text-ink-soft hover:text-accent'
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
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
