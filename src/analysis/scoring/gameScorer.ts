/**
 * E3.R7 — Game Scoring Engine
 * Per-game scoring formulas. Simplified for demo.
 */
import type { GameType } from '../types'

function clamp(v: number): number {
  if (!isFinite(v)) return 0
  return Math.max(0, Math.min(100, Math.round(v)))
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
      const fillerPenalty = fillerCount * 15
      const streakBonus = Math.min(30, longestStreakSeconds)
      return clamp(100 - fillerPenalty + streakBonus)
    }
    case 'eye-lock': {
      const { gazeLockedPercent, longestGazeSeconds } = metrics.data
      const gazeScore = gazeLockedPercent
      const streakBonus = Math.min(15, longestGazeSeconds * 0.5)
      return clamp(gazeScore + streakBonus)
    }
    case 'pace-racer': {
      const { timeInZoneSeconds, totalSeconds, avgWpm } = metrics.data
      if (totalSeconds <= 0) return 50
      if (timeInZoneSeconds === 0 && avgWpm === 0) return 15
      const zoneScore = (timeInZoneSeconds / totalSeconds) * 100
      return clamp(Math.max(10, zoneScore))
    }
    case 'pitch-surfer': {
      const { pitchVariation, monotoneSeconds, totalSeconds } = metrics.data
      if (totalSeconds <= 0) return 50
      const variationScore = Math.min(60, pitchVariation * 3)
      const monotonePenalty = (monotoneSeconds / totalSeconds) * 60
      return clamp(variationScore + 40 - monotonePenalty)
    }
    case 'statue-mode': {
      const { stillnessPercent, movementAlerts, avgPresenceScore, presenceStreakSeconds, badHabitCount } = metrics.data
      // New scoring when presence data available
      if (avgPresenceScore != null) {
        const streakBonus = Math.min(20, (presenceStreakSeconds ?? 0) * 0.5)
        const habitPenalty = (badHabitCount ?? 0) * 3
        return clamp(avgPresenceScore + streakBonus - habitPenalty)
      }
      // Fallback: original formula
      return clamp(stillnessPercent - movementAlerts * 8)
    }
  }
}

/** Simple helper to compute score from a flat metrics record (for existing game screens). */
export function computeSimpleGameScore(gameType: GameType, metrics: Record<string, number>): number {
  switch (gameType) {
    case 'filler-ninja':
      return computeGameScore({ type: 'filler-ninja', data: { fillerCount: metrics.fillerCount ?? 0, durationSeconds: metrics.durationSeconds ?? 90, longestStreakSeconds: metrics.longestStreakSeconds ?? 0 } })
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
