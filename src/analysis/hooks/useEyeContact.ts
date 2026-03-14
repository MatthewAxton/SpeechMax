/**
 * useEyeContact — React hook for real-time eye contact detection.
 *
 * Uses MediaPipe FaceLandmarker iris tracking to estimate gaze direction.
 * Compares iris position relative to eye corners to determine if the user
 * is looking at the camera (center of screen).
 *
 * Tradeoff: This is iris-center-in-eye estimation, not true gaze ray-casting.
 * It works well for "are you looking at the camera?" which is all we need
 * for a hackathon speech coach. It won't tell you exactly where on screen
 * they're looking, but it reliably detects camera vs. away.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { initFaceTracker, startFaceTracking, stopFaceTracking, onFaceFrame } from '../mediapipe/faceTracker'

export interface EyeContactState {
  /** Whether the user is currently looking at the camera */
  goodEyeContact: boolean
  /** 0–100 score of how centered their gaze is */
  eyeContactScore: number
  /** Running percentage of time with good eye contact */
  sessionPercent: number
  /** Current streak in seconds of good eye contact */
  currentStreak: number
  /** Longest streak in seconds of good eye contact */
  longestStreak: number
  /** Whether the model has loaded */
  modelReady: boolean
  /** Whether tracking is active */
  isTracking: boolean
}

export function useEyeContact() {
  const [state, setState] = useState<EyeContactState>({
    goodEyeContact: false,
    eyeContactScore: 0,
    sessionPercent: 0,
    currentStreak: 0,
    longestStreak: 0,
    modelReady: false,
    isTracking: false,
  })

  const stats = useRef({
    totalFrames: 0,
    goodFrames: 0,
    streakStart: 0,
    currentStreakSec: 0,
    longestStreakSec: 0,
    lastGood: false,
  })

  const init = useCallback(async () => {
    try {
      await initFaceTracker()
      setState(s => ({ ...s, modelReady: true }))
    } catch {
      // Model failed to load — will show fallback UI
    }
  }, [])

  const startTracking = useCallback((video: HTMLVideoElement) => {
    stats.current = {
      totalFrames: 0, goodFrames: 0,
      streakStart: Date.now(), currentStreakSec: 0,
      longestStreakSec: 0, lastGood: false,
    }
    startFaceTracking(video)
    setState(s => ({ ...s, isTracking: true }))
  }, [])

  const stopTracking = useCallback(() => {
    stopFaceTracking()
    setState(s => ({ ...s, isTracking: false }))
  }, [])

  useEffect(() => {
    const unsub = onFaceFrame((frame) => {
      const s = stats.current
      s.totalFrames++

      if (frame.eyeContact) {
        s.goodFrames++
        if (!s.lastGood) {
          // Streak just started
          s.streakStart = Date.now()
        }
        s.currentStreakSec = Math.floor((Date.now() - s.streakStart) / 1000)
        s.longestStreakSec = Math.max(s.longestStreakSec, s.currentStreakSec)
      } else {
        s.currentStreakSec = 0
        s.streakStart = Date.now()
      }
      s.lastGood = frame.eyeContact

      setState({
        goodEyeContact: frame.eyeContact,
        eyeContactScore: Math.round(frame.eyeContactConfidence * 100),
        sessionPercent: s.totalFrames > 0 ? Math.round((s.goodFrames / s.totalFrames) * 100) : 0,
        currentStreak: s.currentStreakSec,
        longestStreak: s.longestStreakSec,
        modelReady: true,
        isTracking: true,
      })
    })

    return unsub
  }, [])

  return { ...state, init, startTracking, stopTracking }
}
