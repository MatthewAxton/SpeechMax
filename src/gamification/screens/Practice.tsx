import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Eye, Square, ArrowLeft } from 'lucide-react'
import { CameraFeed } from '../components/CameraFeed'
import { TopBanner } from '../components/Banner'
import { RadarChart } from '../components/radar-chart'
import { TalkingBubble } from '../components/Mike'
import { startTranscription, stopTranscription, onTranscript } from '../../analysis/speech/transcriber'
import { startFillerDetection, stopFillerDetection, getFillerCount } from '../../analysis/speech/fillerDetector'
import { startWpmTracking, stopWpmTracking, getRollingWpm, getWpmStdDev } from '../../analysis/speech/wpmTracker'
import { startAudioAnalysis, stopAudioAnalysis, onAudioFrame } from '../../analysis/audio/pitchAnalyzer'
import { initGazeEngine, startGazeTracking, stopGazeTracking, onGazeReading } from '../../analysis/mediapipe/gazeEngine'
import { initPoseTracker, startPoseTracking, stopPoseTracking, onPoseFrame } from '../../analysis/mediapipe/poseTracker'
import { computeRadarScores } from '../../analysis/scoring/radarScorer'
import type { ScanRawData, RadarScores } from '../../analysis/types'
import { playScanStart, playScanComplete } from '../../lib/sounds'

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

