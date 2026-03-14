import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Zap, Lock } from 'lucide-react'
import GameIntro from '../components/GameIntro'
import CountdownOverlay from '../components/CountdownOverlay'
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
  const [charge, setCharge] = useState(0)
  const [burstCount, setBurstCount] = useState(0)
  const [phase, setPhase] = useState<'intro' | 'countdown' | 'playing'>('intro')
  const finished = useRef(false)

  const eye = useEyeContact()

  // Auto-start when playing
  useEffect(() => {
    if (phase !== 'playing') return
    let cancelled = false
    eye.init().then(() => { if (!cancelled) setReady(true) })
    return () => { cancelled = true }
  }, [phase, eye.init])

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

  // Power ring: charges while maintaining eye contact
  useEffect(() => {
    if (!ready) return
    const t = setInterval(() => {
      if (eye.quality === 'good') {
        setCharge(c => {
          if (c >= 100) {
            setBurstCount(b => b + 1)
            return 0 // reset after burst
          }
          return Math.min(100, c + 5) // ~4 seconds to fill
        })
      } else {
        setCharge(c => Math.max(0, c - 8)) // drains faster than it fills
      }
    }, 200)
    return () => clearInterval(t)
  }, [ready, eye.quality])

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
  if (phase === 'intro') return (
    <GameIntro
      title="Eye Lock"
      axis="Confidence"
      duration={`${gameDuration}s`}
      icon={Eye}
      steps={[
        'Look directly at the camera while answering the question',
        'The screen glows green when your gaze is locked',
        'Looking away dims the screen — stay focused!',
      ]}
      goal="Keep your gaze locked for as much of the session as possible"
      tip="Relax your shoulders and breathe."
      prompt={prompt}
      promptLabel="Behavioral Question"
      heroContent={
        <div style={{ position: 'relative', width: 100, height: 100 }}>
          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 2, repeat: Infinity }} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(88,204,2,0.3)' }} />
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} style={{ position: 'absolute', inset: 15, borderRadius: '50%', border: '2px solid rgba(88,204,2,0.4)' }} />
          <div style={{ position: 'absolute', inset: 35, borderRadius: '50%', background: '#58CC02', boxShadow: '0 0 20px rgba(88,204,2,0.5)' }} />
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

      {!eye.modelReady && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(5,5,8,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, pointerEvents: 'none' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(194,143,231,0.2)', borderTopColor: '#C28FE7' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Loading eye tracking model...</div>
        </div>
      )}

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

          {/* Power ring charge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ position: 'relative', width: 48, height: 48 }}>
              <svg width={48} height={48} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={24} cy={24} r={20} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={4} />
                <circle cx={24} cy={24} r={20} fill="none" stroke={charge >= 90 ? '#FFD700' : '#58CC02'} strokeWidth={4} strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - charge / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.2s ease, stroke 0.3s', filter: charge >= 90 ? 'drop-shadow(0 0 8px #FFD700)' : 'none' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: charge >= 90 ? '#FFD700' : 'rgba(255,255,255,0.6)' }}>
                {charge >= 100 ? '✦' : `${charge}%`}
              </div>
            </div>
            {burstCount > 0 && (
              <motion.div key={burstCount} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ fontSize: 13, fontWeight: 800, color: '#FFD700' }}>
                +{burstCount} BURST{burstCount > 1 ? 'S' : ''}
              </motion.div>
            )}
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
              {charge >= 90 ? 'READY TO BURST!' : eye.quality === 'good' ? 'Charging...' : 'Lock eyes to charge'}
            </div>
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
