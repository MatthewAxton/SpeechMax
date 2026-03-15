import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Eye } from 'lucide-react'
import { CameraFeed } from '../components/CameraFeed'
import { startTranscription, stopTranscription, onTranscript, getTranscriberStatus } from '../../analysis/speech/transcriber'
import { startFillerDetection, stopFillerDetection, getFillerCount } from '../../analysis/speech/fillerDetector'
import { startWpmTracking, stopWpmTracking, getRollingWpm, getWpmStdDev } from '../../analysis/speech/wpmTracker'
import { startAudioAnalysis, stopAudioAnalysis, onAudioFrame } from '../../analysis/audio/pitchAnalyzer'
import { initGazeEngine, startGazeTracking, stopGazeTracking, onGazeReading } from '../../analysis/mediapipe/gazeEngine'
import { initPoseTracker, startPoseTracking, stopPoseTracking, onPoseFrame } from '../../analysis/mediapipe/poseTracker'
import { useScanStore } from '../../store/scanStore'
import { useSessionStore } from '../../store/sessionStore'
import { playScanStart, playScanComplete, playBadgeEarned } from '../../lib/sounds'
import { getPromptCategory } from '../../lib/goalPromptMap'

function computeStdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

const glassCard: React.CSSProperties = {
  background: 'rgba(0,0,0,0.5)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: 14,
  padding: '10px 16px',
  border: '1px solid rgba(255,255,255,0.1)',
}

