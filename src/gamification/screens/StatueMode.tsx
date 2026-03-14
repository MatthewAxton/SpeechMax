import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { TopBanner, BottomBanner } from '../components/Banner'
import { AudioWave } from '../components/AudioWave'
import { CameraFeed } from '../components/CameraFeed'
import { initPoseTracker, startPoseTracking, stopPoseTracking, onPoseFrame } from '../../analysis/mediapipe/poseTracker'
import { computeSimpleGameScore } from '../../analysis/scoring/gameScorer'
import { useGameStore } from '../../store/gameStore'
import { useSessionStore } from '../../store/sessionStore'
import { useRequireScan } from '../hooks/useRequireScan'
import { playGameComplete, playBadgeEarned } from '../../lib/sounds'

export default function StatueMode() {
  const hasScans = useRequireScan()
  const nav = useNavigate()
  const [prompt] = useState(() => useSessionStore.getState().getUnusedPrompt('professional'))
  const [difficulty] = useState(() => useGameStore.getState().getDifficultyFor('statue-mode'))
  const gameDuration = difficulty === 'hard' ? 60 : 45
  const [time, setTime] = useState(gameDuration)
  const [ready, setReady] = useState(false)
  const [composureScore, setComposureScore] = useState(100)
  const [movementAlerts, setMovementAlerts] = useState(0)
  const [headStatus, setHeadStatus] = useState<'stable' | 'moving'>('stable')
  const [handStatus, setHandStatus] = useState<'stable' | 'moving'>('stable')
  const [modelLoading, setModelLoading] = useState(true)
  const alertCount = useRef(0)
  const composureRef = useRef(100)
  const finished = useRef(false)

  // Auto-start on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try { await initPoseTracker() } catch { /* MediaPipe may fail */ }
      if (!cancelled) { setModelLoading(false); setReady(true) }
    })()
    return () => { cancelled = true }
  }, [])

  // Start tracking when video is ready
  useEffect(() => {
    if (!ready || modelLoading) return
    const t = setTimeout(() => {
      const video = document.querySelector('video') as HTMLVideoElement | null
      if (video) startPoseTracking(video)
    }, 500)
    return () => clearTimeout(t)
  }, [ready, modelLoading])

  // Listen for pose data
  useEffect(() => {
    if (!ready) return
    const unsub = onPoseFrame((frame) => {
      const score = Math.round(frame.postureScore * 0.4 + frame.headStability * 60)
      composureRef.current = score
      setComposureScore(score)
      setHeadStatus(frame.headStability > 0.7 ? 'stable' : 'moving')
      setHandStatus(frame.handMovement < 0.2 ? 'stable' : 'moving')
      if (frame.isFidgeting) {
        alertCount.current++
        setMovementAlerts(alertCount.current)
      }
    })
    return unsub
  }, [ready])

  const finishGame = useCallback(() => {
    if (finished.current) return
    finished.current = true
    stopPoseTracking()
    const metrics = { stillnessPercent: composureRef.current, movementAlerts: alertCount.current }
    const score = computeSimpleGameScore('statue-mode', metrics)
    useGameStore.getState().addGameResult({ gameType: 'statue-mode', score, metrics, timestamp: Date.now() })
    useSessionStore.getState().markPromptUsed(prompt)
    useSessionStore.getState().recordGame('statue-mode')
    const badges = useSessionStore.getState().checkBadges()
    playGameComplete()
    if (badges && badges.length > 0) playBadgeEarned()
    nav('/score/statue')
  }, [nav, prompt])

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

  const heatColor = (intensity: number) => intensity < 0.3 ? '#58CC02' : intensity < 0.6 ? '#FCD34D' : '#FF4B4B'
  const headIntensity = headStatus === 'stable' ? 0.1 : 0.9
  const handIntensity = handStatus === 'stable' ? 0.1 : 0.9
  const torsoIntensity = 1 - composureScore / 100
  const headHeat = heatColor(headIntensity)
  const handHeat = heatColor(handIntensity)
  const torsoHeat = heatColor(torsoIntensity)
  const headMoving = headStatus !== 'stable'
  const handMoving = handStatus !== 'stable'
  const torsoMoving = torsoIntensity >= 0.3

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <TopBanner backTo="/queue" title="Statue Mode" center={<span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 12, fontSize: 15, fontWeight: 800 }}>0:{time.toString().padStart(2, '0')}</span>} right={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700 }}><Zap size={14} /> {composureScore}</span><span style={{ background: `${difficulty === 'hard' ? '#FF4B4B' : difficulty === 'medium' ? '#FCD34D' : '#58CC02'}30`, color: difficulty === 'hard' ? '#FF4B4B' : difficulty === 'medium' ? '#FCD34D' : '#58CC02', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, textTransform: 'uppercase' }}>{difficulty}</span></div>} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 40px' }}>
          <div style={{ width: '100%', marginBottom: 8, boxShadow: '0 4px 20px rgba(194,143,231,0.08)', borderRadius: 20 }}>
            <CameraFeed
              style={{ height: 'calc(100vh - 260px)', maxHeight: 460 }}
              overlay={
                <svg style={{ position: 'absolute', inset: 30, pointerEvents: 'none' }} viewBox="0 0 580 300">
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>

                  {/* Head */}
                  <motion.g filter="url(#glow)" animate={headMoving ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }} transition={headMoving ? { duration: 0.8, repeat: Infinity } : undefined}>
                    <ellipse cx={290} cy={40} rx={25} ry={28} fill={`${headHeat}20`} stroke={headHeat} strokeWidth={2} />
                  </motion.g>

                  {/* Torso */}
                  <motion.g filter="url(#glow)" animate={torsoMoving ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }} transition={torsoMoving ? { duration: 0.8, repeat: Infinity } : undefined}>
                    <rect x={260} y={72} width={60} height={85} rx={10} fill={`${torsoHeat}20`} stroke={torsoHeat} strokeWidth={2} />
                  </motion.g>

                  {/* Left arm */}
                  <motion.g filter="url(#glow)" animate={handMoving ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }} transition={handMoving ? { duration: 0.8, repeat: Infinity } : undefined}>
                    <path d="M258,75 L200,130 L180,190" fill="none" stroke={handHeat} strokeWidth={4} strokeLinecap="round" />
                  </motion.g>

                  {/* Right arm (always green — no right-hand data) */}
                  <g filter="url(#glow)">
                    <path d="M322,75 L380,130 L400,190" fill="none" stroke="#58CC02" strokeWidth={4} strokeLinecap="round" />
                  </g>

                  {/* Left leg */}
                  <g filter="url(#glow)">
                    <path d="M272,160 L255,230 L248,280" fill="none" stroke="#58CC02" strokeWidth={4} strokeLinecap="round" />
                  </g>

                  {/* Right leg */}
                  <g filter="url(#glow)">
                    <path d="M308,160 L325,230 L332,280" fill="none" stroke="#58CC02" strokeWidth={4} strokeLinecap="round" />
                  </g>
                </svg>
              }
            />
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#58CC02' }} /> Stable</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FCD34D' }} /> Moderate</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF4B4B' }} /> Excess</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted, #777)' }}>Alerts: {movementAlerts}</span>
          </div>
          <div className="card" style={{ width: '100%', maxWidth: 600, textAlign: 'center', padding: '14px 28px', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', marginBottom: 6 }}>Composure Challenge</div>
            <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4 }}>{prompt}</div>
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
      <BottomBanner left={<div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>{movementAlerts > 3 ? 'Too much movement! Stay still.' : 'Great composure! Keep it up.'}</div>} center={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ fontSize: 22, fontWeight: 800 }}>{composureScore}</div><div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Composure Score</div></div>} right={<><Zap size={14} /> {movementAlerts} alerts</>} />
    </div>
  )
}
