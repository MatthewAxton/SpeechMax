/**
 * gazeEngine.ts — Lightweight eye-tracking engine for speech coaching.
 *
 * Architecture:
 *   Input:  MediaPipe FaceLandmarker (478 face landmarks + iris + blendshapes)
 *   Signal: Three independent gaze signals fused into one confidence score
 *   Smooth: Exponential moving average to eliminate flicker
 *   State:  Three-tier classification (good / weak / lost)
 *   Output: Smoothed GazeReading emitted per frame
 *
 * Signal fusion approach:
 *   1. Iris centering (horizontal + vertical) — how centered the iris is within the eye
 *   2. Head pose yaw/pitch — are they facing the camera or turned away?
 *   3. Blendshape gaze direction — MediaPipe's own eye look signals
 *
 * Each signal produces a 0–1 confidence. They're weighted and fused:
 *   iris: 40%, head pose: 35%, blendshapes: 25%
 *
 * The fused score is then smoothed with an EMA (α = 0.3) to prevent
 * frame-to-frame jitter from causing UI flicker.
 *
 * Classification thresholds (on smoothed score):
 *   ≥ 0.65  → 'good'    (solid eye contact)
 *   ≥ 0.35  → 'weak'    (drifting, partially looking away)
 *   < 0.35  → 'lost'    (clearly not looking at camera)
 */

import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

// ─── Types ───────────────────────────────────────────────────────────────────

export type GazeQuality = 'good' | 'weak' | 'lost'

export interface GazeReading {
  /** Raw fused confidence before smoothing (0–1) */
  rawConfidence: number
  /** Smoothed confidence after EMA (0–1) */
  confidence: number
  /** Three-tier classification based on smoothed confidence */
  quality: GazeQuality
  /** Individual signal contributions (for debugging / advanced UI) */
  signals: {
    irisCenter: number   // 0–1
    headPose: number     // 0–1
    blendshape: number   // 0–1
  }
  /** Head rotation estimates in degrees */
  headYaw: number
  headPitch: number
  /** Timestamp */
  timestamp: number
}

type GazeCallback = (reading: GazeReading) => void

// ─── Constants ───────────────────────────────────────────────────────────────

const SIGNAL_WEIGHTS = { iris: 0.40, headPose: 0.35, blendshape: 0.25 }
const EMA_ALPHA = 0.3          // Smoothing factor — lower = smoother but laggier
const GOOD_THRESHOLD = 0.65
const WEAK_THRESHOLD = 0.35

// ─── State ───────────────────────────────────────────────────────────────────

let faceLandmarker: FaceLandmarker | null = null
let rafId = 0
let active = false
let smoothedConfidence = 0.5   // Start at neutral
const subscribers = new Set<GazeCallback>()

// ─── Init ────────────────────────────────────────────────────────────────────

export async function initGazeEngine(): Promise<void> {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  )
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    outputFaceBlendshapes: true,
  })
}

// ─── Signal 1: Iris centering ────────────────────────────────────────────────
// Measures how centered each iris is within its eye socket, both horizontally
// and vertically. A perfectly centered iris means looking straight at camera.

function computeIrisCentering(landmarks: { x: number; y: number; z: number }[]): number {
  if (landmarks.length <= 473) return 0.5

  // Left eye: iris 468, corners 33 (outer) / 133 (inner), top 159, bottom 145
  const li = landmarks[468]
  const lo = landmarks[33], lin = landmarks[133]
  const lt = landmarks[159], lb = landmarks[145]
  const lCenterX = (lo.x + lin.x) / 2
  const lCenterY = (lt.y + lb.y) / 2
  const lWidth = Math.abs(lo.x - lin.x) || 0.01
  const lHeight = Math.abs(lt.y - lb.y) || 0.01
  const lDeviationX = Math.abs(li.x - lCenterX) / lWidth   // normalized 0–0.5
  const lDeviationY = Math.abs(li.y - lCenterY) / lHeight

  // Right eye: iris 473, corners 362 (outer) / 263 (inner), top 386, bottom 374
  const ri = landmarks[473]
  const ro = landmarks[362], rin = landmarks[263]
  const rt = landmarks[386], rb = landmarks[374]
  const rCenterX = (ro.x + rin.x) / 2
  const rCenterY = (rt.y + rb.y) / 2
  const rWidth = Math.abs(ro.x - rin.x) || 0.01
  const rHeight = Math.abs(rt.y - rb.y) || 0.01
  const rDeviationX = Math.abs(ri.x - rCenterX) / rWidth
  const rDeviationY = Math.abs(ri.y - rCenterY) / rHeight

  // Average deviation across both eyes, both axes
  const avgDeviation = (lDeviationX + lDeviationY + rDeviationX + rDeviationY) / 4

  // Map: 0 deviation = 1.0 confidence, 0.3+ deviation = 0.0
  return Math.max(0, Math.min(1, 1 - avgDeviation * 3.3))
}

// ─── Signal 2: Head pose estimation ──────────────────────────────────────────
// Estimates yaw (left-right) and pitch (up-down) from nose tip, chin, and
// forehead landmarks. Returns confidence that head is facing camera.