export default function Practice() {
  const nav = useNavigate()
  const location = useLocation()
  const initialPrompt = (location.state as { prompt?: string } | null)?.prompt ?? ''

  const [phase, setPhase] = useState<'setup' | 'recording' | 'analyzing' | 'done'>('setup')
  const [promptText, setPromptText] = useState(initialPrompt)
  const [speakFreely, setSpeakFreely] = useState(!initialPrompt)
  const [elapsed, setElapsed] = useState(0)
  const [wpm, setWpm] = useState(0)
  const [fillers, setFillers] = useState(0)
  const [practiceScores, setPracticeScores] = useState<RadarScores | null>(null)

  const micStarted = useRef(false)
  const scanFinished = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sensor accumulators
  const gazeFrames = useRef({ good: 0, total: 0 })
  const poseScores = useRef<number[]>([])
  const stillFrames = useRef({ still: 0, total: 0 })
  const fidgets = useRef(0)
  const pitchReadings = useRef<number[]>([])
  const wordCountRef = useRef(0)
  const blinkCount = useRef(0)
  const jawTensions = useRef<number[]>([])
  const lipCompressions = useRef<number[]>([])
  const gazeConfidences = useRef<number[]>([])
  const startTimeRef = useRef(0)

  const handleVideoRef = useCallback(async (video: HTMLVideoElement) => {
    const [gazeOk, poseOk] = await Promise.all([
      initGazeEngine().then(() => true).catch(() => false),
      initPoseTracker().then(() => true).catch(() => false),
    ])
    if (gazeOk) startGazeTracking(video)
    if (poseOk) startPoseTracking(video)
  }, [])

  const handleStream = useCallback((stream: MediaStream) => {
    if (micStarted.current) return
    micStarted.current = true
    startTranscription()
    startFillerDetection()
    startWpmTracking()
    startAudioAnalysis(stream)
    playScanStart()
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000)
  }, [])

  // Subscribe to sensors
  useEffect(() => {
    if (phase !== 'recording') return
    const unsubGaze = onGazeReading((reading) => {
      gazeFrames.current.total++
      if (reading.quality === 'good') gazeFrames.current.good++
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
    const unsubTranscript = onTranscript((event) => {
      if (event.isFinal) wordCountRef.current = event.wordCount
    })
    return () => { unsubGaze(); unsubPose(); unsubAudio(); unsubTranscript() }
  }, [phase])

  // Live metric updates
  useEffect(() => {
    if (phase !== 'recording') return
    const iv = setInterval(() => {
      setWpm(getRollingWpm())
      setFillers(getFillerCount())
    }, 500)
    return () => clearInterval(iv)
  }, [phase])

  const finishRecording = useCallback(() => {
    if (scanFinished.current) return
    scanFinished.current = true
    if (timerRef.current) clearInterval(timerRef.current)

    stopTranscription()
    stopFillerDetection()
    stopWpmTracking()
    stopAudioAnalysis()
    stopGazeTracking()
    stopPoseTracking()

    const duration = Math.max(5, Math.floor((Date.now() - startTimeRef.current) / 1000))
    const eyeContactPercent = gazeFrames.current.total > 0 ? (gazeFrames.current.good / gazeFrames.current.total) * 100 : 50
    const postureScore = poseScores.current.length > 0 ? poseScores.current.reduce((a, b) => a + b) / poseScores.current.length : 50
    const pitchStdDev = computeStdDev(pitchReadings.current)
    const stillnessPercent = stillFrames.current.total > 0 ? (stillFrames.current.still / stillFrames.current.total) * 100 : 50

    const rawData: ScanRawData = {
      durationSeconds: duration,
      fillerCount: getFillerCount(),
      wordCount: wordCountRef.current,
      avgWpm: getRollingWpm(),
      wpmStdDev: getWpmStdDev(),
      eyeContactPercent: Math.round(eyeContactPercent),
      postureScore: Math.round(postureScore),
      pitchStdDev: Math.round(pitchStdDev),
      stillnessPercent: Math.round(stillnessPercent),
      fidgetCount: fidgets.current,
    }

    // Compute scores locally — DO NOT save to scanStore
    const scores = computeRadarScores(rawData)
    setPracticeScores(scores)
    playScanComplete()
    setPhase('analyzing')
  }, [])

  // Transition from analyzing to done
  useEffect(() => {
    if (phase !== 'analyzing') return
    const t = setTimeout(() => setPhase('done'), 2000)
    return () => clearTimeout(t)
  }, [phase])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  // Setup phase
  if (phase === 'setup') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#050508' }}>
        <TopBanner backTo="/queue" title="Free Practice" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: 520, width: '100%', padding: '0 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <img src="/IDLE.gif" alt="Mike" style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid rgba(194,143,231,0.3)' }} />
              <div style={{
                background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
                padding: '12px 16px', flex: 1,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                  <TalkingBubble text="Practice mode won't affect your scores. Just relax and speak!" />
                </div>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={speakFreely} onChange={(e) => setSpeakFreely(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#c28fe7' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Speak freely (no prompt)</span>
            </label>

            {!speakFreely && (
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Enter your own text to practice..."
                style={{
                  width: '100%', minHeight: 120, padding: '14px 16px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 500, resize: 'vertical',
                  fontFamily: 'inherit', marginBottom: 20,
                }}
              />
            )}

            <button className="btn-primary" style={{ width: '100%', padding: '14px 0', fontSize: 16 }} onClick={() => setPhase('recording')}>
              Start Recording
            </button>
            <button className="btn-secondary" style={{ width: '100%', marginTop: 10, padding: '10px 0' }} onClick={() => nav('/queue')}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Done phase — show practice results (no impact on real scores)
  if (phase === 'done' && practiceScores) {
    const AXIS_NAMES = ['Clarity', 'Confidence', 'Pacing', 'Expression', 'Composure']
    const AXIS_KEYS = ['clarity', 'confidence', 'pacing', 'expression', 'composure'] as const

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <TopBanner backTo="/queue" title="Practice Results"
          right={<span style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', background: 'rgba(194,143,231,0.12)', padding: '4px 12px', borderRadius: 8 }}>Practice Mode</span>}
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
          <div style={{ display: 'flex', gap: 48, padding: '24px 48px', maxWidth: 960, width: '100%', alignItems: 'center' }}>
            {/* Left — Radar + Score */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <img src="/IDLE.gif" alt="Mike" style={{ width: 48, height: 48, borderRadius: '50%' }} />
                <div style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14, padding: '10px 14px', fontSize: 13, fontWeight: 600,
                  color: 'rgba(255,255,255,0.85)', maxWidth: 240,
                }}>
                  <TalkingBubble text="Nice practice! This doesn't change your real scores." />
                </div>
              </div>
              <RadarChart
                scores={{ clarity: practiceScores.clarity, confidence: practiceScores.confidence, pacing: practiceScores.pacing, expression: practiceScores.expression, composure: practiceScores.composure }}
                size={280} animated={true}
              />
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}
                style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, marginTop: 8, background: 'linear-gradient(135deg, #C28FE7, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {Math.round(practiceScores.overall)}
              </motion.div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginTop: 4 }}>Practice Score</div>
            </motion.div>

            {/* Right — Axis breakdown */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', marginBottom: 14 }}>Practice Breakdown</div>
              {AXIS_KEYS.map((key, i) => {
                const score = Math.round(practiceScores[key])
                return (
                  <motion.div key={key} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{AXIS_NAMES[i]}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--purple)' }}>{score}</span>
                    </div>
                    <div className="progress-track"><motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1, delay: 0.4 + i * 0.1 }} /></div>
                  </motion.div>
                )
              })}
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => nav('/queue')}>Back to Dashboard</button>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { scanFinished.current = false; micStarted.current = false; setPhase('setup'); setElapsed(0); setWpm(0); setFillers(0); setPracticeScores(null) }}>Practice Again</button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // Recording + analyzing phases
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#000' }}>
      <AnimatePresence>
        {phase === 'analyzing' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#050508', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}
          >
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg, #C28FE7, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Analysing your practice...
            </motion.div>
            <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 2.5 }}
              style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
              This won't affect your real scores
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CameraFeed
        style={{ width: '100%', height: '100%', maxWidth: 'none', maxHeight: 'none', border: 'none', borderRadius: 0 }}
        withAudio={true}
        onStream={handleStream}
        onVideoRef={handleVideoRef}
      />

      {/* Top-left: Title */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
        <div onClick={() => nav('/queue')} style={{ ...glassCard, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
          <ArrowLeft size={16} /> Back
        </div>
        <div style={{ ...glassCard, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444', animation: 'pulse 1.5s ease-in-out infinite' }} />
          Free Practice
        </div>
      </div>

      {/* Top-center: Elapsed time */}
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
        <div style={{ ...glassCard, padding: '12px 28px', fontSize: 32, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'rgba(255,255,255,0.95)' }}>
          {formatTime(elapsed)}
        </div>
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
      </div>

      {/* Bottom-center: Prompt or stop button */}
      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        {!speakFreely && promptText && (
          <div style={{ ...glassCard, maxWidth: 600, textAlign: 'center', padding: '14px 24px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)' }}>{promptText}</div>
          </div>
        )}
        <button
          onClick={finishRecording}
          style={{
            ...glassCard, padding: '12px 32px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 15, fontWeight: 700, color: '#ef4444',
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          <Square size={16} fill="#ef4444" /> Stop Recording
        </button>
      </div>
    </div>
  )
}
