// Ava, the AI chatbot search (Gemini free tier).
//
// Invoked from the app via:
//   supabase.functions.invoke('ai-search', { body: { messages } })
//
// Gemini never produces listings. It reads the tenant's plain-language request
// (English, Tagalog or Taglish) and returns a short friendly reply, up to four
// quick replies and search filters. The app sanitizes those filters with
// `sanitizeAiFilters` (@repo/utils `aiSearch.ts`) and runs the normal
// apartments query, so RLS decides which listings are shown.
//
// Responses (always HTTP 200 once the caller is authorized):
//   { source: 'gemini', reply, quickReplies, noResultsReply,
//     noResultsQuickReplies, filters }
// The app shows noResultsReply instead of reply when the search finds
// nothing, because Gemini answers before the app searches.
//   { source: 'fallback' }  Gemini unset, rate-limited, slow or invalid.
//   { source: 'limit' }     the account used its daily message allowance.
// For 'fallback' and 'limit' the app reads the message itself with
// `parseSearchKeywords`, so search keeps working without the model.
//
// Privacy: only the typed chat text is sent to Google (free-tier prompts may
// be used to improve Google's products). No profile data is sent, and message
// text is never logged.
//
// Secrets (supabase secrets set ...):
//   GEMINI_API_KEY     - Google AI Studio key. Unset = always 'fallback'.
//   GEMINI_MODEL       - optional model id override (see DEFAULT_MODEL).
//   AI_SEARCH_DAILY_LIMIT - optional messages per account per Manila day.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models'
// Check the current free-tier models in Google AI Studio; ids change often.
const DEFAULT_MODEL = 'gemini-3.5-flash-lite'
const DEFAULT_DAILY_LIMIT = 30
// Free-tier replies usually take 4 to 10 seconds; past this, use the keyword search.
const GEMINI_TIMEOUT_MS = 20000
const MAX_TURNS = 6
const MAX_MESSAGE_LENGTH = 500
const MAX_REPLY_LENGTH = 600
const MAX_QUICK_REPLIES = 4
const MAX_QUICK_REPLY_LENGTH = 40

// Mirrors @repo/constants and AI_SEARCH_AMENITIES in @repo/utils aiSearch.ts.
// Drift is safe: the app drops anything it does not know.
const CITIES = ['Caloocan', 'Malabon', 'Navotas', 'Valenzuela']
const TYPES = ['Studio', 'Condo Unit', 'House', 'Apartment', 'Townhouse']
const FURNISHING = ['Fully Furnished', 'Semi-Furnished', 'Unfurnished']
const AMENITIES: Record<string, string> = {
  petfriendly: 'pets allowed',
  parking: 'car parking',
  motorbikeparking: 'motorcycle parking',
  wifi: 'wifi or internet',
  ac: 'air conditioning',
  kitchen: 'kitchen',
  washer: 'washing machine',
  balcony: 'balcony',
  elevator: 'elevator',
  gym: 'gym',
  pool: 'swimming pool',
  cctv: 'CCTV',
  security: 'security guard',
  gated: 'gated community',
  near_transport: 'near public transport',
  near_school: 'near a school or university',
  near_hospital: 'near a hospital or clinic',
  childfriendly: 'child friendly',
  all_female: 'female tenants only',
}
const ROOMS = ['1', '2', '3', '4+']
const SORTS = ['price_asc', 'price_desc', 'most_popular']

