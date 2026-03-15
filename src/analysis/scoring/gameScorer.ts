/**
 * E3.R7 — Game Scoring Engine
 * Per-game scoring formulas with smooth curves to avoid 0/100 extremes.
 */
import type { GameType } from '../types'

function clamp(v: number): number {
  if (!isFinite(v)) return 30
  return Math.max(0, Math.min(100, Math.round(v)))
}

/** Smooth curve: maps 0-1 input to 20-95 range with diminishing returns */
function smoothScore(ratio: number, floor = 15, ceiling = 95): number {
  const clamped = Math.max(0, Math.min(1, ratio))
  // Ease-out curve: rises fast at first, then plateaus
  const curved = 1 - Math.pow(1 - clamped, 1.8)
  return floor + curved * (ceiling - floor)
}

interface FillerNinjaMetrics {
  fillerCount: number
  durationSeconds: number
  longestStreakSeconds: number
}

interface EyeLockMetrics {
  gazeLockedPercent: number
  longestGazeSeconds: number
}

interface PaceRacerMetrics {
  timeInZoneSeconds: number
  totalSeconds: number
  avgWpm: number
}

interface PitchSurferMetrics {
  pitchVariation: number  // std dev in Hz
  monotoneSeconds: number
  totalSeconds: number
}

interface StatueModeMetrics {
  stillnessPercent: number
  movementAlerts: number
  avgPresenceScore?: number
  presenceStreakSeconds?: number
  badHabitCount?: number
}

type GameMetrics =
  | { type: 'filler-ninja'; data: FillerNinjaMetrics }
  | { type: 'eye-lock'; data: EyeLockMetrics }
  | { type: 'pace-racer'; data: PaceRacerMetrics }
  | { type: 'pitch-surfer'; data: PitchSurferMetrics }
  | { type: 'statue-mode'; data: StatueModeMetrics }

export function computeGameScore(metrics: GameMetrics): number {
  switch (metrics.type) {
    case 'filler-ninja': {
      const { fillerCount, durationSeconds, longestStreakSeconds } = metrics.data
      if (durationSeconds <= 0) return 50
      // Fillers per minute — normalized metric
      const fillersPerMin = (fillerCount / durationSeconds) * 60
      // 0 fillers/min → ~90, 2/min → ~70, 5/min → ~45, 10/min → ~25
      const baseScore = Math.max(15, 95 - fillersPerMin * 8)
      // Streak bonus: up to +10 for long filler-free runs
      const streakBonus = Math.min(10, longestStreakSeconds * 0.3)
      return clamp(baseScore + streakBonus)
    }
    case 'eye-lock': {
      const { gazeLockedPercent, longestGazeSeconds } = metrics.data
      // Smooth curve: 0% → 15, 50% → ~55, 80% → ~80, 100% → ~90
      const baseScore = smoothScore(gazeLockedPercent / 100, 15, 90)
      // Streak bonus: up to +10
      const streakBonus = Math.min(10, longestGazeSeconds * 0.3)
      return clamp(baseScore + streakBonus)
    }
    case 'pace-racer': {
      const { timeInZoneSeconds, totalSeconds, avgWpm } = metrics.data
      if (totalSeconds <= 0) return 50
      if (timeInZoneSeconds === 0 && avgWpm === 0) return 15
      const zoneRatio = timeInZoneSeconds / totalSeconds
      // Smooth curve: 0% → 15, 30% → ~45, 60% → ~70, 100% → ~95
      return clamp(smoothScore(zoneRatio))
    }
    case 'pitch-surfer': {
      const { pitchVariation, monotoneSeconds, totalSeconds } = metrics.data
      if (totalSeconds <= 0) return 50
      // Pitch variation score: typical good speech is 15-40Hz std dev
      // 0 → 15, 10 → ~45, 20 → ~65, 30+ → ~80
      const variationRatio = Math.min(1, pitchVariation / 35)
      const baseScore = smoothScore(variationRatio, 15, 85)
      // Monotone penalty: proportional to time spent monotone
      const monotoneRatio = monotoneSeconds / totalSeconds
      const penalty = monotoneRatio * 25
      return clamp(baseScore - penalty + 10) // +10 base boost
    }
    case 'statue-mode': {
      const { stillnessPercent, movementAlerts, avgPresenceScore, presenceStreakSeconds, badHabitCount } = metrics.data
      // New scoring when presence data available
      if (avgPresenceScore != null) {
        const baseScore = smoothScore(avgPresenceScore / 100, 20, 90)
        const streakBonus = Math.min(10, (presenceStreakSeconds ?? 0) * 0.3)
        const habitPenalty = Math.min(20, (badHabitCount ?? 0) * 3)
        return clamp(baseScore + streakBonus - habitPenalty)
      }
      // Fallback: original formula with smooth curve
      const baseScore = smoothScore(stillnessPercent / 100, 20, 90)
      const penalty = Math.min(30, movementAlerts * 4)
      return clamp(baseScore - penalty)
    }
  }
}

/** Simple helper to compute score from a flat metrics record (for existing game screens). */
export function computeSimpleGameScore(gameType: GameType, metrics: Record<string, number>): number {
  switch (gameType) {
    case 'filler-ninja':
      return computeGameScore({ type: 'filler-ninja', data: { fillerCount: metrics.fillerCount ?? 0, durationSeconds: metrics.durationSeconds ?? 60, longestStreakSeconds: metrics.longestStreakSeconds ?? 0 } })
    case 'eye-lock':
      return computeGameScore({ type: 'eye-lock', data: { gazeLockedPercent: metrics.gazeLockedPercent ?? 0, longestGazeSeconds: metrics.longestGazeSeconds ?? 0 } })
    case 'pace-racer':
      return computeGameScore({ type: 'pace-racer', data: { timeInZoneSeconds: metrics.timeInZoneSeconds ?? 0, totalSeconds: metrics.totalSeconds ?? 60, avgWpm: metrics.avgWpm ?? 0 } })
    case 'pitch-surfer':
      return computeGameScore({ type: 'pitch-surfer', data: { pitchVariation: metrics.pitchVariation ?? 0, monotoneSeconds: metrics.monotoneSeconds ?? 0, totalSeconds: metrics.totalSeconds ?? 30 } })
    case 'statue-mode':
      return computeGameScore({ type: 'statue-mode', data: {
        stillnessPercent: metrics.stillnessPercent ?? 0,
        movementAlerts: metrics.movementAlerts ?? 0,
        avgPresenceScore: metrics.avgPresenceScore,
        presenceStreakSeconds: metrics.presenceStreakSeconds,
        badHabitCount: metrics.badHabitCount,
      } })
  }
}
