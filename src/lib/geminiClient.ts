const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

interface GeminiMessage {
  role: 'user' | 'model'
  text: string
}

export async function sendToGemini(messages: GeminiMessage[]): Promise<string> {
  try {
    const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const res = await fetch(`${SUPABASE_URL}/functions/v1/gemini-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
      },
      body: JSON.stringify({
        contents: messages.map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        })),
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    console.log('[Gemini] Response status:', res.status)
    if (!res.ok) {
      const errText = await res.text()
      console.error('[Gemini] Proxy error:', res.status, errText)
      return "Sorry, I'm having trouble connecting right now. Try again in a moment!"
    }

    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text
      ?? "Hmm, I didn't get a response. Try asking again!"
  } catch (err) {
    console.error('[Gemini] Fetch error:', err)
    return "Sorry, I'm having trouble connecting right now. Try again in a moment!"
  }
}