const SYSTEM_INSTRUCTION = `You are Ava (APT Virtual Assistant), the friendly apartment-search helper of APT, a rental app for Caloocan, Malabon, Navotas and Valenzuela (CAMANAVA) in Metro Manila.

Your job: understand what the tenant wants and turn it into search filters. The app searches real listings with your filters. Never invent listings, prices, names or addresses, and never say how many results there are.

How to talk:
- Reply in the same language the tenant uses: English, Tagalog or Taglish. Use simple, warm words. Use "po" politely when writing Tagalog.
- Keep "reply" to one or two short sentences. Say what you are searching for, e.g. "Hinahanap ko ang 2-bedroom sa Malabon na hanggang ₱15,000."
- Ask at most one follow-up question, only about the most useful missing detail (area, budget or number of bedrooms).
- "quickReplies": 2 to 4 short answers the tenant can tap, in their language.
- "noResultsReply": what to say instead if the search finds nothing, in the same language. One or two short sentences: say kindly that nothing matches yet and suggest loosening the search (another area, a higher budget, a different type, or dropping a must-have). Do not ask them to add more requirements. Example: "Wala pa pong pet-friendly na studio sa Malabon. Subukan natin sa ibang lugar o ibang uri ng unit?"
- "noResultsQuickReplies": 2 to 4 short taps that loosen the search, in their language, e.g. "Ibang lugar", "Kahit hindi studio", "Taasan ang budget".
- If they ask for something you cannot search (a quiet street, a view, a specific landlord), say kindly that you cannot filter by that yet and search with what you can.
- If they ask about a place outside CAMANAVA, explain that APT only has listings in Caloocan, Malabon, Navotas and Valenzuela.
- Do not ask for or repeat personal details (full name, phone number, email, address).
- If the message is not about finding a place to rent, gently bring the conversation back to apartment search.

Filters (use the whole conversation; keep earlier details unless the tenant changes them; use null or [] when unknown):
- cities: from ${CITIES.join(', ')}.
- priceMin / priceMax: monthly rent in pesos. "15k" or "15 libo" means 15000. "Under 15k" sets only priceMax.
- bedrooms / bathrooms: one of ${ROOMS.join(', ')}. "Studio" sets types to Studio, not bedrooms.
- types: from ${TYPES.join(', ')}. Only set it when the tenant names a type; the word "apartment" alone is just a general word for a place to rent.
- furnishing: from ${FURNISHING.join(', ')}. "Furnished" alone means Fully Furnished and Semi-Furnished.
- amenities: ids from ${Object.entries(AMENITIES).map(([id, label]) => `${id} (${label})`).join(', ')}.
- verifiedOnly: true only when they ask for verified or legit listings.
- sort: price_asc for cheap or "mura", most_popular for best or top rated, price_desc for most expensive, otherwise null.
- keyword: a barangay or street name they mention, otherwise null.`

const nullable = (type: string, extra: Record<string, unknown> = {}) => ({ type, nullable: true, ...extra })
const stringEnum = (values: string[]) => ({ format: 'enum', enum: values })
const stringList = (values: string[]) => ({ type: 'ARRAY', items: { type: 'STRING', ...stringEnum(values) } })

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    reply: { type: 'STRING' },
    quickReplies: { type: 'ARRAY', items: { type: 'STRING' } },
    noResultsReply: { type: 'STRING' },
    noResultsQuickReplies: { type: 'ARRAY', items: { type: 'STRING' } },
    filters: {
      type: 'OBJECT',
      properties: {
        cities: stringList(CITIES),
        priceMin: nullable('NUMBER'),
        priceMax: nullable('NUMBER'),
        bedrooms: nullable('STRING', stringEnum(ROOMS)),
        bathrooms: nullable('STRING', stringEnum(ROOMS)),
        types: stringList(TYPES),
        furnishing: stringList(FURNISHING),
        amenities: stringList(Object.keys(AMENITIES)),
        verifiedOnly: { type: 'BOOLEAN' },
        sort: nullable('STRING', stringEnum(SORTS)),
        keyword: nullable('STRING'),
      },
      required: ['cities', 'types', 'furnishing', 'amenities', 'verifiedOnly'],
    },
  },
  required: ['reply', 'quickReplies', 'noResultsReply', 'noResultsQuickReplies', 'filters'],
}

const dbClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const errorResponse = (code: string, detail: string, status: number) =>
  json({ errors: [{ code, detail, status }] }, status)

type ChatTurn = { role: 'user' | 'assistant'; text: string }

type AvaAnswer = {
  reply: string
  quickReplies: string[]
  noResultsReply: string | null
  noResultsQuickReplies: string[]
  filters: Record<string, unknown>
}

// Resolve the acting user from the forwarded JWT and map it to the internal
// public.users.id. Suspended accounts authenticate but get no access (service
// role bypasses RLS, so the check lives here).
async function resolveUserId(req: Request): Promise<string | null> {
  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!jwt) return null

  const {
    data: { user },
    error,
  } = await dbClient.auth.getUser(jwt)
  if (error || !user) return null

  const { data } = await dbClient
    .from('users')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_suspended', false)
    .maybeSingle()
  return data?.id ?? null
}

