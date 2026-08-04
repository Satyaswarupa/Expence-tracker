// Shared Gemini plumbing for every AI route (expense parsing, budget coaching).
// Free tier keys: https://aistudio.google.com/apikey

// Tried in order; the first that works is cached for the process. `-latest` aliases
// track Google's current Flash model, so this keeps working as models come and go.
const MODEL_CANDIDATES = ['gemini-flash-latest', 'gemini-2.0-flash', 'gemini-flash-lite-latest', 'gemini-2.5-flash']
let resolvedModel = null

// Models that reject `thinkingConfig` outright, learned at runtime so an alias
// like `gemini-flash-latest` moving to a non-thinking model can't break us.
const noThinkingSupport = new Set()

// Both our tasks are extraction against a fixed schema, where the model's
// scratchpad earns nothing: measured on gemini-flash-latest, leaving thinking at
// its default burned 1498 tokens per coach call — 52% of the request — for output
// no better than this. 0 is rejected by that model; 128 is the accepted floor and
// yields 0 actual thinking tokens.
const MIN_THINKING_BUDGET = 128

export function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY)
}

function buildBody(model, { system, user, schema, temperature, maxOutputTokens }, withThinking) {
  const generationConfig = {
    temperature,
    responseMimeType: 'application/json',
    responseSchema: schema,
  }
  if (maxOutputTokens) generationConfig.maxOutputTokens = maxOutputTokens
  if (withThinking && !noThinkingSupport.has(model)) {
    generationConfig.thinkingConfig = { thinkingBudget: MIN_THINKING_BUDGET }
  }
  return JSON.stringify({
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig,
  })
}

async function requestGemini(model, options, signal) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const headers = {
    'Content-Type': 'application/json',
    'x-goog-api-key': process.env.GEMINI_API_KEY,
  }

  let res = await fetch(url, { method: 'POST', headers, body: buildBody(model, options, true), signal })

  // Older models (2.0 and earlier) 400 on thinkingConfig — drop it and retry once,
  // then remember so the wasted round trip happens at most once per model.
  if (res.status === 400 && !noThinkingSupport.has(model)) {
    noThinkingSupport.add(model)
    res = await fetch(url, { method: 'POST', headers, body: buildBody(model, options, false), signal })
  }

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

/**
 * Ask Gemini for JSON matching `schema` (an OpenAPI-subset schema: UPPERCASE
 * types, no additionalProperties). Returns the parsed object, or null when the
 * model returned nothing.
 */
export async function callGemini({ system, user, schema, temperature = 0.2, timeoutMs = 30000, maxOutputTokens }) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const models = resolvedModel ? [resolvedModel] : MODEL_CANDIDATES
    let lastErr
    for (const model of models) {
      try {
        const result = await requestGemini(model, { system, user, schema, temperature, maxOutputTokens }, controller.signal)
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
