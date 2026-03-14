/**
 * E3.R7 — Scoring Engine (Radar Scores)
 * Simplified formulas for hackathon demo.
 * Real data in, mocked weights out.
 */
import type { ScanRawData, RadarScores } from '../types'

/** Clamp a value between 0 and 100 */
function clamp(v: number): number {
  if (!isFinite(v)) return 0
  return Math.max(0, Math.min(100, Math.round(v)))
}

/**
 * Clarity: 100 when 0 fillers, drops toward 0 as fillers/min increases.
 * Formula: 100 - (fillersPerMinute × 10), clamped.
 */
function scoreClarity(raw: ScanRawData): number {
  if (raw.durationSeconds <= 0) return 50
  const fillersPerMinute = (raw.fillerCount / raw.durationSeconds) * 60
  return clamp(100 - fillersPerMinute * 10)
}

/**
 * Confidence: weighted combo of eye contact % and posture score.
 * Formula: eyeContact × 0.6 + posture × 0.4
 */
function scoreConfidence(raw: ScanRawData): number {
  return clamp(raw.eyeContactPercent * 0.6 + raw.postureScore * 0.4)
}

/**
 * Pacing: rewards WPM near 135, penalizes deviation.
 * Formula: 100 - |avgWpm - 135| × 1.5 - wpmStdDev × 0.5
 */
function scorePacing(raw: ScanRawData): number {
  if (raw.avgWpm === 0) return 50
  const deviation = Math.abs(raw.avgWpm - 135)
  return clamp(100 - deviation * 1.5 - raw.wpmStdDev * 0.5)
}

/**
 * Expression: rewards higher pitch standard deviation (variety).
 * Formula: pitchStdDev × 2, clamped. Low std dev = monotone = low score.
 */
function scoreExpression(raw: ScanRawData): number {
  return clamp(raw.pitchStdDev * 2)
}

/**
 * Composure: rewards stillness, penalizes fidgets.
 * Formula: stillnessPercent × 0.7 + (100 - fidgetCount × 5) × 0.3
 */
function scoreComposure(raw: ScanRawData): number {
  const fidgetPenalty = Math.max(0, 100 - raw.fidgetCount * 5)
  return clamp(raw.stillnessPercent * 0.7 + fidgetPenalty * 0.3)
}

/**
 * Compute all 5 radar scores + weighted overall from raw scan data.
 *
 * Weights: Clarity 25%, Confidence 25%, Pacing 20%, Expression 15%, Composure 15%
 */
export function computeRadarScores(raw: ScanRawData): RadarScores {
  const clarity = scoreClarity(raw)
  const confidence = scoreConfidence(raw)
  const pacing = scorePacing(raw)
  const expression = scoreExpression(raw)
  const composure = scoreComposure(raw)

  const overall = clamp(
    clarity * 0.25 +
    confidence * 0.25 +
    pacing * 0.20 +
    expression * 0.15 +
    composure * 0.15
  )

  return { clarity, confidence, pacing, expression, composure, overall }
}
