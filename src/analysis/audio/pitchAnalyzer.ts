/**
 * E3.R6 — Web Audio API Pitch & Volume Analyzer
 * Autocorrelation pitch detection + RMS volume tracking.
 */
import type { AudioFrame } from '../types'

type AudioFrameCallback = (frame: AudioFrame) => void

let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let source: MediaStreamAudioSourceNode | null = null
let compressor: DynamicsCompressorNode | null = null
let rafId = 0
let active = false
const subscribers = new Set<AudioFrameCallback>()

const FFT_SIZE = 2048
const SMOOTHING = 0.8
const MIN_PITCH = 50
const MAX_PITCH = 500
const SILENCE_THRESHOLD = 0.01

/**
 * Autocorrelation pitch detection.
 * Returns fundamental frequency in Hz, or 0 if silence/noise.
 */
function detectPitch(buffer: Float32Array, sampleRate: number): number {
  // Check if there's enough signal
  let rms = 0
  for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i]
  rms = Math.sqrt(rms / buffer.length)
  if (rms < SILENCE_THRESHOLD) return 0

  // Autocorrelation
  const minPeriod = Math.floor(sampleRate / MAX_PITCH)
  const maxPeriod = Math.floor(sampleRate / MIN_PITCH)
  let bestCorrelation = 0
  let bestPeriod = 0

  for (let period = minPeriod; period <= maxPeriod && period < buffer.length; period++) {
    let correlation = 0
    for (let i = 0; i < buffer.length - period; i++) {
      correlation += buffer[i] * buffer[i + period]
    }
    correlation /= (buffer.length - period)
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation
      bestPeriod = period
    }
  }

  if (bestPeriod === 0 || bestCorrelation < 0.01) return 0
  const frequency = sampleRate / bestPeriod
  if (frequency < MIN_PITCH || frequency > MAX_PITCH) return 0
  return Math.round(frequency)
}

/**
 * RMS volume calculation, normalized to 0–1.
 */
function calculateVolume(buffer: Float32Array): number {
  let sum = 0
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i]
  const rms = Math.sqrt(sum / buffer.length)
  if (rms < SILENCE_THRESHOLD) return 0
  // Normalize: typical speech RMS is ~0.05–0.3
  return Math.min(1, rms / 0.3)
}

function tick() {
  if (!active || !analyser) return

  const buffer = new Float32Array(analyser.fftSize)
  analyser.getFloatTimeDomainData(buffer)

  const frame: AudioFrame = {
    pitch: detectPitch(buffer, audioContext!.sampleRate),
    volume: calculateVolume(buffer),
    timestamp: Date.now(),
  }

  subscribers.forEach((cb) => cb(frame))
  rafId = requestAnimationFrame(tick)
}

export function startAudioAnalysis(stream: MediaStream): void {
  if (active) return
  active = true

  audioContext = new AudioContext()
  source = audioContext.createMediaStreamSource(stream)

  // Dynamics compressor: reduces background noise and normalizes speech volume
  compressor = audioContext.createDynamicsCompressor()
  compressor.threshold.value = -40   // start compressing at -40dB
  compressor.knee.value = 6
  compressor.ratio.value = 4         // 4:1 compression
  compressor.attack.value = 0.003
  compressor.release.value = 0.25

  analyser = audioContext.createAnalyser()
  analyser.fftSize = FFT_SIZE
  analyser.smoothingTimeConstant = SMOOTHING

  // Chain: source → compressor → analyser (no destination — observation only)
  source.connect(compressor)
  compressor.connect(analyser)

  rafId = requestAnimationFrame(tick)
}

export function stopAudioAnalysis(): void {
  active = false
  cancelAnimationFrame(rafId)
  if (source) { source.disconnect(); source = null }
  if (compressor) { compressor.disconnect(); compressor = null }
  if (analyser) { analyser.disconnect(); analyser = null }
  if (audioContext) { audioContext.close(); audioContext = null }
}

export function onAudioFrame(callback: AudioFrameCallback): () => void {
  subscribers.add(callback)
  return () => { subscribers.delete(callback) }
}
