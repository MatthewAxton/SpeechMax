/**
 * E3.R4 — MediaPipe Face Tracker
 * Eye contact detection using FaceLandmarker from @mediapipe/tasks-vision.
 */
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

interface FaceFrame {
  eyeContact: boolean
  eyeContactConfidence: number  // 0–1
  facialTension: number         // 0–1
  timestamp: number
}

type FaceFrameCallback = (frame: FaceFrame) => void

let faceLandmarker: FaceLandmarker | null = null
let rafId = 0
let active = false
const subscribers = new Set<FaceFrameCallback>()

export async function initFaceTracker(): Promise<void> {
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

function processFrame(video: HTMLVideoElement) {
  if (!active || !faceLandmarker) return

  const startTimeMs = performance.now()
  const results = faceLandmarker.detectForVideo(video, startTimeMs)

  let eyeContact = false
  let eyeContactConfidence = 0
  let facialTension = 0

  if (results.faceLandmarks && results.faceLandmarks.length > 0) {
    const landmarks = results.faceLandmarks[0]

    // Eye contact: check if iris is centered relative to eye corners
    // Left iris center: landmark 468, Left eye corners: 33 (outer), 133 (inner)
    // Right iris center: landmark 473, Right eye corners: 362 (outer), 263 (inner)
    if (landmarks.length > 473) {
      const leftIris = landmarks[468]
      const leftOuter = landmarks[33]
      const leftInner = landmarks[133]
      const leftCenter = (leftOuter.x + leftInner.x) / 2
      const leftDeviation = Math.abs(leftIris.x - leftCenter)

      const rightIris = landmarks[473]
      const rightOuter = landmarks[362]
      const rightInner = landmarks[263]
      const rightCenter = (rightOuter.x + rightInner.x) / 2
      const rightDeviation = Math.abs(rightIris.x - rightCenter)

      const avgDeviation = (leftDeviation + rightDeviation) / 2
      // Threshold: if deviation < 0.02, looking at camera
      eyeContactConfidence = Math.max(0, Math.min(1, 1 - avgDeviation * 50))
      eyeContact = eyeContactConfidence > 0.5
    }

    // Facial tension from blendshapes
    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
      const shapes = results.faceBlendshapes[0].categories
      const jawOpen = shapes.find(s => s.categoryName === 'jawOpen')?.score ?? 0
      const browDown = shapes.find(s => s.categoryName === 'browDownLeft')?.score ?? 0
      facialTension = Math.min(1, (jawOpen * 0.5 + browDown * 0.5))
    }
  }

  const frame: FaceFrame = {
    eyeContact,
    eyeContactConfidence,
    facialTension,
    timestamp: Date.now(),
  }

  subscribers.forEach(cb => cb(frame))
  rafId = requestAnimationFrame(() => processFrame(video))
}

export function startFaceTracking(video: HTMLVideoElement): void {
  if (active) return
  active = true
  rafId = requestAnimationFrame(() => processFrame(video))
}

export function stopFaceTracking(): void {
  active = false
  cancelAnimationFrame(rafId)
}

export function onFaceFrame(callback: FaceFrameCallback): () => void {
  subscribers.add(callback)
  return () => { subscribers.delete(callback) }
}
