// Server-side config for the Gemini Live "Native Audio Dialog" voice assistant.
// Locked into the ephemeral token (see app/api/ai/voice-token/route.js) so the
// system prompt, tools and voice can't be overridden from the client.
import { CATEGORIES } from '@/lib/budget'

export const VOICE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025'

function voiceGreeting() {
  const hour = new Date().getHours()
  const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  return `Hello boss, good ${period}! I am your expense assistant. Tell me your expenses, I will add them.`
}

const LOG_EXPENSE = {
  name: 'log_expense',
  description: 'Logs one or more expenses the user just described, saving them to their account.',
  parameters: {
    type: 'OBJECT',
    properties: {
      expenses: {
        type: 'ARRAY',
        description: 'One entry per distinct expense mentioned in what the user just said.',
        items: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Short label, e.g. "Cold drink", "Petrol", "Puri sabji".' },
            amount: { type: 'NUMBER', description: 'Amount in rupees, a positive number.' },
            category: { type: 'STRING', enum: CATEGORIES, description: 'Best-fitting category.' },
            paymentMethod: {
              type: 'STRING',
              enum: ['Cash', 'UPI'],
              description: 'Cash unless the user mentions UPI, online, card, GPay, PhonePe, Paytm, or bank transfer.',
            },
          },
          required: ['title', 'amount', 'category', 'paymentMethod'],
        },
      },
    },
    required: ['expenses'],
  },
}

const GET_SPENDING_SUMMARY = {
  name: 'get_spending_summary',
  description: "Fetches the user's total spending and category breakdown for the current month so far.",
  parameters: { type: 'OBJECT', properties: {} },
}

const END_CONVERSATION = {
  name: 'end_conversation',
  description:
    'Ends the call. Call this when the user says something like "no", "that\'s it", "end the conversation", "bye", or otherwise makes clear they are done.',
  parameters: { type: 'OBJECT', properties: {} },
}

// Built fresh per call (not a module-level constant) so the greeting picks up
// the current time of day at the moment the user actually opens the assistant.
export function buildVoiceLiveConfig() {
  return {
    responseModalities: ['AUDIO'],
    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    tools: [{ functionDeclarations: [LOG_EXPENSE, GET_SPENDING_SUMMARY, END_CONVERSATION] }],
    systemInstruction: [
      "You are MoneyJot's voice expense assistant, talking to the user on a live call. The user mixes Hindi and English freely (Hinglish) — understand and reply the same way, naturally and grammatically.",
      `Open the very first turn of the call with exactly this greeting, then wait for the user to speak: "${voiceGreeting()}"`,
      'When the user describes something they spent money on (e.g. "cold drink 35 rupees", "40 rupees ka puri sabji, 200 rupe ka petrol"), extract every distinct expense mentioned and call log_expense once with all of them. After it succeeds, briefly confirm what you added in one short sentence, then ask "Do you have any other expense?"',
      'When the user asks how much they have spent (e.g. "kitna kharcha hua hai is mahine", "how much did I spend", "kharcha batao"), call get_spending_summary, then tell them the total and which category they spent the most in, e.g. "Boss, is mahine ab tak [amount] kharch hua hai. Sabse zyada kharcha [category] mein hua hai." Do not ask "any other expense?" after answering a question — just wait.',
      'When the user indicates they are done — "no", "nope", "that\'s it", "I\'m done", "end the conversation", "bye" — call end_conversation and say a short goodbye in the same turn.',
      `Categories must always be exactly one of: ${CATEGORIES.join(', ')}. Never invent an amount or category the user did not say. Keep every spoken reply to one or two short sentences — this is a phone call, not an essay.`,
    ].join('\n\n'),
  }
}
