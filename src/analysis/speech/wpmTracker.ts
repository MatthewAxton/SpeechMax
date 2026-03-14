/**
 * E3.R3 — WPM Tracker
 * Tracks words-per-minute with session average and rolling 5-second window.
 */
import type { TranscriptEvent } from '../types'
import { onTranscript } from './transcriber'

type WpmCallback = (wpm: { session: number; rolling: number }) => void

interface WordEntry {
  wordCount: number
  timestamp: number
}

const ROLLING_WINDOW_MS = 5000
const subscribers = new Set<WpmCallback>()
let startTime = 0
let totalWords = 0
const buffer: WordEntry[] = []
let intervalId: ReturnType<typeof setInterval> | null = null
let unsubTranscript: (() => void) | null = null

function processTranscript(event: TranscriptEvent) {
  if (!event.isFinal) return

  if (startTime === 0) startTime = Date.now()

  const words = event.text.split(/\s+/).filter(Boolean).length
  totalWords += words
  buffer.push({ wordCount: words, timestamp: Date.now() })
}

function pruneBuffer() {
  const cutoff = Date.now() - ROLLING_WINDOW_MS
  while (buffer.length > 0 && buffer[0].timestamp < cutoff) {
    buffer.shift()
  }
}

export function getSessionWpm(): number {
  if (startTime === 0 || totalWords === 0) return 0
  const elapsedSeconds = (Date.now() - startTime) / 1000
  if (elapsedSeconds < 1) return 0
  return Math.round((totalWords / elapsedSeconds) * 60)
}

export function getRollingWpm(): number {
  pruneBuffer()
  const wordsInWindow = buffer.reduce((sum, e) => sum + e.wordCount, 0)
  // words in 5 seconds × 12 = words per minute
  return Math.round(wordsInWindow * 12)
}

function emitReading() {
  const reading = { session: getSessionWpm(), rolling: getRollingWpm() }
  subscribers.forEach((cb) => cb(reading))
}

export function startWpmTracking(): void {
  startTime = 0
  totalWords = 0
  buffer.length = 0
  unsubTranscript = onTranscript(processTranscript)
  intervalId = setInterval(emitReading, 1000)
}

export function stopWpmTracking(): void {
  if (unsubTranscript) {
    unsubTranscript()
    unsubTranscript = null
  }
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

export function onWpmReading(callback: WpmCallback): () => void {
  subscribers.add(callback)
  return () => { subscribers.delete(callback) }
}
