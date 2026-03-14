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

let recognition: SpeechRecognition | null = null
let active = false
let cumulativeWordCount = 0
const subscribers = new Set<TranscriptCallback>()

function createRecognition(): SpeechRecognition {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) throw new Error('Speech recognition not supported in this browser.')

  const rec = new SpeechRecognition()
  rec.continuous = true
  rec.interimResults = true
  rec.lang = 'en-US'

  rec.onresult = (event: SpeechRecognitionEvent) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      const text = result[0].transcript.trim()
      const isFinal = result.isFinal
      const words = text.split(/\s+/).filter(Boolean).length

      if (isFinal) {
        cumulativeWordCount += words
      }

      const transcriptEvent: TranscriptEvent = {
        text,
        isFinal,
        wordCount: isFinal ? cumulativeWordCount : cumulativeWordCount + words,
        timestamp: Date.now(),
      }

      subscribers.forEach((cb) => cb(transcriptEvent))
    }
  }

  rec.onerror = (event) => {
    // Auto-restart on no-speech errors
    if (event.error === 'no-speech' && active) {
      try { rec.stop() } catch { /* ignore */ }
      setTimeout(() => { if (active) startInternal() }, 200)
    }
  }

  rec.onend = () => {
    // Auto-restart if session is still active
    if (active) {
      setTimeout(() => { if (active) startInternal() }, 200)
    }
  }

  return rec
}

function startInternal() {
  try {
    recognition = createRecognition()
    recognition.start()
  } catch {
    // Already started or other error — retry
    setTimeout(() => { if (active) startInternal() }, 500)
  }
}

export function startTranscription(): void {
  if (active) return
  active = true
  cumulativeWordCount = 0
  startInternal()
}

export function stopTranscription(): void {
  active = false
  if (recognition) {
    try { recognition.stop() } catch { /* ignore */ }
    recognition = null
  }
}

export function onTranscript(callback: TranscriptCallback): () => void {
  subscribers.add(callback)
  return () => { subscribers.delete(callback) }
}

export function isTranscribing(): boolean {
  return active
}
