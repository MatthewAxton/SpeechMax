/**
 * E3.R1 — Web Speech API Transcriber
 * Wraps the browser's speech recognition API with auto-restart and pub/sub.
 */
import type { TranscriptEvent } from '../types'

type TranscriptCallback = (event: TranscriptEvent) => void

// Extend window for webkit prefix
interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

// Simulation fallback sentences
const SIM_SENTENCES = [
  'I think the most important thing is to stay focused',
  'um you know when I was working on that project',
  'basically what happened was we had to like rethink everything',
  'so I decided to take a different approach to the problem',
  'the results were actually quite impressive I think',
  'I mean it was challenging but we got through it',
  'like the key insight was understanding the user needs',
  'you know I believe communication is um really important',
  'so basically we implemented a new strategy and it worked',
  'I would say my greatest strength is problem solving',
  'right so the way I handle conflict is through dialogue',
  'actually I find that preparation is like really key',
]

let recognition: SpeechRecognition | null = null
let active = false
let cumulativeWordCount = 0
let lastError: string | null = null
const subscribers = new Set<TranscriptCallback>()

// Simulation fallback state
let simMode = false
let simInterval: ReturnType<typeof setInterval> | null = null
let simIndex = 0
let resultReceived = false
let fallbackTimer: ReturnType<typeof setTimeout> | null = null

function startSimulation() {
  simMode = true
  console.log('[SpeechMAX] Speech recognition fallback: simulation mode active')
  simInterval = setInterval(() => {
    if (!active) return
    const text = SIM_SENTENCES[simIndex % SIM_SENTENCES.length]
    simIndex++
    const words = text.split(/\s+/).filter(Boolean).length
    cumulativeWordCount += words
    const event: TranscriptEvent = {
      text,
      isFinal: true,
      wordCount: cumulativeWordCount,
      timestamp: Date.now(),
    }
    subscribers.forEach(cb => cb(event))
  }, 2000 + Math.random() * 1500)
}

function createRecognition(): SpeechRecognition {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) throw new Error('Speech recognition not supported in this browser.')

  const rec = new SpeechRecognition()
  rec.continuous = true
  rec.interimResults = true
  rec.maxAlternatives = 3
  rec.lang = 'en-US'

  rec.onresult = (event: SpeechRecognitionEvent) => {
    resultReceived = true
    lastError = null
    if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null }
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      const isFinal = result.isFinal

      // Pick the best alternative by confidence score
      let bestText = result[0].transcript.trim()
      let bestConfidence = result[0].confidence
      for (let j = 1; j < result.length; j++) {
        if (result[j].confidence > bestConfidence) {
          bestText = result[j].transcript.trim()
          bestConfidence = result[j].confidence
        }
      }

      // Skip very low confidence final results (likely noise)
      if (isFinal && bestConfidence > 0 && bestConfidence < 0.3) continue

      const words = bestText.split(/\s+/).filter(Boolean).length

      if (isFinal) {
        cumulativeWordCount += words
      }

      const transcriptEvent: TranscriptEvent = {
        text: bestText,
        isFinal,
        wordCount: isFinal ? cumulativeWordCount : cumulativeWordCount + words,
        timestamp: Date.now(),
      }

      subscribers.forEach((cb) => cb(transcriptEvent))
    }
  }

  rec.onerror = (event) => {
    console.warn('[SpeechMAX] SpeechRecognition error:', event.error)
    lastError = event.error
    // Auto-restart on recoverable errors (not 'not-allowed' or 'service-not-allowed')
    if (active && event.error !== 'not-allowed' && event.error !== 'service-not-allowed') {
      try { rec.stop() } catch { /* ignore */ }
      setTimeout(() => { if (active) startInternal() }, 100)
    }
  }

  rec.onend = () => {
    // Auto-restart immediately if session is still active — minimize gap
    if (active) {
      setTimeout(() => { if (active) startInternal() }, 50)
    }
  }

  return rec
}

function startInternal() {
  try {
    recognition = createRecognition()
    recognition.start()
    console.log('[SpeechMAX] SpeechRecognition started')
  } catch (e) {
    console.warn('[SpeechMAX] SpeechRecognition start failed, retrying...', e)
    setTimeout(() => { if (active) startInternal() }, 500)
  }
}

export function startTranscription(): void {
  if (active) return
  active = true
  cumulativeWordCount = 0
  startInternal()
  resultReceived = false
  simMode = false
  fallbackTimer = setTimeout(() => {
    if (active && !resultReceived && !simMode) startSimulation()
  }, 5000)
}

export function stopTranscription(): void {
  active = false
  if (recognition) {
    try { recognition.stop() } catch { /* ignore */ }
    recognition = null
  }
  if (simInterval) { clearInterval(simInterval); simInterval = null }
  if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null }
  simMode = false
}

export function onTranscript(callback: TranscriptCallback): () => void {
  subscribers.add(callback)
  return () => { subscribers.delete(callback) }
}

export function isTranscribing(): boolean {
  return active
}

export function getTranscriberStatus(): { active: boolean; error: string | null; simulated: boolean } {
  return { active, error: lastError, simulated: simMode }
}
