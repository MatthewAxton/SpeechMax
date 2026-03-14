import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, X } from 'lucide-react'
import { TopBanner, BottomBanner } from '../components/Banner'
import { AudioWave } from '../components/AudioWave'
import { GraceCountdown } from '../components/GraceCountdown'
import { startTranscription, stopTranscription, onTranscript } from '../../analysis/speech/transcriber'
import { startFillerDetection, stopFillerDetection, onFillerDetected, getFillerCount } from '../../analysis/speech/fillerDetector'
import { useMicrophone } from '../../analysis/hooks/useMicrophone'
import { computeSimpleGameScore } from '../../analysis/scoring/gameScorer'
import { useGameStore } from '../../store/gameStore'
import { useSessionStore } from '../../store/sessionStore'
import { useRequireScan } from '../hooks/useRequireScan'

const FILLER_TARGETS = ['um', 'uh', 'like', 'so', 'you know', 'basically', 'actually', 'right']
const FLOAT_TOPS = [10, 22, 35, 48, 55, 65, 73, 80]
const FLOAT_DURATIONS = [18, 24, 15, 30, 20, 12, 26, 22]
const FLOAT_DELAYS = [0, 3, 7, 1, 5, 9, 2, 6]

export default function FillerNinja() {
  const hasScans = useRequireScan()
  const nav = useNavigate()
  const [prompt] = useState(() => useSessionStore.getState().getUnusedPrompt('interview'))
  const [difficulty] = useState(() => useGameStore.getState().getDifficultyFor('filler-ninja'))
  const gameDuration = difficulty === 'hard' ? 120 : 90
  const [time, setTime] = useState(gameDuration)
  const [streak, setStreak] = useState(0)
  const [fillers, setFillers] = useState(0)
  const [lastFiller, setLastFiller] = useState<string | null>(null)
  const [liveText, setLiveText] = useState('')
  const [ready, setReady] = useState(false)
  const lastFillerTime = useRef(Date.now())
  const { requestMic, stopMic } = useMicrophone()

  const onReady = useCallback(async () => {
    // Request mic when game starts
    await requestMic()
    startTranscription()
    startFillerDetection()
    setReady(true)
  }, [requestMic])

  // Listen for fillers
  useEffect(() => {
    if (!ready) return
    const unsub = onFillerDetected((e) => {
      setFillers(getFillerCount())
      setLastFiller(e.word)
      setStreak(0) // reset streak on filler
      lastFillerTime.current = Date.now()
    })
    return unsub
  }, [ready])

  // Listen for live transcript
  useEffect(() => {
    if (!ready) return
    const unsub = onTranscript((e) => {
      setLiveText(e.text)
    })
    return unsub
  }, [ready])

  // Timer + streak counter
  useEffect(() => {
    if (!ready) return
    lastFillerTime.current = Date.now()
    const t = setInterval(() => {
      setTime(p => {
        if (p <= 1) {
          clearInterval(t)
          stopTranscription()
          stopFillerDetection()
          stopMic()
          const metrics = { fillerCount: getFillerCount(), durationSeconds: gameDuration, longestStreakSeconds: Math.floor((Date.now() - lastFillerTime.current) / 1000) }
          const score = computeSimpleGameScore('filler-ninja', metrics)
          useGameStore.getState().addGameResult({ gameType: 'filler-ninja', score, metrics, timestamp: Date.now() })
          useSessionStore.getState().markPromptUsed(prompt)
          useSessionStore.getState().recordGame('filler-ninja')
          useSessionStore.getState().checkBadges()
          nav('/score/filler')
          return 0
        }
        return p - 1
      })
      // Streak = seconds since last filler
      setStreak(Math.floor((Date.now() - lastFillerTime.current) / 1000))
    }, 1000)
    return () => clearInterval(t)
  }, [nav, ready, stopMic])

  if (!hasScans) return null
  const ninjaBarColor = streak > 20 ? '#58CC02' : streak > 10 ? '#C28FE7' : '#6B21A8'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {!ready && <GraceCountdown onReady={onReady} prompt={prompt} promptLabel="Interview Question" />}

      {/* Floating filler word bubbles (ambient, decorative) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {FILLER_TARGETS.map((word, i) => (
          <motion.div
            key={word}
            animate={{ x: ['calc(-100px)', 'calc(100vw + 100px)'] }}
            transition={{ duration: FLOAT_DURATIONS[i], repeat: Infinity, ease: 'linear', delay: FLOAT_DELAYS[i] }}
            style={{
              position: 'absolute', top: `${FLOAT_TOPS[i]}%`,
              background: 'rgba(194,143,231,0.08)', border: '1px solid rgba(194,143,231,0.15)',
              color: 'rgba(194,143,231,0.25)', borderRadius: 20, padding: '6px 16px',
              fontSize: 14, fontWeight: 600, backdropFilter: 'blur(4px)', whiteSpace: 'nowrap',
            }}
          >
            {word}
          </motion.div>
        ))}
      </div>

      <TopBanner backTo="/queue" title="Filler Ninja"
        center={<><span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 12, fontSize: 15, fontWeight: 800 }}>0:{time.toString().padStart(2, '0')}</span><div style={{ width: 160, height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}><motion.div animate={{ width: `${((gameDuration-time)/gameDuration)*100}%` }} style={{ height: '100%', background: 'white', borderRadius: 4 }} /></div></>}
        right={<><span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700 }}><Zap size={14} /> {fillers}</span><span style={{ background: `${difficulty === 'hard' ? '#FF4B4B' : difficulty === 'medium' ? '#FCD34D' : '#58CC02'}30`, color: difficulty === 'hard' ? '#FF4B4B' : difficulty === 'medium' ? '#FCD34D' : '#58CC02', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, textTransform: 'uppercase' }}>{difficulty}</span></>} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 40px' }}>
          <div className="card" style={{ width: '100%', maxWidth: 600, textAlign: 'center', marginBottom: 12, padding: '20px 28px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', marginBottom: 8 }}>Interview Question</div>
            <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4 }}>{prompt}</div>
          </div>
          <div style={{ maxWidth: 520, textAlign: 'center', fontSize: 16, fontWeight: 500, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 12, minHeight: 60 }}>
            {liveText || <span style={{ opacity: 0.4 }}>Start speaking...</span>}
          </div>

          {/* Filler badge with slash animation */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            {lastFiller && (
              <div style={{ position: 'relative' }}>
                <motion.span
                  key={fillers}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  style={{ background: 'var(--red)', color: 'white', fontSize: 14, fontWeight: 700, padding: '8px 18px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <X size={14} /> {lastFiller}
                </motion.span>
                <svg key={`slash-${fillers}`} width={120} height={60} style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
                  <motion.line x1={0} y1={50} x2={120} y2={10} stroke="#FF4B4B" strokeWidth={3} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1, opacity: [1, 0] }} transition={{ duration: 0.5 }} />
                  <motion.line x1={10} y1={60} x2={110} y2={0} stroke="#FF4B4B" strokeWidth={3} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1, opacity: [1, 0] }} transition={{ duration: 0.5, delay: 0.1 }} />
                </svg>
              </div>
            )}
          </div>

          {/* Streak counter with pulsing ring */}
          <div style={{ textAlign: 'center', position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            {streak > 15 && (
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ position: 'absolute', top: -10, width: 80, height: 80, borderRadius: '50%', border: '2px solid rgba(194,143,231,0.3)', pointerEvents: 'none' }}
              />
            )}
            <motion.div key={streak} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }} style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, background: 'linear-gradient(135deg, #C28FE7, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textShadow: streak > 10 ? '0 0 20px rgba(194,143,231,0.5)' : 'none' }}>{streak}</motion.div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>seconds filler-free</div>

            {/* Ninja meter */}
            <div style={{ width: 200, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${Math.min(100, (streak / 30) * 100)}%` }}
                transition={{ duration: 0.5 }}
                style={{ height: '100%', background: ninjaBarColor, borderRadius: 3 }}
              />
            </div>
          </div>
          <div style={{ marginTop: 16 }}><AudioWave /></div>
        </div>
      </div>
      <BottomBanner left={<div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>{streak > 5 ? 'Amazing streak!' : 'Keep going!'}</div>} center={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ fontSize: 22, fontWeight: 800 }}>{streak}s Streak</div><div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Filler-Free</div></div>} right={<><Zap size={14} /> Fillers: {fillers}</>} />
    </div>
  )
}