export default function RadarScan() {
  const nav = useNavigate()
  const [phase, setPhase] = useState<'scanning' | 'analyzing'>('scanning')
  const [time, setTime] = useState(30)
  const [wpm, setWpm] = useState(0)
  const [fillers, setFillers] = useState(0)
  const [transcriptStatus, setTranscriptStatus] = useState('')
  const [liveTranscript, setLiveTranscript] = useState('')
  const micStarted = useRef(false)
  const scanFinished = useRef(false)
  const finishRef = useRef<() => void>(() => {})
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const highWaterMark = useRef(-1)

  // Sensor accumulators
  const gazeFrames = useRef({ good: 0, total: 0 })
  const poseScores = useRef<number[]>([])
  const stillFrames = useRef({ still: 0, total: 0 })
  const fidgets = useRef(0)
  const pitchReadings = useRef<number[]>([])
  const wordCountRef = useRef(0)
  // Biometric accumulators
  const blinkCount = useRef(0)
  const jawTensions = useRef<number[]>([])
  const lipCompressions = useRef<number[]>([])
  const gazeConfidences = useRef<number[]>([])

  // Goal-driven prompt
  const userGoal = useSessionStore((s) => s.userGoal)
  const getUnusedPrompt = useSessionStore((s) => s.getUnusedPrompt)
  const [prompt] = useState(() => {
    const category = getPromptCategory(userGoal, 'casual', true)
    return getUnusedPrompt(category)
  })
  const isReading = userGoal === 'reading'

  // Start scan in store
  const startScan = useScanStore((s) => s.startScan)
  const appendRawData = useScanStore((s) => s.appendRawData)
  const completeScan = useScanStore((s) => s.completeScan)

  // Start MediaPipe when video element is available
  const handleVideoRef = useCallback(async (video: HTMLVideoElement) => {
    // Initialize both models in parallel for faster startup
    const [gazeOk, poseOk] = await Promise.all([
      initGazeEngine().then(() => true).catch(() => false),
      initPoseTracker().then(() => true).catch(() => false),
    ])
    if (gazeOk) startGazeTracking(video)
    if (poseOk) startPoseTracking(video)
  }, [])

  // Start mic + analysis when camera stream is ready (audio comes with it)
  const handleStream = useCallback((stream: MediaStream) => {
    if (micStarted.current) return
    micStarted.current = true

    // Start all analysis modules
    startTranscription()
    startFillerDetection()
    startWpmTracking()
    startAudioAnalysis(stream)
    startScan()
    playScanStart()
  }, [startScan])

  // Subscribe to sensor callbacks
  useEffect(() => {
    const unsubGaze = onGazeReading((reading) => {
      gazeFrames.current.total++
      if (reading.quality === 'good') gazeFrames.current.good++
      // Collect biometric data
      if (reading.blinkDetected) blinkCount.current++
      if (reading.jawTension != null) jawTensions.current.push(reading.jawTension)
      if (reading.lipCompression != null) lipCompressions.current.push(reading.lipCompression)
      gazeConfidences.current.push(reading.confidence)
    })
    const unsubPose = onPoseFrame((frame) => {
      poseScores.current.push(frame.postureScore)
      stillFrames.current.total++
      if (!frame.isFidgeting) stillFrames.current.still++
      if (frame.isFidgeting) fidgets.current++
    })
    const unsubAudio = onAudioFrame((frame) => {
      if (frame.pitch > 0) pitchReadings.current.push(frame.pitch)
    })
    // Reading mode: sequential word matching
    const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '')
    const passageWords = prompt.split(/\s+/).map(w => norm(w))
    // Small lookahead: how far ahead in the passage to search for the next spoken word
    // This handles skipped/misheard words gracefully
    const LOOKAHEAD = 4

    const unsubTranscript = onTranscript((event) => {
      if (event.isFinal) wordCountRef.current = event.wordCount
      setLiveTranscript(event.text)

      // Reading mode: only advance on final transcripts to avoid jumpiness
      if (isReading && event.isFinal) {
        const spoken = event.text.split(/\s+/).map(w => norm(w)).filter(w => w.length > 0)
        let cursor = highWaterMark.current + 1 // start searching from next unmatched word

        for (const word of spoken) {
          if (word.length < 2) continue // skip single letters ("a", "I") — too ambiguous
          // Search a small window ahead for this word
          const searchEnd = Math.min(cursor + LOOKAHEAD, passageWords.length)
          for (let j = cursor; j < searchEnd; j++) {
            if (passageWords[j] === word) {
              // Exact match — advance cursor past this word
              highWaterMark.current = j
              cursor = j + 1
              break
            }
          }
        }

        setHighlightIndex(highWaterMark.current)
      }
    })
    return () => {
      unsubGaze()
      unsubPose()
      unsubAudio()
      unsubTranscript()
    }
  }, [])

  // Update live metrics
  useEffect(() => {
    const wpmInterval = setInterval(() => {
      setWpm(getRollingWpm())
      setFillers(getFillerCount())
      const status = getTranscriberStatus()
      setTranscriptStatus(status.simulated ? 'Demo mode (simulated)' : status.error ? `Error: ${status.error}` : status.active ? 'Listening...' : 'Inactive')
    }, 500)
    return () => clearInterval(wpmInterval)
  }, [])

  const finishScan = useCallback(() => {
    if (scanFinished.current) return
    scanFinished.current = true

    // Stop all analysis
    stopTranscription()
    stopFillerDetection()
    stopWpmTracking()
    stopAudioAnalysis()
    stopGazeTracking()
    stopPoseTracking()

    // Compute real sensor values
    const eyeContactPercent = gazeFrames.current.total > 0
      ? (gazeFrames.current.good / gazeFrames.current.total) * 100 : 50
    const postureScore = poseScores.current.length > 0
      ? poseScores.current.reduce((a, b) => a + b) / poseScores.current.length : 50
    const pitchStdDev = computeStdDev(pitchReadings.current)
    const stillnessPercent = stillFrames.current.total > 0
      ? (stillFrames.current.still / stillFrames.current.total) * 100 : 50

    // Compute biometric averages
    const blinkRate = (blinkCount.current / 30) * 60 // blinks per minute
    const avgJawTension = jawTensions.current.length > 0
      ? jawTensions.current.reduce((a, b) => a + b) / jawTensions.current.length : undefined
    const avgLipCompression = lipCompressions.current.length > 0
      ? lipCompressions.current.reduce((a, b) => a + b) / lipCompressions.current.length : undefined
    const gazeStability = gazeConfidences.current.length > 2
      ? 1 - computeStdDev(gazeConfidences.current) * 3 : undefined
    // Pitch jitter: average frame-to-frame pitch change
    let pitchJitter: number | undefined
    if (pitchReadings.current.length > 2) {
      const diffs: number[] = []
      for (let i = 1; i < pitchReadings.current.length; i++) {
        diffs.push(Math.abs(pitchReadings.current[i] - pitchReadings.current[i - 1]))
      }
      pitchJitter = diffs.reduce((a, b) => a + b) / diffs.length
    }

    appendRawData({
      durationSeconds: 30,
      fillerCount: getFillerCount(),
      wordCount: wordCountRef.current,
      avgWpm: getRollingWpm(),
      wpmStdDev: getWpmStdDev(),
      eyeContactPercent: Math.round(eyeContactPercent),
      postureScore: Math.round(postureScore),
      pitchStdDev: Math.round(pitchStdDev),
      stillnessPercent: Math.round(stillnessPercent),
      fidgetCount: fidgets.current,
      blinkRate: Math.round(blinkRate),
      jawTension: avgJawTension != null ? Math.round(avgJawTension * 100) / 100 : undefined,
      lipCompression: avgLipCompression != null ? Math.round(avgLipCompression * 100) / 100 : undefined,
      gazeStability: gazeStability != null ? Math.max(0, Math.min(1, Math.round(gazeStability * 100) / 100)) : undefined,
      pitchJitter: pitchJitter != null ? Math.round(pitchJitter * 10) / 10 : undefined,
    })
    completeScan()
    playScanComplete()
    useSessionStore.getState().recordScan()
    const badges = useSessionStore.getState().checkBadges()
    if (badges && badges.length > 0) playBadgeEarned()

    setPhase('analyzing')
  }, [appendRawData, completeScan])

  finishRef.current = finishScan

  // Timer countdown
  useEffect(() => {
    const t = setInterval(() => setTime(p => {
      if (p <= 1) {
        clearInterval(t)
        finishRef.current()
        return 0
      }
      return p - 1
    }), 1000)
    return () => clearInterval(t)
  }, [])

  // Navigate after analyzing phase
  useEffect(() => {
    if (phase !== 'analyzing') return
    const t = setTimeout(() => nav('/results'), 2000)
    return () => clearTimeout(t)
  }, [phase, nav])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#000' }}>
      {/* Analyzing overlay */}
      <AnimatePresence>
        {phase === 'analyzing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#050508', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg, #C28FE7, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              Analysing your speech...
            </motion.div>
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}
            >
              Building your speech profile
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen camera */}
      <CameraFeed
        style={{ width: '100%', height: '100%', maxWidth: 'none', maxHeight: 'none', border: 'none', borderRadius: 0 }}
        withAudio={true}
        onStream={handleStream}
        onVideoRef={handleVideoRef}
      />

      {/* Top-left: Title */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 20 }}>
        <div style={{ ...glassCard, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444', animation: 'pulse 1.5s ease-in-out infinite' }} />
          {userGoal ? `${userGoal.charAt(0).toUpperCase() + userGoal.slice(1)} Scan` : '30-Second Scan'}
        </div>
      </div>

      {/* Top-center: Timer */}
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
        <motion.div
          animate={{ scale: time <= 5 ? [1, 1.08, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 1 }}
          style={{
            ...glassCard,
            padding: '12px 28px',
            fontSize: 32,
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            color: time <= 5 ? '#ef4444' : 'rgba(255,255,255,0.95)',
            textShadow: time <= 5 ? '0 0 20px rgba(239,68,68,0.5)' : 'none',
          }}
        >
          0:{time.toString().padStart(2, '0')}
        </motion.div>
      </div>

      {/* Top-right: Live stats */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 20, display: 'flex', gap: 8 }}>
        <div style={{ ...glassCard, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={14} color="#c28fe7" />
          <span style={{ color: '#c28fe7' }}>{wpm}</span> WPM
        </div>
        <div style={{ ...glassCard, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Eye size={14} color="#c28fe7" />
          <span style={{ color: '#c28fe7' }}>{fillers}</span> fillers
        </div>
        <div style={{
          ...glassCard,
          fontSize: 11,
          fontWeight: 600,
          padding: '8px 12px',
          color: transcriptStatus.startsWith('Error') ? '#ef4444' : 'rgba(255,255,255,0.5)',
        }}>
          {transcriptStatus}
        </div>
      </div>

      {/* Bottom-center: Prompt + Live Transcript */}
      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 20, width: '90%', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isReading ? (
          /* Reading mode: passage with word-by-word green highlighting */
          <div style={{ ...glassCard, textAlign: 'left', padding: '16px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>
              Read This Aloud
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 2 }}>
              {prompt.split(/\s+/).map((word, i) => {
                const isSpoken = i <= highlightIndex
                const isCurrent = i === highlightIndex
                return (
                  <span
                    key={i}
                    style={{
                      color: isSpoken ? '#58CC02' : 'rgba(255,255,255,0.3)',
                      fontWeight: isSpoken ? 700 : 500,
                      transition: 'color 0.3s ease',
                      textShadow: isCurrent ? '0 0 12px rgba(88,204,2,0.5)' : 'none',
                    }}
                  >
                    {word}{' '}
                  </span>
                )
              })}
            </div>
          </div>
        ) : (
          /* Non-reading: live transcript + prompt */
          <>
            <AnimatePresence>
              {liveTranscript && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    ...glassCard,
                    textAlign: 'center',
                    padding: '12px 20px',
                    background: 'rgba(194,143,231,0.08)',
                    border: '1px solid rgba(194,143,231,0.2)',
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(194,143,231,0.6)', marginBottom: 6 }}>
                    Live Transcription
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', maxHeight: 80, overflow: 'hidden' }}>
                    "{liveTranscript}"
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ ...glassCard, textAlign: 'center', padding: '14px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
                Speak About This Topic
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.8, color: 'rgba(255,255,255,0.9)' }}>
                {prompt}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom-right: Finish Early */}
      {time < 20 && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={finishScan}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 16,
            zIndex: 20,
            ...glassCard,
            padding: '10px 24px',
            fontSize: 13,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
          }}
        >
          Finish Early
        </motion.button>
      )}
    </div>
  )
}
