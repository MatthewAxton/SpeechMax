import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Lock } from 'lucide-react'
import { TopBanner, BottomBanner } from '../components/Banner'
import { AudioWave } from '../components/AudioWave'
import { CameraFeed } from '../components/CameraFeed'
import { EyeContactIndicator } from '../components/EyeContactIndicator'
import { useEyeContact } from '../../analysis/hooks/useEyeContact'
import { computeSimpleGameScore } from '../../analysis/scoring/gameScorer'
import { useGameStore } from '../../store/gameStore'
import { useSessionStore } from '../../store/sessionStore'
import { useRequireScan } from '../hooks/useRequireScan'
import { playGameComplete, playBadgeEarned } from '../../lib/sounds'

const QUALITY_COLORS = { good: '#58CC02', weak: '#F5A623', lost: '#FF4B4B' }

export default function EyeLock() {
  const hasScans = useRequireScan()
  const nav = useNavigate()
  const [prompt] = useState(() => useSessionStore.getState().getUnusedPrompt('interview'))
  const [difficulty] = useState(() => useGameStore.getState().getDifficultyFor('eye-lock'))
  const gameDuration = difficulty === 'hard' ? 60 : 45
  const [time, setTime] = useState(gameDuration)
  const [ready, setReady] = useState(false)
  const finished = useRef(false)

  const eye = useEyeContact()

  // Auto-start on mount
  useEffect(() => {
    let cancelled = false
    eye.init().then(() => { if (!cancelled) setReady(true) })
    return () => { cancelled = true }
  }, [eye.init])

  // Start tracking once video is playing
  const handleStream = useCallback(() => {
    if (!eye.modelReady) return
    setTimeout(() => {
      const video = document.querySelector('video') as HTMLVideoElement | null
      if (video) eye.startTracking(video)
    }, 600)
  }, [eye.modelReady, eye.startTracking])

  // Retry when model loads after stream
  useEffect(() => {
    if (!ready || !eye.modelReady) return
    const t = setTimeout(() => {
      const video = document.querySelector('video') as HTMLVideoElement | null
      if (video) eye.startTracking(video)
    }, 600)
    return () => clearTimeout(t)
  }, [ready, eye.modelReady, eye.startTracking])

  const finishGame = useCallback(() => {
    if (finished.current) return
    finished.current = true
    eye.stopTracking()
    const metrics = { gazeLockedPercent: eye.sessionPercent, longestGazeSeconds: eye.longestStreak }
    const score = computeSimpleGameScore('eye-lock', metrics)
    useGameStore.getState().addGameResult({ gameType: 'eye-lock', score, metrics, timestamp: Date.now() })
    useSessionStore.getState().markPromptUsed(prompt)
    useSessionStore.getState().recordGame('eye-lock')
    const badges = useSessionStore.getState().checkBadges()
    playGameComplete()
    if (badges && badges.length > 0) playBadgeEarned()
    nav('/score/eyelock')
  }, [eye, nav, prompt])

  // Timer
  useEffect(() => {
    if (!ready) return
    const t = setInterval(() => setTime(p => {
      if (p <= 1) {
        clearInterval(t)
        finishGame()
        return 0
      }
      return p - 1
    }), 1000)
    return () => clearInterval(t)
  }, [nav, ready, finishGame])

  if (!hasScans) return null
  const color = QUALITY_COLORS[eye.quality]
  const mins = Math.floor(time / 60)
  const secs = time % 60

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <AnimatePresence>
        {ready && eye.quality === 'good' && (
          <motion.div
            key="pulse-good"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(88,204,2,0.03)', pointerEvents: 'none', zIndex: 5 }}
          />
        )}
        {ready && eye.quality === 'weak' && (
          <motion.div
            key="pulse-weak"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', pointerEvents: 'none', zIndex: 5 }}
          />
        )}
        {ready && eye.quality === 'lost' && (
          <motion.div
            key="pulse-lost"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none', zIndex: 5 }}
          />
        )}
      </AnimatePresence>

      <TopBanner
        backTo="/queue"
        title="Eye Lock"
        center={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 12, fontSize: 15, fontWeight: 800 }}>
              {mins}:{secs.toString().padStart(2, '0')}
            </span>
            <span style={{
              background: `${color}40`, padding: '4px 12px', borderRadius: 10,
              fontSize: 13, fontWeight: 700, color: 'white',
              transition: 'background 0.4s',
            }}>
              {eye.sessionPercent}%
            </span>
          </div>
        }
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700 }}>
              <Zap size={14} /> Best: {eye.longestStreak}s
            </span>
            <span style={{ background: `${difficulty === 'hard' ? '#FF4B4B' : difficulty === 'medium' ? '#FCD34D' : '#58CC02'}30`, color: difficulty === 'hard' ? '#FF4B4B' : difficulty === 'medium' ? '#FCD34D' : '#58CC02', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, textTransform: 'uppercase' }}>{difficulty}</span>
          </div>
        }
      />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 24px' }}>

          {/* Camera with eye contact measurement overlay */}
          <div style={{
            width: '100%', marginBottom: 8,
            boxShadow: `0 0 0 3px ${color}50, 0 4px 24px rgba(0,0,0,0.15)`,
            borderRadius: 20,
            transition: 'box-shadow 0.5s ease',
          }}>
            <CameraFeed
              style={{ height: 'calc(100vh - 220px)', maxHeight: 500 }}
              withAudio={true}
              onStream={handleStream}
              overlay={
                <EyeContactIndicator
                  quality={eye.quality}
                  confidence={eye.confidence}
                  sessionPercent={eye.sessionPercent}
                  currentStreak={eye.currentStreak}
                  headYaw={eye.headYaw}
                  headPitch={eye.headPitch}
                  signals={eye.signals}
                  leftEyePos={eye.leftEyePos}
                  rightEyePos={eye.rightEyePos}
                />
              }
            />
          </div>

          {/* Question card */}
          <div className="card" style={{ width: '100%', maxWidth: 600, textAlign: 'center', padding: '18px 28px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', marginBottom: 6 }}>Behavioral Question</div>
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

      <BottomBanner
        left={
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>
            {eye.quality === 'good' ? 'Strong eye contact — keep it up!'
              : eye.quality === 'weak' ? 'Eye contact drifting — refocus.'
              : 'Eye contact lost.'}
          </div>
        }
        center={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <motion.div
              key={eye.confidence}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ fontSize: 22, fontWeight: 800, color }}
            >
              {eye.sessionPercent}% Engaged
            </motion.div>
            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Session Score
            </div>
          </div>
        }
        right={<><Lock size={16} /> {eye.quality === 'good' ? 'Locked' : eye.quality === 'weak' ? 'Drifting' : 'Lost'}</>}
      />
    </div>
  )
}