function computeHeadPose(landmarks: { x: number; y: number; z: number }[]): { confidence: number; yaw: number; pitch: number } {
  if (landmarks.length < 10) return { confidence: 0.5, yaw: 0, pitch: 0 }

  const noseTip = landmarks[1]
  const noseBridge = landmarks[6]
  const leftCheek = landmarks[234]
  const rightCheek = landmarks[454]
  const chin = landmarks[152]
  const forehead = landmarks[10]

  // Yaw: nose tip horizontal position relative to cheek midpoint
  // If nose is centered between cheeks → facing camera
  const cheekMidX = (leftCheek.x + rightCheek.x) / 2
  const cheekWidth = Math.abs(leftCheek.x - rightCheek.x) || 0.01
  const yawOffset = (noseTip.x - cheekMidX) / cheekWidth
  const yawDegrees = yawOffset * 90  // approximate

  // Pitch: nose bridge vertical position relative to forehead–chin line
  const faceHeight = Math.abs(forehead.y - chin.y) || 0.01
  const faceMidY = (forehead.y + chin.y) / 2
  const pitchOffset = (noseBridge.y - faceMidY) / faceHeight
  const pitchDegrees = pitchOffset * 90

  // Confidence: high when yaw and pitch are near zero
  const yawConfidence = Math.max(0, 1 - Math.abs(yawDegrees) / 30)
  const pitchConfidence = Math.max(0, 1 - Math.abs(pitchDegrees) / 25)
  const confidence = yawConfidence * 0.6 + pitchConfidence * 0.4

  return { confidence: Math.max(0, Math.min(1, confidence)), yaw: yawDegrees, pitch: pitchDegrees }
}

// ─── Signal 3: Blendshape gaze signals ───────────────────────────────────────
// MediaPipe outputs blendshapes like eyeLookOutLeft, eyeLookInRight, etc.
// When looking at camera, "lookOut" and "lookIn" should be balanced/low.
// When looking away, one side dominates.

function computeBlendshapeGaze(blendshapes: { categoryName: string; score: number }[]): number {
  const get = (name: string) => blendshapes.find(b => b.categoryName === name)?.score ?? 0

  const lookOutL = get('eyeLookOutLeft')
  const lookInL = get('eyeLookInLeft')
  const lookOutR = get('eyeLookOutRight')
  const lookInR = get('eyeLookInRight')
  const lookUpL = get('eyeLookUpLeft')
  const lookDownL = get('eyeLookDownLeft')
  const lookUpR = get('eyeLookUpRight')
  const lookDownR = get('eyeLookDownRight')

  // Horizontal: looking away = high lookOut or high lookIn on one side
  const hDeviation = (Math.abs(lookOutL - lookInR) + Math.abs(lookOutR - lookInL)) / 2
  // Vertical: looking up/down
  const vDeviation = (lookUpL + lookUpR + lookDownL + lookDownR) / 4

  // Total deviation — low = looking at camera
  const totalDeviation = hDeviation * 0.6 + vDeviation * 0.4
  return Math.max(0, Math.min(1, 1 - totalDeviation * 2.5))
}

// ─── Frame processing ────────────────────────────────────────────────────────

function processFrame(video: HTMLVideoElement) {
  if (!active || !faceLandmarker) return

  const now = performance.now()
  const results = faceLandmarker.detectForVideo(video, now)

  let reading: GazeReading

  if (results.faceLandmarks && results.faceLandmarks.length > 0) {
    const landmarks = results.faceLandmarks[0]

    // Compute three independent signals
    const irisCenter = computeIrisCentering(landmarks)
    const headPoseResult = computeHeadPose(landmarks)

    let blendshape = 0.5
    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
      blendshape = computeBlendshapeGaze(results.faceBlendshapes[0].categories)
    }

    // Fuse signals with weights
    const rawConfidence =
      irisCenter * SIGNAL_WEIGHTS.iris +
      headPoseResult.confidence * SIGNAL_WEIGHTS.headPose +
      blendshape * SIGNAL_WEIGHTS.blendshape

    // Apply EMA smoothing
    smoothedConfidence = EMA_ALPHA * rawConfidence + (1 - EMA_ALPHA) * smoothedConfidence

    // Classify
    let quality: GazeQuality = 'lost'
    if (smoothedConfidence >= GOOD_THRESHOLD) quality = 'good'
    else if (smoothedConfidence >= WEAK_THRESHOLD) quality = 'weak'

    reading = {
      rawConfidence,
      confidence: smoothedConfidence,
      quality,
      signals: { irisCenter, headPose: headPoseResult.confidence, blendshape },
      headYaw: headPoseResult.yaw,
      headPitch: headPoseResult.pitch,
      timestamp: Date.now(),
    }
  } else {
    // No face detected — decay confidence toward 0
    smoothedConfidence = EMA_ALPHA * 0 + (1 - EMA_ALPHA) * smoothedConfidence

    reading = {
      rawConfidence: 0,
      confidence: smoothedConfidence,
      quality: smoothedConfidence >= WEAK_THRESHOLD ? 'weak' : 'lost',
      signals: { irisCenter: 0, headPose: 0, blendshape: 0 },
      headYaw: 0,
      headPitch: 0,
      timestamp: Date.now(),
    }
  }

  subscribers.forEach(cb => cb(reading))
  rafId = requestAnimationFrame(() => processFrame(video))
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function startGazeTracking(video: HTMLVideoElement): void {
  if (active) return
  active = true
  smoothedConfidence = 0.5
  rafId = requestAnimationFrame(() => processFrame(video))
}

export function stopGazeTracking(): void {
  active = false
  cancelAnimationFrame(rafId)
}

export function onGazeReading(callback: GazeCallback): () => void {
  subscribers.add(callback)
  return () => { subscribers.delete(callback) }
}