function readTurns(body: unknown): ChatTurn[] | null {
  const messages = (body as { messages?: unknown } | null)?.messages
  if (!Array.isArray(messages)) return null

  const turns = messages
    .filter(
      (message): message is { role: string; text: string } =>
        !!message &&
        typeof message === 'object' &&
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.text === 'string' &&
        message.text.trim() !== '',
    )
    .slice(-MAX_TURNS)
    .map((message) => ({
      role: message.role as ChatTurn['role'],
      text: message.text.trim().slice(0, MAX_MESSAGE_LENGTH),
    }))

  // Gemini expects the conversation to end with the tenant's message.
  if (turns.length === 0 || turns[turns.length - 1].role !== 'user') return null
  return turns
}

function dailyLimit(): number {
  const configured = Number(Deno.env.get('AI_SEARCH_DAILY_LIMIT'))
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_DAILY_LIMIT
}

// Counts this message against the account's daily allowance. Returns false
// once the allowance is used. A failed check lets the message through, so a
// database hiccup never blocks search (the keyword fallback costs nothing).
async function consumeAllowance(userId: string): Promise<boolean> {
  const { data, error } = await dbClient.rpc('consume_ai_search_allowance', {
    p_user_id: userId,
    p_daily_limit: dailyLimit(),
  })
  if (error) {
    console.error('ai-search allowance check failed:', error.message)
    return true
  }
  return data === true
}

function readQuickReplies(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((reply): reply is string => typeof reply === 'string' && reply.trim() !== '')
    .map((reply) => reply.trim().slice(0, MAX_QUICK_REPLY_LENGTH))
    .slice(0, MAX_QUICK_REPLIES)
}

function readAnswer(payload: unknown): AvaAnswer | null {
  const text = (
    payload as { candidates?: { content?: { parts?: { text?: string }[] } }[] } | null
  )?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('')
  if (!text) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }

  const answer = parsed as Partial<AvaAnswer> | null
  if (!answer || typeof answer.reply !== 'string' || answer.reply.trim() === '') return null

  return {
    reply: answer.reply.trim().slice(0, MAX_REPLY_LENGTH),
    quickReplies: readQuickReplies(answer.quickReplies),
    noResultsReply:
      typeof answer.noResultsReply === 'string' && answer.noResultsReply.trim() !== ''
        ? answer.noResultsReply.trim().slice(0, MAX_REPLY_LENGTH)
        : null,
    noResultsQuickReplies: readQuickReplies(answer.noResultsQuickReplies),
    // Untrusted: the app sanitizes these before building any query.
    filters: answer.filters && typeof answer.filters === 'object' ? answer.filters : {},
  }
}

async function callGemini(apiKey: string, turns: ChatTurn[]): Promise<Response> {
  const model = Deno.env.get('GEMINI_MODEL') || DEFAULT_MODEL
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS)

  try {
    return await fetch(`${GEMINI_API}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: turns.map((turn) => ({
          role: turn.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: turn.text }],
        })),
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 800,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    })
  } finally {
    clearTimeout(timeout)
  }
}

// One retry on a server error; rate limits (429), timeouts and unreadable
// answers go straight to the keyword fallback.
async function askGemini(apiKey: string, turns: ChatTurn[]): Promise<AvaAnswer | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    let response: Response
    try {
      response = await callGemini(apiKey, turns)
    } catch (err) {
      console.error('ai-search Gemini request failed:', err instanceof Error ? err.name : 'unknown')
      return null
    }

    if (response.ok) return readAnswer(await response.json())

    console.error('ai-search Gemini responded with status', response.status)
    if (response.status < 500) return null
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Use POST.', 405)
  }

  try {
    const userId = await resolveUserId(req)
    if (!userId) return errorResponse('UNAUTHORIZED', 'Sign in to chat with Ava.', 401)

    const turns = readTurns(await req.json().catch(() => null))
    if (!turns) return errorResponse('BAD_REQUEST', 'Send at least one message.', 400)

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) return json({ source: 'fallback' })

    if (!(await consumeAllowance(userId))) return json({ source: 'limit' })

    const answer = await askGemini(apiKey, turns)
    if (!answer) return json({ source: 'fallback' })

    return json({ source: 'gemini', ...answer })
  } catch (err) {
    console.error('ai-search failed:', err instanceof Error ? err.message : 'unknown')
    return json({ source: 'fallback' })
  }
})
