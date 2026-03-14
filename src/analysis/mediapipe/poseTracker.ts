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
  // Stage Presence fields (all optional — backward compatible)
  shoulderLevel?: number       // 0-1 how level shoulders are
  uprightAlignment?: number    // 0-1 head above shoulders
  openness?: number            // 0-1 inverse of closed postures
  gestureQuality?: number      // 0-1 hands in power zone with movement
  stability?: number           // 0-1 hip midpoint stability
  armsCrossed?: boolean
  handsInPockets?: boolean
  faceTouching?: boolean
  figLeaf?: boolean
  handsBehindBack?: boolean
  presenceScore?: number       // 0-100 weighted composite
}

type PoseFrameCallback = (frame: PoseFrame) => void

let poseLandmarker: PoseLandmarker | null = null
let initPromise: Promise<void> | null = null
let rafId = 0
let active = false
let frameCount = 0
const subscribers = new Set<PoseFrameCallback>()

// Buffers for stability calculation
const headPositions: { x: number; y: number }[] = []
const hipPositions: { x: number; y: number }[] = []
let prevLeftWrist: { x: number; y: number } | null = null
let prevRightWrist: { x: number; y: number } | null = null
const HEAD_BUFFER_SIZE = 30
const HIP_BUFFER_SIZE = 30

export async function initPoseTracker(): Promise<void> {
  // Singleton: reuse existing model or in-flight init
  if (poseLandmarker) return
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
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
    } catch (e) {
      initPromise = null // Allow retry on failure
      throw e
    }
  })()
  return initPromise
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

  // Skip if video isn't ready yet
  if (video.readyState < 2) {
    rafId = requestAnimationFrame(() => processFrame(video))
    return
  }

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
        headStability = Math.max(0, Math.min(1, 1 - totalStd * 8))
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

      handMovement = Math.min(1, movement * 4)
      isFidgeting = handMovement > 0.5
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

  // Stage Presence detection
  let shoulderLevel = 0
  let uprightAlignment = 0
  let openness = 1
  let gestureQuality = 0
  let stability = 1
  let armsCrossed = false
  let handsInPockets = false
  let faceTouching = false
  let figLeaf = false
  let handsBehindBack = false
  let presenceScore = 0

  if (results.landmarks && results.landmarks.length > 0) {
    const lm = results.landmarks[0]
    if (lm.length > 24) {
      const nose = lm[0]
      const lShoulder = lm[11], rShoulder = lm[12]
      const lWrist = lm[15], rWrist = lm[16]
      const lHip = lm[23], rHip = lm[24]

      // Shoulder level: 1 = perfectly level
      shoulderLevel = Math.max(0, Math.min(1, 1 - Math.abs(lShoulder.y - rShoulder.y) * 10))

      // Upright alignment: head above shoulder midpoint
      const shoulderMidY = (lShoulder.y + rShoulder.y) / 2
      const headAbove = shoulderMidY - nose.y
      uprightAlignment = Math.max(0, Math.min(1, headAbove * 5))

      // Hip stability
      const hipMid = { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 }
      hipPositions.push(hipMid)
      if (hipPositions.length > HIP_BUFFER_SIZE) hipPositions.shift()
      if (hipPositions.length >= 5) {
        const xStd = stdDev(hipPositions.map(p => p.x))
        const yStd = stdDev(hipPositions.map(p => p.y))
        stability = Math.max(0, Math.min(1, 1 - (xStd + yStd) * 8))
      }

      // Body midline X
      const midX = (lShoulder.x + rShoulder.x) / 2
      const hipMidY = (lHip.y + rHip.y) / 2
      const chestY = shoulderMidY + (hipMidY - shoulderMidY) * 0.3

      // Crossed arms: wrists cross midline near opposite elbows at chest height
      const lWristCrossed = lWrist.x < midX && Math.abs(lWrist.y - chestY) < 0.15
      const rWristCrossed = rWrist.x > midX && Math.abs(rWrist.y - chestY) < 0.15
      armsCrossed = lWristCrossed && rWristCrossed

      // Hands in pockets: wrists below hips, close to same-side hip X
      const lInPocket = lWrist.y > lHip.y && Math.abs(lWrist.x - lHip.x) < 0.08
      const rInPocket = rWrist.y > rHip.y && Math.abs(rWrist.x - rHip.x) < 0.08
      handsInPockets = lInPocket || rInPocket

      // Face touching: wrist close to nose
      const lToNose = euclidean(lWrist, nose)
      const rToNose = euclidean(rWrist, nose)
      faceTouching = lToNose < 0.12 || rToNose < 0.12

      // Fig leaf: both wrists below hips and close together
      const bothBelowHips = lWrist.y > hipMidY && rWrist.y > hipMidY
      const wristsClose = Math.abs(lWrist.x - rWrist.x) < 0.12
      figLeaf = bothBelowHips && wristsClose

      // Hands behind back: low wrist visibility (z-depth or visibility score)
      const lVis = lm[15].z ?? 0
      const rVis = lm[16].z ?? 0
      handsBehindBack = lVis > 0.1 && rVis > 0.1

      // Openness: inverse of bad postures
      const badPostureCount = [armsCrossed, handsInPockets, figLeaf, handsBehindBack].filter(Boolean).length
      openness = Math.max(0, 1 - badPostureCount * 0.4)

      // Gesture quality: hands in power zone (between shoulders and hips) with purposeful movement
      const inPowerZone = (w: typeof lWrist) =>
        w.y > shoulderMidY && w.y < hipMidY &&
        w.x > Math.min(lShoulder.x, rShoulder.x) - 0.05 &&
        w.x < Math.max(lShoulder.x, rShoulder.x) + 0.05
      const lInZone = inPowerZone(lWrist) ? 1 : 0
      const rInZone = inPowerZone(rWrist) ? 1 : 0
      const zoneScore = (lInZone + rInZone) / 2
      const movementScore = Math.min(1, handMovement * 2) // moderate movement is good
      gestureQuality = zoneScore * 0.6 + movementScore * 0.4

      // Presence score: weighted composite
      const habitPenalty = [armsCrossed, faceTouching, figLeaf, handsInPockets, handsBehindBack].filter(Boolean).length * 10
      presenceScore = Math.max(0, Math.min(100, Math.round(
        (uprightAlignment * 100) * 0.25 +
        (stability * 100) * 0.20 +
        (openness * 100) * 0.20 +
        (gestureQuality * 100) * 0.25 +
        (1 * 100) * 0.10 -
        habitPenalty
      )))
    }
  }

  const frame: PoseFrame = {
    postureScore, headStability, handMovement, isFidgeting, timestamp: Date.now(), bodyLandmarks,
    shoulderLevel, uprightAlignment, openness, gestureQuality, stability,
    armsCrossed, handsInPockets, faceTouching, figLeaf, handsBehindBack, presenceScore,
  }
  subscribers.forEach(cb => cb(frame))
  rafId = requestAnimationFrame(() => processFrame(video))
}

export function startPoseTracking(video: HTMLVideoElement): void {
  if (active) return
  active = true
  headPositions.length = 0
  hipPositions.length = 0
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
