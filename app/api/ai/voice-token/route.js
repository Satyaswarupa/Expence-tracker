import { GoogleGenAI } from '@google/genai'
import { getTokenFromRequest } from '@/lib/auth'
import { hasGeminiKey } from '@/lib/gemini'
import { VOICE_MODEL, buildVoiceLiveConfig } from '@/lib/voiceAssistant'

// Mints a short-lived token the browser can use to connect directly to the
// Gemini Live API over WebSocket — the real GEMINI_API_KEY never leaves the
// server. The session's model, system prompt, voice and tools are locked into
// the token itself (liveConnectConstraints), so the client can't override them.
export async function POST(request) {
  try {
    const payload = await getTokenFromRequest(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    if (!hasGeminiKey()) {
      return Response.json(
        { error: 'AI is not configured. Add GEMINI_API_KEY to your environment to enable the voice assistant.' },
        { status: 503 }
      )
    }

    // Ephemeral tokens are v1alpha-only.
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { apiVersion: 'v1alpha' } })
    const now = Date.now()

    const authToken = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
        liveConnectConstraints: { model: VOICE_MODEL, config: buildVoiceLiveConfig() },
      },
    })

    return Response.json({ token: authToken.name, model: VOICE_MODEL })
  } catch (err) {
    console.error('Voice token error:', err)
    return Response.json({ error: 'Could not start the voice assistant. Please try again.' }, { status: 502 })
  }
}
