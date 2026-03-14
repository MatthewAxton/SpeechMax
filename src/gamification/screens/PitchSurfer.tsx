import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, TrendingUp, Minus } from 'lucide-react'
import { TopBanner, BottomBanner } from '../components/Banner'
import { Mike } from '../components/Mike'
import { AudioWave } from '../components/AudioWave'
import { startAudioAnalysis, stopAudioAnalysis, onAudioFrame } from '../../analysis/audio/pitchAnalyzer'
import { useMicrophone } from '../../analysis/hooks/useMicrophone'
import { computeSimpleGameScore } from '../../analysis/scoring/gameScorer'
import { useGameStore } from '../../store/gameStore'
import { useSessionStore } from '../../store/sessionStore'
import { useRequireScan } from '../hooks/useRequireScan'
import { playGameComplete, playBadgeEarned } from '../../lib/sounds'

export default function PitchSurfer() {
  const hasScans = useRequireScan()
  const nav = useNavigate()
  const [prompt] = useState(() => useSessionStore.getState().getUnusedPrompt('professional'))
  const [difficulty] = useState(() => useGameStore.getState().getDifficultyFor('pitch-surfer'))
  const gameDuration = difficulty === 'hard' ? 45 : 30
  const [time, setTime] = useState(gameDuration)
  const [ready, setReady] = useState(false)
  const [pitchHistory, setPitchHistory] = useState<number[]>([])
  const [currentPitch, setCurrentPitch] = useState(0)
  const [variation, setVariation] = useState<'low' | 'good' | 'high'>('low')
  const { requestMic, stopMic } = useMicrophone()
  const [wiping, setWiping] = useState(false)
  const pitchBuffer = useRef<number[]>([])
  const monotoneSeconds = useRef(0)
  const finished = useRef(false)

  // Auto-start on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const stream = await requestMic()
      if (!cancelled && stream) startAudioAnalysis(stream)
      if (!cancelled) setReady(true)
    })()
    return () => { cancelled = true }
  }, [requestMic])

  // Listen for real pitch data
  useEffect(() => {
    if (!ready) return
    const unsub = onAudioFrame((frame) => {
      if (frame.pitch > 0) {
        setCurrentPitch(frame.pitch)
        pitchBuffer.current.push(frame.pitch)
        // Keep last 60 readings for wave visualization
        setPitchHistory(prev => [...prev.slice(-59), frame.pitch])
      }
    })
    return unsub
  }, [ready])

  // Calculate variation every second
  useEffect(() => {
    if (!ready) return
    const id = setInterval(() => {
      const buf = pitchBuffer.current
      if (buf.length < 5) { setVariation('low'); return }
      const mean = buf.reduce((a, b) => a + b, 0) / buf.length
      const stdDev = Math.sqrt(buf.reduce((sum, v) => sum + (v - mean) ** 2, 0) / buf.length)
      if (stdDev > 30) { setVariation('high'); monotoneSeconds.current = 0; setWiping(false) }
      else if (stdDev > 15) { setVariation('good'); monotoneSeconds.current = 0; setWiping(false) }
      else { setVariation('low'); monotoneSeconds.current++; if (monotoneSeconds.current >= 3) setWiping(true) }
    }, 1000)
    return () => clearInterval(id)
  }, [ready])

  // Build SVG wave path from pitch history
  const wavePath = (() => {
    if (pitchHistory.length < 2) return ''
    const w = 800
    const h = 220
    const step = w / Math.max(1, pitchHistory.length - 1)
    let d = `M0,${h}`
    pitchHistory.forEach((p, i) => {
      const y = h - ((p - 50) / 400) * h // map 50-450Hz to 0-h
      const x = i * step
      if (i === 0) d = `M${x},${Math.max(10, Math.min(h - 10, y))}`
      else d += ` L${x},${Math.max(10, Math.min(h - 10, y))}`
    })
    const fillPath = d + ` L${(pitchHistory.length - 1) * step},${h} L0,${h} Z`
    return fillPath
  })()

  const strokePath = wavePath.replace(/ L\d+,220 L0,220 Z$/, '')

  const finishGame = useCallback(() => {
    if (finished.current) return
    finished.current = true
    stopAudioAnalysis()
    stopMic()
    const pitchVar = pitchBuffer.current.length >= 2
      ? Math.sqrt(pitchBuffer.current.reduce((sum, v, _, arr) => {
          const mean = arr.reduce((a, b) => a + b, 0) / arr.length
          return sum + (v - mean) ** 2
        }, 0) / pitchBuffer.current.length)
      : 0
    const elapsed = gameDuration - time
    const metrics = { pitchVariation: pitchVar, monotoneSeconds: monotoneSeconds.current, totalSeconds: Math.max(1, elapsed) }
    const score = computeSimpleGameScore('pitch-surfer', metrics)
    useGameStore.getState().addGameResult({ gameType: 'pitch-surfer', score, metrics, timestamp: Date.now() })
    useSessionStore.getState().markPromptUsed(prompt)
    useSessionStore.getState().recordGame('pitch-surfer')
    const badges = useSessionStore.getState().checkBadges()
    playGameComplete()
    if (badges && badges.length > 0) playBadgeEarned()
    nav('/score/pitch')
  }, [stopMic, gameDuration, time, nav, prompt])

  useEffect(() => {
    if (!ready) return
    const t = setInterval(() => {
      setTime(p => {
        if (p <= 1) {
          clearInterval(t)
          finishGame()
          return 0
        }
        return p - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [nav, ready, finishGame])

  if (!hasScans) return null
  const variationColor = variation === 'high' ? 'var(--green)' : variation === 'good' ? 'var(--purple)' : 'var(--red)'
  const VariationIcon = variation === 'low' ? Minus : TrendingUp

  // Dynamic Mike Y position based on last pitch value
  const lastPitch = pitchHistory.length > 0 ? pitchHistory[pitchHistory.length - 1] : 0
  const mikeY = Math.max(10, Math.min(190, 220 - ((lastPitch - 50) / 400) * 220)) - 40

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <TopBanner backTo="/queue" title="Pitch Surfer" center={<span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 12, fontSize: 15, fontWeight: 800 }}>0:{time.toString().padStart(2, '0')}</span>} right={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700 }}><Zap size={14} /> {Math.round(currentPitch)}Hz</span><span style={{ background: `${difficulty === 'hard' ? '#FF4B4B' : difficulty === 'medium' ? '#FCD34D' : '#58CC02'}30`, color: difficulty === 'hard' ? '#FF4B4B' : difficulty === 'medium' ? '#FCD34D' : '#58CC02', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, textTransform: 'uppercase' }}>{difficulty}</span></div>} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 40px' }}>
          <div style={{ width: '100%', maxWidth: 800, height: 220, position: 'relative', marginBottom: 12 }}>
            <svg width="100%" height="100%" viewBox="0 0 800 220" preserveAspectRatio="none" style={{ opacity: wiping ? 0.3 : 1, transition: 'opacity 0.5s ease' }}>
              <defs>
                <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(6,182,212,0.25)" />
                  <stop offset="50%" stopColor="rgba(59,130,246,0.15)" />
                  <stop offset="100%" stopColor="rgba(6,182,212,0.03)" />
                </linearGradient>
              </defs>
              {/* Deep water background */}
              <rect x={0} y={0} width={800} height={220} fill="rgba(6,182,212,0.08)" />
              {/* Water texture lines */}
              <line x1={0} y1={70} x2={800} y2={70} stroke="rgba(6,182,212,0.06)" strokeWidth={1} strokeDasharray="8 4" />
              <line x1={0} y1={130} x2={800} y2={130} stroke="rgba(6,182,212,0.06)" strokeWidth={1} strokeDasharray="8 4" />
              <line x1={0} y1={190} x2={800} y2={190} stroke="rgba(6,182,212,0.06)" strokeWidth={1} strokeDasharray="8 4" />
              {wavePath && <path d={wavePath} fill="url(#wg)" />}
              {strokePath && <path d={strokePath} fill="none" stroke="#06B6D4" strokeWidth={2.5} />}
            </svg>

            {/* Mike mascot riding the wave */}
            <motion.div
              animate={wiping
                ? { rotate: [0, 45, 180, 360], y: [0, 20, 40, 20] }
                : { y: [0, -6, 0, -3, 0], rotate: [0, 2, 0, -1, 0] }
              }
              transition={{ repeat: Infinity, duration: wiping ? 1 : 3, ease: 'easeInOut' }}
              style={{ position: 'absolute', top: mikeY, right: '15%' }}
            >
              <Mike state="talking" size={90} />
            </motion.div>

            {/* Foam particles near Mike */}
            {[0, 1, 2].map(i => (
              <motion.div
                key={`foam-${i}`}
                animate={{ y: [-10, -30], opacity: [0.6, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.3 }}
                style={{
                  position: 'absolute', top: mikeY + 60, right: `calc(15% + ${i * 20 - 10}px)`,
                  width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.6)',
                }}
              />
            ))}

            {/* Wipeout text overlay */}
            {wiping && (
              <motion.div
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ duration: 0.3, repeat: Infinity }}
                style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  fontSize: 28, fontWeight: 800, color: '#FF4B4B',
                  textShadow: '0 0 20px rgba(255,75,75,0.6), 0 0 40px rgba(255,75,75,0.3)',
                }}
              >
                WIPEOUT!
              </motion.div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: variationColor, fontSize: 16, fontWeight: 700, marginBottom: 10 }}><VariationIcon size={18} /> {variation === 'high' ? 'HIGH VARIATION — Great!' : variation === 'good' ? 'GOOD VARIATION' : 'LOW VARIATION — Add expression!'}</div>
          <div className="card" style={{ width: '100%', maxWidth: 600, textAlign: 'center', padding: '18px 28px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', marginBottom: 6 }}>Read With Expression</div>
            <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4 }}>{prompt}</div>
          </div>
          <AudioWave />
          {time < gameDuration - 10 && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={finishGame}
              style={{ marginTop: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '10px 28px', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
            >
              Finish Early
            </motion.button>
          )}
        </div>
      </div>
      <BottomBanner left={<div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>{variation === 'high' ? 'Ride the wave! Great variation.' : 'Vary your pitch more!'}</div>} center={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: variationColor }}>{variation === 'low' ? 'Flat' : variation === 'good' ? 'Good' : 'High'}</div><div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pitch Variation</div></div>} right={<><Zap size={14} /> {Math.round(currentPitch)}Hz</>} />
    </div>
  )
}
