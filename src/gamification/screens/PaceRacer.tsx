import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Activity } from 'lucide-react'
import GameIntro from '../components/GameIntro'
import CountdownOverlay from '../components/CountdownOverlay'
import { TopBanner, BottomBanner } from '../components/Banner'
import { AudioWave } from '../components/AudioWave'
import { startTranscription, stopTranscription } from '../../analysis/speech/transcriber'
import { startWpmTracking, stopWpmTracking, onWpmReading } from '../../analysis/speech/wpmTracker'
import { useMicrophone } from '../../analysis/hooks/useMicrophone'
import { computeSimpleGameScore } from '../../analysis/scoring/gameScorer'
import { useGameStore } from '../../store/gameStore'
import { useSessionStore } from '../../store/sessionStore'
import { useRequireScan } from '../hooks/useRequireScan'
import { playGameComplete, playBadgeEarned } from '../../lib/sounds'

export default function PaceRacer() {
  const hasScans = useRequireScan()
  const nav = useNavigate()
  const [prompt] = useState(() => useSessionStore.getState().getUnusedPrompt('casual'))
  const [difficulty] = useState(() => useGameStore.getState().getDifficultyFor('pace-racer'))
  const gameDuration = difficulty === 'hard' ? 90 : 60
  const zoneMin = difficulty === 'hard' ? 130 : difficulty === 'medium' ? 120 : 100
  const zoneMax = difficulty === 'hard' ? 150 : difficulty === 'medium' ? 160 : 180
  const [time, setTime] = useState(gameDuration)
  const [wpm, setWpm] = useState(0)
  const [timeInZone, setTimeInZone] = useState(0)
  const [phase, setPhase] = useState<'intro' | 'countdown' | 'playing'>('intro')
  const [ready, setReady] = useState(false)
  const [gear, setGear] = useState(0)
  const consecutiveInZone = useRef(0)
  const [silent, setSilent] = useState(false)
  const lastWpmTime = useRef(Date.now())
  const wpmRef = useRef(0)
  const timeInZoneRef = useRef(0)
  const { requestMic, stopMic } = useMicrophone()

  // Auto-start when playing
  useEffect(() => {
    if (phase !== 'playing') return
    let cancelled = false
    ;(async () => {
      await requestMic()
      if (!cancelled) {
        startTranscription()
        startWpmTracking()
        setReady(true)
      }
    })()
    return () => { cancelled = true }
  }, [phase, requestMic])

  // Listen for real WPM readings
  useEffect(() => {
    if (!ready) return
    const unsub = onWpmReading((reading) => {
      setWpm(reading.rolling)
      wpmRef.current = reading.rolling
      if (reading.rolling > 0) { lastWpmTime.current = Date.now(); setSilent(false) }
      if (reading.rolling >= zoneMin && reading.rolling <= zoneMax) {
        setTimeInZone(p => { timeInZoneRef.current = p + 1; return p + 1 })
      }
      // Gear system: sustained in-zone = gear up
      if (reading.rolling >= zoneMin && reading.rolling <= zoneMax) {
        consecutiveInZone.current++
        if (consecutiveInZone.current >= 40) setGear(4)      // ~20s at 500ms intervals
        else if (consecutiveInZone.current >= 24) setGear(3)  // ~12s
        else if (consecutiveInZone.current >= 12) setGear(2)  // ~6s
        else if (consecutiveInZone.current >= 4) setGear(1)   // ~2s
      } else {
        consecutiveInZone.current = Math.max(0, consecutiveInZone.current - 2) // downshift
        if (consecutiveInZone.current < 4) setGear(0)
        else if (consecutiveInZone.current < 12) setGear(1)
        else if (consecutiveInZone.current < 24) setGear(2)
        else setGear(3)
      }
    })
    return unsub
  }, [ready])

  useEffect(() => {
    if (!ready) return
    const t = setInterval(() => {
      setTime(p => {
        if (p <= 1) {
          clearInterval(t)
          stopTranscription()
          stopWpmTracking()
          stopMic()
          const metrics = { timeInZoneSeconds: timeInZoneRef.current, totalSeconds: gameDuration, avgWpm: wpmRef.current }
          const score = computeSimpleGameScore('pace-racer', metrics)
          useGameStore.getState().addGameResult({ gameType: 'pace-racer', score, metrics, timestamp: Date.now() })
          useSessionStore.getState().markPromptUsed(prompt)
          useSessionStore.getState().recordGame('pace-racer')
          const badges = useSessionStore.getState().checkBadges()
          playGameComplete()
          if (badges && badges.length > 0) playBadgeEarned()
          nav('/score/pace')
          return 0
        }
        return p - 1
      })
      if (Date.now() - lastWpmTime.current > 5000) setSilent(true)
    }, 1000)
    return () => clearInterval(t)
  }, [nav, ready, stopMic])

  if (!hasScans) return null
  if (phase === 'intro') return (
    <GameIntro
      title="Pace Racer"
      axis="Pacing"
      duration={`${gameDuration}s`}
      icon={Activity}
      steps={[
        'Speak on the prompt at a natural pace',
        `A pace bar shows your live WPM — stay in the green zone (${zoneMin}–${zoneMax})`,
        'Too fast or too slow and the bar turns red',
      ]}
      goal={`Keep your speaking pace in the green zone for ${gameDuration} seconds`}
      tip="Breathe between sentences to control pace."
      prompt={prompt}
      promptLabel="Freestyle"
      heroContent={
        <div style={{ width: '100%', maxWidth: 300 }}>
          <div style={{ height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
            <motion.div animate={{ width: ['20%', '60%', '80%', '50%', '20%'] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} style={{ height: '100%', background: 'linear-gradient(90deg, #FF4B4B, #58CC02, #58CC02, #FF4B4B)', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
            <span>Slow</span><span style={{ color: '#58CC02' }}>{zoneMin}–{zoneMax} WPM</span><span>Fast</span>
          </div>
        </div>
      }
      onReady={() => setPhase('countdown')}
    />
  )
  if (phase === 'countdown') return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <CountdownOverlay onComplete={() => setPhase('playing')} />
    </div>
  )
  const inZone = wpm >= zoneMin && wpm <= zoneMax
  const nearLow = Math.abs(wpm - zoneMin) < 15 && wpm > 0
  const nearHigh = Math.abs(wpm - zoneMax) < 15 && wpm > 0
  const wpmGradient = inZone
    ? 'linear-gradient(135deg, #58CC02, #34D399)'
    : wpm > 0
      ? 'linear-gradient(135deg, #FF4B4B, #F97316)'
      : 'linear-gradient(135deg, #C28FE7, #8B5CF6)'
  const wpmGlow = inZone
    ? '0 0 20px rgba(88,204,2,0.5)'
    : wpm > 0
      ? '0 0 20px rgba(255,75,75,0.5)'
      : 'none'
  const wpmLabelColor = inZone ? '#58CC02' : wpm > 0 ? '#FF4B4B' : 'var(--muted)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <TopBanner backTo="/queue" title="Pace Racer" center={<span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 12, fontSize: 15, fontWeight: 800 }}>0:{time.toString().padStart(2, '0')}</span>} right={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700 }}><Zap size={14} /> {timeInZone}s</span><span style={{ background: `${difficulty === 'hard' ? '#FF4B4B' : difficulty === 'medium' ? '#FCD34D' : '#58CC02'}30`, color: difficulty === 'hard' ? '#FF4B4B' : difficulty === 'medium' ? '#FCD34D' : '#58CC02', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, textTransform: 'uppercase' }}>{difficulty}</span></div>} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 40px' }}>
          <motion.div animate={{ scale: inZone ? [1, 1.05, 1] : [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: inZone ? 1.5 : 0.8 }} style={{ textAlign: 'center', marginBottom: 8 }}>
            <motion.span key={wpm} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} style={{ fontSize: 64, fontWeight: 800, lineHeight: 1, display: 'inline-block', background: wpmGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textShadow: wpmGlow }}>{wpm}</motion.span><span style={{ fontSize: 22, fontWeight: 700, color: wpmLabelColor, transition: 'color 0.5s ease' }}> WPM</span>
          </motion.div>
          <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600, marginBottom: 20 }}>Target: {zoneMin}–{zoneMax} WPM</div>
          <div style={{ width: '100%', maxWidth: 600, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)' }}>Slow</span><span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)' }}>Fast</span></div>
            <div style={{ height: 16, background: 'var(--border)', borderRadius: 8, position: 'relative', boxShadow: inZone ? '0 0 15px rgba(88,204,2,0.3), 0 0 30px rgba(88,204,2,0.15)' : wpm > 0 ? '0 0 15px rgba(255,75,75,0.3), 0 0 30px rgba(255,75,75,0.15)' : 'none', transition: 'box-shadow 0.5s ease' }}>
              <motion.div animate={{ width: `${Math.min(100, (wpm / 200) * 100)}%` }} style={{ height: '100%', background: inZone ? 'var(--green)' : 'var(--red)', borderRadius: 8 }} />
              <div style={{ position: 'absolute', top: -4, left: '33%', width: 2, height: 24, background: nearLow ? '#FCD34D' : 'var(--text)', opacity: nearLow ? 1 : 0.2, boxShadow: nearLow ? '0 0 8px rgba(252,211,77,0.6)' : 'none', transition: 'all 0.3s ease' }} />
              <div style={{ position: 'absolute', top: -4, left: '75%', width: 2, height: 24, background: nearHigh ? '#FCD34D' : 'var(--text)', opacity: nearHigh ? 1 : 0.2, boxShadow: nearHigh ? '0 0 8px rgba(252,211,77,0.6)' : 'none', transition: 'all 0.3s ease' }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: inZone ? 'var(--green)' : 'var(--red)', marginTop: 8 }}>{inZone ? `${zoneMin}–${zoneMax} WPM Zone` : silent ? 'Keep talking!' : wpm === 0 ? 'Start speaking...' : 'Outside zone!'}</div>
          </div>
          <div className="card" style={{ width: '100%', maxWidth: 600, textAlign: 'center', padding: '18px 28px', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', marginBottom: 6 }}>Freestyle</div>
            <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4 }}>{prompt}</div>
          </div>
          <AudioWave />
        </div>
      </div>
      <BottomBanner left={<div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>{inZone ? 'Perfect pace! Keep that rhythm.' : wpm === 0 ? 'Speak to begin!' : 'Adjust your pace!'}</div>} center={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: inZone ? '#58CC02' : wpm === 0 ? 'white' : '#FF4B4B' }}>{inZone ? 'In Zone' : wpm === 0 ? 'Ready' : 'Off Pace'}</div><div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>{wpm} WPM</div></div>} right={<><Zap size={14} /> Zone: {timeInZone}s</>} />
    </div>
  )
}
