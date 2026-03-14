/**
 * useEyeContact — React hook wrapping the gaze tracking engine.
 *
 * Maintains session-level statistics:
 *   - Running eye contact percentage (% of frames classified 'good')
 *   - Current streak duration in seconds
 *   - Longest streak
 *   - Quality timeline (for post-session analysis)
 *   - Smoothed quality state that the UI binds to
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { initGazeEngine, startGazeTracking, stopGazeTracking, onGazeReading } from '../mediapipe/gazeEngine'
import type { GazeQuality, GazeReading } from '../mediapipe/gazeEngine'

export interface EyeContactState {
  /** Three-tier quality classification (smoothed, stable) */
  quality: GazeQuality
  /** Smoothed confidence 0–100 */
  confidence: number
  /** Running session percentage (time spent in 'good') */
  sessionPercent: number
  /** Current streak of 'good' quality in seconds */
  currentStreak: number
  /** Longest streak of 'good' quality in seconds */
  longestStreak: number
  /** Head rotation (useful for UI indicators) */
  headYaw: number
  headPitch: number
  /** Individual signal breakdown for debug/advanced display */
  signals: { irisCenter: number; headPose: number; blendshape: number }
  /** Engine state */
  modelReady: boolean
  isTracking: boolean
}

export function useEyeContact() {
  const [state, setState] = useState<EyeContactState>({
    quality: 'lost',
    confidence: 0,
    sessionPercent: 0,
    currentStreak: 0,
    longestStreak: 0,
    headYaw: 0,
    headPitch: 0,
    signals: { irisCenter: 0, headPose: 0, blendshape: 0 },
    modelReady: false,
    isTracking: false,
  })

  // Session-level accumulators (not in React state to avoid re-render per frame)
  const session = useRef({
    totalFrames: 0,
    goodFrames: 0,
    streakStartTime: 0,
    currentStreakSec: 0,
    longestStreakSec: 0,
    wasGood: false,
  })

  const init = useCallback(async () => {
    try {
      await initGazeEngine()
      setState(s => ({ ...s, modelReady: true }))
    } catch {
      // Model failed — UI should handle gracefully
    }
  }, [])

  const startTracking = useCallback((video: HTMLVideoElement) => {
    session.current = {
      totalFrames: 0, goodFrames: 0,
      streakStartTime: Date.now(),
      currentStreakSec: 0, longestStreakSec: 0,
      wasGood: false,
    }
    startGazeTracking(video)
    setState(s => ({ ...s, isTracking: true }))
  }, [])

  const stop = useCallback(() => {
    stopGazeTracking()
    setState(s => ({ ...s, isTracking: false }))
  }, [])

  // Subscribe to gaze readings from the engine
  useEffect(() => {
    const unsub = onGazeReading((reading: GazeReading) => {
      const s = session.current
      s.totalFrames++

      const isGood = reading.quality === 'good'

      if (isGood) {
        s.goodFrames++
        if (!s.wasGood) {
          // Streak just started
          s.streakStartTime = Date.now()
        }
        s.currentStreakSec = Math.floor((Date.now() - s.streakStartTime) / 1000)
        s.longestStreakSec = Math.max(s.longestStreakSec, s.currentStreakSec)
      } else {
        s.currentStreakSec = 0
      }
      s.wasGood = isGood

      const sessionPct = s.totalFrames > 0
        ? Math.round((s.goodFrames / s.totalFrames) * 100)
        : 0

      setState({
        quality: reading.quality,
        confidence: Math.round(reading.confidence * 100),
        sessionPercent: sessionPct,
        currentStreak: s.currentStreakSec,
        longestStreak: s.longestStreakSec,
        headYaw: Math.round(reading.headYaw),
        headPitch: Math.round(reading.headPitch),
        signals: {
          irisCenter: Math.round(reading.signals.irisCenter * 100),
          headPose: Math.round(reading.signals.headPose * 100),
          blendshape: Math.round(reading.signals.blendshape * 100),
        },
        modelReady: true,
        isTracking: true,
      })
    })

    return unsub
  }, [])

  return { ...state, init, startTracking, stopTracking: stop }
}

export type { GazeQuality }
