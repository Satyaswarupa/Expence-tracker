import { revalidateTag } from 'next/cache'
import { connectDB } from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { getTokenFromRequest } from '@/lib/auth'

// Keep in sync with the enum in models/Expense.js
const CATEGORIES = ['Food', 'Grocery', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Education', 'Bills', 'Fuel', 'Labour', 'Material', 'Investment', 'Other']
const PAYMENT_METHODS = ['Cash', 'UPI']

// Free tier: https://aistudio.google.com/apikey
// Tried in order; the first that works is cached for the process. `-latest` aliases
// track Google's current Flash model, so this keeps working as models come and go.
const MODEL_CANDIDATES = ['gemini-flash-latest', 'gemini-2.0-flash', 'gemini-flash-lite-latest', 'gemini-2.5-flash']
let resolvedModel = null

// Gemini uses an OpenAPI-subset schema (UPPERCASE types, no additionalProperties)
const GEMINI_SCHEMA = {
  type: 'OBJECT',
  properties: {
    reply: {
      type: 'STRING',
      description: 'A short, friendly one-line confirmation of what was logged, or a clarifying question if no expense was found.',
    },
    expenses: {
      type: 'ARRAY',
      description: 'One entry per expense the user described. Empty if the message is not about logging an expense.',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING', description: 'A short human label for the item, e.g. "Medicine", "Petrol", "Lunch".' },
          amount: { type: 'NUMBER', description: 'The amount in rupees as a positive number.' },
          category: { type: 'STRING', enum: CATEGORIES, description: 'The best-fitting category.' },
          paymentMethod: { type: 'STRING', enum: PAYMENT_METHODS, description: 'Cash unless the user mentions UPI/online/card/GPay/Paytm/bank.' },
        },
        required: ['title', 'amount', 'category', 'paymentMethod'],
        propertyOrdering: ['title', 'amount', 'category', 'paymentMethod'],
      },
    },
  },
  required: ['reply', 'expenses'],
  propertyOrdering: ['reply', 'expenses'],
}

function systemPrompt() {
  const today = new Date().toDateString()
  return [
    'You are the expense-logging assistant inside MoneyJot, a personal expense tracker.',
    `Today is ${today}.`,
    'The user types casual notes describing money they spent, often several items at once, e.g. "food 400rs, fuel 480, medicine 300".',
    'Extract every distinct expense and map each to the single best category from this fixed list:',
    CATEGORIES.join(', ') + '.',
    'Category hints: medicine/doctor/pharmacy/hospital -> Health. petrol/diesel/fuel/gas -> Fuel. taxi/bus/uber/auto/train -> Transport. rent/electricity/water/wifi/recharge -> Bills. movie/games/outing -> Entertainment. vegetables/milk/kirana/supermarket -> Grocery. When unsure, use Other.',
    'Amounts: interpret "rs", "₹", "rupees", "/-" as rupees. "1.5k" means 1500. Amounts are always positive.',
    'Payment method is Cash unless the user clearly mentions UPI, online, card, GPay, PhonePe, Paytm, or bank transfer — then use UPI.',
    'If the message does not describe any expense, return an empty expenses array and use "reply" to ask the user what they spent.',
    'Keep "reply" to one short friendly sentence.',
  ].join('\n')
}

async function requestGemini(model, text, signal) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt() }] },
        contents: [{ role: 'user', parts: [{ text }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: GEMINI_SCHEMA,
        },
      }),
      signal,
    }
  )

  if (res.status === 404) {
    const err = new Error(`Gemini model ${model} not available`)
    err.modelNotFound = true
    throw err
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 300)}`)
  }

  const data = await res.json()
  const jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!jsonText) return null // safety block or empty response
  return JSON.parse(jsonText)
}

async function callGemini(text) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const models = resolvedModel ? [resolvedModel] : MODEL_CANDIDATES
    let lastErr
    for (const model of models) {
      try {
        const result = await requestGemini(model, text, controller.signal)
        resolvedModel = model // remember the one that worked
        return result
      } catch (err) {
        lastErr = err
        if (err.modelNotFound) continue // try the next candidate
        throw err
      }
    }
    throw lastErr
  } finally {
    clearTimeout(timeout)
  }
}

export async function POST(request) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: 'AI is not configured. Add GEMINI_API_KEY to your environment to enable the assistant.' },
        { status: 503 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const text = (body?.text || '').toString().trim()
    if (!text) return Response.json({ error: 'Please type what you spent.' }, { status: 400 })
    if (text.length > 2000) return Response.json({ error: 'Message is too long.' }, { status: 400 })

    let parsed
    try {
      parsed = await callGemini(text)
    } catch (err) {
      console.error('AI parse error:', err)
      return Response.json({ error: 'The assistant is unavailable right now. Please try again.' }, { status: 502 })
    }

    // Validate what the model returned before touching the database
    const candidates = Array.isArray(parsed?.expenses) ? parsed.expenses : []
    const valid = candidates
      .map((e) => ({
        title: (e?.title || '').toString().trim(),
        amount: parseFloat(e?.amount),
        category: CATEGORIES.includes(e?.category) ? e.category : 'Other',
        paymentMethod: PAYMENT_METHODS.includes(e?.paymentMethod) ? e.paymentMethod : 'Cash',
      }))
      .filter((e) => Number.isFinite(e.amount) && e.amount > 0)

    const reply = (parsed?.reply || '').toString().trim()

    if (valid.length === 0) {
      return Response.json({ reply: reply || "I couldn't find an expense in that. What did you spend?", created: [] })
    }

    await connectDB()

    const created = await Promise.all(
      valid.map((e) =>
        Expense.create({
          userId: payload.userId,
          title: e.title || e.category,
          amount: e.amount,
          category: e.category,
          description: 'Added via AI assistant',
          paymentMethod: e.paymentMethod,
          date: new Date(),
        })
      )
    )

    // Push each to connected clients so the dashboard updates live (same as the manual form)
    if (global.io) {
      for (const expense of created) {
        global.io.to(`user:${payload.userId}`).emit('expense:created', expense)
      }
    }

    revalidateTag(`expenses:${payload.userId}`)
    revalidateTag(`expense-stats:${payload.userId}`)

    return Response.json({ reply, created }, { status: 201 })
  } catch (err) {
    console.error('AI expense route error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
