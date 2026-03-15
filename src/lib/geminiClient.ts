const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${API_KEY}`

interface GeminiMessage {
  role: 'user' | 'model'
  text: string
}

export async function sendToGemini(messages: GeminiMessage[]): Promise<string> {
  if (!API_KEY) {
    console.error('Missing VITE_GEMINI_API_KEY in .env')
    return "API key not configured. Add VITE_GEMINI_API_KEY to your .env file."
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages.map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        })),
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Gemini API error:', errText)
      return "Sorry, I'm having trouble connecting right now. Try again in a moment!"
    }

    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text
      ?? "Hmm, I didn't get a response. Try asking again!"
  } catch (err) {
    console.error('Gemini fetch error:', err)
    return "Sorry, I'm having trouble connecting right now. Try again in a moment!"
  }
}
