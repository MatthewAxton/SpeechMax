import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { TopBanner, BottomBanner } from '../components/Banner'
import { AudioWave } from '../components/AudioWave'
import { GraceCountdown } from '../components/GraceCountdown'
import { startTranscription, stopTranscription } from '../../analysis/speech/transcriber'
import { startWpmTracking, stopWpmTracking, onWpmReading } from '../../analysis/speech/wpmTracker'
import { useMicrophone } from '../../analysis/hooks/useMicrophone'
import { computeSimpleGameScore } from '../../analysis/scoring/gameScorer'
import { useGameStore } from '../../store/gameStore'
import { useSessionStore } from '../../store/sessionStore'
import { useRequireScan } from '../hooks/useRequireScan'

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
  const [ready, setReady] = useState(false)
  const wpmRef = useRef(0)
  const timeInZoneRef = useRef(0)
  const { requestMic, stopMic } = useMicrophone()

  const onReady = useCallback(async () => {
    await requestMic()
    startTranscription()
    startWpmTracking()
    setReady(true)
  }, [requestMic])

  // Listen for real WPM readings
  useEffect(() => {
    if (!ready) return
    const unsub = onWpmReading((reading) => {
      setWpm(reading.rolling)
      wpmRef.current = reading.rolling
      if (reading.rolling >= zoneMin && reading.rolling <= zoneMax) {
        setTimeInZone(p => { timeInZoneRef.current = p + 1; return p + 1 })
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
          useSessionStore.getState().checkBadges()
          nav('/score/pace')
          return 0
        }
        return p - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [nav, ready, stopMic])

  if (!hasScans) return null
  const inZone = wpm >= zoneMin && wpm <= zoneMax
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {!ready && <GraceCountdown onReady={onReady} prompt={prompt} promptLabel="Freestyle" />}
      <TopBanner backTo="/queue" title="Pace Racer" center={<span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 12, fontSize: 15, fontWeight: 800 }}>0:{time.toString().padStart(2, '0')}</span>} right={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700 }}><Zap size={14} /> {timeInZone}s</span><span style={{ background: `${difficulty === 'hard' ? '#FF4B4B' : difficulty === 'medium' ? '#FCD34D' : '#58CC02'}30`, color: difficulty === 'hard' ? '#FF4B4B' : difficulty === 'medium' ? '#FCD34D' : '#58CC02', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, textTransform: 'uppercase' }}>{difficulty}</span></div>} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 40px' }}>
          <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 2.5 }} style={{ textAlign: 'center', marginBottom: 8 }}>
            <motion.span key={wpm} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} style={{ fontSize: 64, fontWeight: 800, lineHeight: 1, display: 'inline-block', background: 'linear-gradient(135deg, #C28FE7, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{wpm}</motion.span><span style={{ fontSize: 22, fontWeight: 700, color: 'var(--muted)' }}> WPM</span>
          </motion.div>
          <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600, marginBottom: 20 }}>Target: {zoneMin}–{zoneMax} WPM</div>
          <div style={{ width: '100%', maxWidth: 600, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)' }}>Slow</span><span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)' }}>Fast</span></div>
            <div style={{ height: 16, background: 'var(--border)', borderRadius: 8, position: 'relative' }}>
              <motion.div animate={{ width: `${Math.min(100, (wpm / 200) * 100)}%` }} style={{ height: '100%', background: inZone ? 'var(--green)' : 'var(--red)', borderRadius: 8 }} />
              <div style={{ position: 'absolute', top: -4, left: '33%', width: 2, height: 24, background: 'var(--text)', opacity: 0.2 }} />
              <div style={{ position: 'absolute', top: -4, left: '75%', width: 2, height: 24, background: 'var(--text)', opacity: 0.2 }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: inZone ? 'var(--green)' : 'var(--red)', marginTop: 8 }}>{inZone ? `${zoneMin}–${zoneMax} WPM Zone` : wpm === 0 ? 'Start speaking...' : 'Outside zone!'}</div>
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
