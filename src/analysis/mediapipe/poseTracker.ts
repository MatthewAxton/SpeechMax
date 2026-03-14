/**
 * E3.R5 — MediaPipe Pose & Hand Tracker
 * Posture scoring, head stability, hand movement, and fidget detection.
 */
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

interface LandmarkPos { x: number; y: number }

export interface PoseFrame {
  postureScore: number      // 0–100
  headStability: number     // 0–1
  handMovement: number      // 0–1
  isFidgeting: boolean
  timestamp: number
  /** Key body landmarks (normalized 0–1) for UI overlay */
  bodyLandmarks: {
    nose: LandmarkPos
    leftShoulder: LandmarkPos
    rightShoulder: LandmarkPos
    leftElbow: LandmarkPos
    rightElbow: LandmarkPos
    leftWrist: LandmarkPos
    rightWrist: LandmarkPos
    leftHip: LandmarkPos
    rightHip: LandmarkPos
  } | null
}

type PoseFrameCallback = (frame: PoseFrame) => void

let poseLandmarker: PoseLandmarker | null = null
let rafId = 0
let active = false
let frameCount = 0
const subscribers = new Set<PoseFrameCallback>()

// Buffers for stability calculation
const headPositions: { x: number; y: number }[] = []
let prevLeftWrist: { x: number; y: number } | null = null
let prevRightWrist: { x: number; y: number } | null = null
const HEAD_BUFFER_SIZE = 30

export async function initPoseTracker(): Promise<void> {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  )
  poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
  })
}

function euclidean(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length)
}

function processFrame(video: HTMLVideoElement) {
  if (!active || !poseLandmarker) return

  frameCount++
  if (frameCount % 2 !== 0) {
    rafId = requestAnimationFrame(() => processFrame(video))
    return
  }

  const startTimeMs = performance.now()
  const results = poseLandmarker.detectForVideo(video, startTimeMs)

  let postureScore = 75
  let headStability = 1
  let handMovement = 0
  let isFidgeting = false

  if (results.landmarks && results.landmarks.length > 0) {
    const lm = results.landmarks[0]

    // Posture: angle from shoulders
    // Left shoulder: 11, Right shoulder: 12, Nose (head proxy): 0
    if (lm.length > 12) {
      const leftShoulder = lm[11]
      const rightShoulder = lm[12]
      const nose = lm[0]

      // Simple posture: how level are shoulders + how upright is head above shoulders
      const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2
      const headAboveShoulder = shoulderMidY - nose.y // positive = head above
      const shoulderLevel = 1 - Math.abs(leftShoulder.y - rightShoulder.y) * 10
      postureScore = Math.max(0, Math.min(100, (headAboveShoulder * 300 + shoulderLevel * 50)))
    }

    // Head stability
    if (lm.length > 0) {
      headPositions.push({ x: lm[0].x, y: lm[0].y })
      if (headPositions.length > HEAD_BUFFER_SIZE) headPositions.shift()
      if (headPositions.length >= 5) {
        const xStd = stdDev(headPositions.map(p => p.x))
        const yStd = stdDev(headPositions.map(p => p.y))
        const totalStd = xStd + yStd
        headStability = Math.max(0, Math.min(1, 1 - totalStd * 15))
      }
    }

    // Hand movement
    if (lm.length > 16) {
      const leftWrist = { x: lm[15].x, y: lm[15].y }
      const rightWrist = { x: lm[16].x, y: lm[16].y }

      let movement = 0
      if (prevLeftWrist) movement += euclidean(leftWrist, prevLeftWrist)
      if (prevRightWrist) movement += euclidean(rightWrist, prevRightWrist)

      prevLeftWrist = leftWrist
      prevRightWrist = rightWrist

      handMovement = Math.min(1, movement * 8)
      isFidgeting = handMovement > 0.35
    }
  }

  // Extract key body landmarks for UI overlay
  let bodyLandmarks: PoseFrame['bodyLandmarks'] = null
  if (results.landmarks && results.landmarks.length > 0) {
    const lm = results.landmarks[0]
    if (lm.length > 24) {
      const p = (i: number): LandmarkPos => ({ x: lm[i].x, y: lm[i].y })
      bodyLandmarks = {
        nose: p(0), leftShoulder: p(11), rightShoulder: p(12),
        leftElbow: p(13), rightElbow: p(14),
        leftWrist: p(15), rightWrist: p(16),
        leftHip: p(23), rightHip: p(24),
      }
    }
  }

  const frame: PoseFrame = { postureScore, headStability, handMovement, isFidgeting, timestamp: Date.now(), bodyLandmarks }
  subscribers.forEach(cb => cb(frame))
  rafId = requestAnimationFrame(() => processFrame(video))
}

export function startPoseTracking(video: HTMLVideoElement): void {
  if (active) return
  active = true
  headPositions.length = 0
  prevLeftWrist = null
  prevRightWrist = null
  frameCount = 0
  rafId = requestAnimationFrame(() => processFrame(video))
}

export function stopPoseTracking(): void {
  active = false
  cancelAnimationFrame(rafId)
}

export function onPoseFrame(callback: PoseFrameCallback): () => void {
  subscribers.add(callback)
  return () => { subscribers.delete(callback) }
}
