// Server-side config for the Gemini Live "Native Audio Dialog" voice assistant.
// Locked into the ephemeral token (see app/api/ai/voice-token/route.js) so the
// system prompt, tools and voice can't be overridden from the client.
import { CATEGORIES } from '@/lib/budget'

export const VOICE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025'

// BCP-47 hints for speech recognition/transcription — Hindi, Indian English,
// and Odia (or-IN), the languages this assistant is expected to understand.
const SUPPORTED_LANGUAGE_CODES = ['hi-IN', 'en-IN', 'or-IN']

// Exported so the client can seed the same text as a chat bubble the instant
// the panel opens, instead of waiting for the spoken greeting to round-trip
// back as a transcript.
export function voiceGreeting() {
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

const FIND_EXPENSES = {
  name: 'find_expenses',
  description:
    "Looks up the user's recent expenses. Always call this first when the user wants to delete or change an expense, so you have its exact id and current field values — never guess an id.",
  parameters: {
    type: 'OBJECT',
    properties: {
      query: {
        type: 'STRING',
        description: 'Optional keyword to match against expense titles, e.g. "petrol", "cold drink". Leave empty to just list the most recent expenses.',
      },
      category: { type: 'STRING', enum: CATEGORIES, description: 'Optional category filter.' },
    },
  },
}

const DELETE_EXPENSE = {
  name: 'delete_expense',
  description:
    'Permanently deletes one expense. Only call this after find_expenses has identified the exact expense by id, and the user has clearly confirmed they want it deleted.',
  parameters: {
    type: 'OBJECT',
    properties: {
      id: { type: 'STRING', description: 'The id of the expense to delete, from find_expenses.' },
    },
    required: ['id'],
  },
}

const UPDATE_EXPENSE = {
  name: 'update_expense',
  description:
    "Updates one expense. Only call this after find_expenses has returned the expense's id and current fields. Pass the complete record back — keep any field the user didn't ask to change exactly as find_expenses returned it, and only change the field(s) the user asked to update.",
  parameters: {
    type: 'OBJECT',
    properties: {
      id: { type: 'STRING', description: 'The id of the expense to update, from find_expenses.' },
      title: { type: 'STRING' },
      amount: { type: 'NUMBER', description: 'Amount in rupees, a positive number.' },
      category: { type: 'STRING', enum: CATEGORIES },
      paymentMethod: { type: 'STRING', enum: ['Cash', 'UPI'] },
    },
    required: ['id', 'title', 'amount', 'category', 'paymentMethod'],
  },
}

// Built fresh per call (not a module-level constant) so the greeting picks up
// the current time of day at the moment the user actually opens the assistant.
export function buildVoiceLiveConfig() {
  return {
    responseModalities: ['AUDIO'],
    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    inputAudioTranscription: { languageCodes: SUPPORTED_LANGUAGE_CODES },
    outputAudioTranscription: { languageCodes: SUPPORTED_LANGUAGE_CODES },
    // Server default is ~800ms of silence before it decides the user's turn
    // is over (and only then can it call log_expense) — 500ms is Google's own
    // documented safe floor for cutting that wait without clipping speech.
    realtimeInputConfig: { automaticActivityDetection: { silenceDurationMs: 100 } },
    tools: [{ functionDeclarations: [LOG_EXPENSE, GET_SPENDING_SUMMARY, FIND_EXPENSES, DELETE_EXPENSE, UPDATE_EXPENSE, END_CONVERSATION] }],
    systemInstruction: [
      "You are MoneyJot's voice expense assistant, talking to the user on a live call. The user mixes Hindi, English and Odia freely — understand and reply naturally in whichever of these the user is using (Hinglish by default, or Odia if the user speaks Odia).",
      `Open the very first turn of the call with exactly this greeting, then wait for the user to speak: "${voiceGreeting()}"`,
      'When the user describes something they spent money on (e.g. "cold drink 35 rupees", "40 rupees ka puri sabji, 200 rupe ka petrol"), extract every distinct expense mentioned and call log_expense once with all of them. After it succeeds, briefly confirm what you added in one short sentence, then ask "Do you have any other expense?"',
      'When the user asks how much they have spent (e.g. "kitna kharcha hua hai is mahine", "how much did I spend", "kharcha batao"), call get_spending_summary, then tell them the total and which category they spent the most in, e.g. "Boss, is mahine ab tak [amount] kharch hua hai. Sabse zyada kharcha [category] mein hua hai." Do not ask "any other expense?" after answering a question — just wait.',
      'When the user wants to delete or change an existing expense (e.g. "delete the petrol expense", "petrol wala expense hatao", "change the food expense to 500"), first call find_expenses (with a query matching what they described) to get its exact id and current fields. If more than one result could match, read out the candidates briefly and ask the user which one they mean — never guess. For a delete, say what you are about to delete (title and amount) and get a clear yes before calling delete_expense. For an update, call update_expense with the id and the full record from find_expenses, changing only the field(s) the user asked to change, then confirm what changed in one short sentence.',
      'When the user indicates they are done — "no", "nope", "that\'s it", "I\'m done", "end the conversation", "bye" — call end_conversation and say a short goodbye in the same turn.',
      `Categories must always be exactly one of: ${CATEGORIES.join(', ')}. Never invent an amount or category the user did not say. Keep every spoken reply to one or two short sentences — this is a phone call, not an essay.`,
    ].join('\n\n'),
  }
}
