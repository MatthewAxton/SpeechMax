import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { TopBanner, BottomBanner } from '../components/Banner'
import { AudioWave } from '../components/AudioWave'
import { CameraFeed } from '../components/CameraFeed'
import { initPoseTracker, startPoseTracking, stopPoseTracking, onPoseFrame, type PoseFrame } from '../../analysis/mediapipe/poseTracker'
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
  const [bodyLandmarks, setBodyLandmarks] = useState<PoseFrame['bodyLandmarks']>(null)
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
      if (frame.bodyLandmarks) setBodyLandmarks(frame.bodyLandmarks)
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
                bodyLandmarks ? (() => {
                  const b = bodyLandmarks
                  // Convert normalized coords to percentage positions (mirrored for camera)
                  const px = (p: { x: number; y: number }) => `${(1 - p.x) * 100}%`
                  const py = (p: { x: number; y: number }) => `${p.y * 100}%`

                  const Joint = ({ pos, color, pulse }: { pos: { x: number; y: number }; color: string; pulse: boolean }) => (
                    <motion.div
                      animate={pulse ? { boxShadow: [`0 0 8px ${color}80`, `0 0 20px ${color}`, `0 0 8px ${color}80`] } : {}}
                      transition={pulse ? { duration: 1, repeat: Infinity } : undefined}
                      style={{
                        position: 'absolute', left: px(pos), top: py(pos),
                        width: 14, height: 14, marginLeft: -7, marginTop: -7,
                        borderRadius: '50%', background: color, border: '2px solid rgba(255,255,255,0.6)',
                        boxShadow: `0 0 8px ${color}80`,
                        transition: 'background 0.3s',
                      }}
                    />
                  )

                  const Bone = ({ from, to, color }: { from: { x: number; y: number }; to: { x: number; y: number }; color: string }) => (
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                      <line
                        x1={`${(1 - from.x) * 100}%`} y1={`${from.y * 100}%`}
                        x2={`${(1 - to.x) * 100}%`} y2={`${to.y * 100}%`}
                        stroke={color} strokeWidth={3} strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 4px ${color}60)`, transition: 'stroke 0.3s' }}
                      />
                    </svg>
                  )

                  return (
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                      {/* Bones */}
                      <Bone from={b.leftShoulder} to={b.rightShoulder} color={torsoHeat} />
                      <Bone from={b.leftShoulder} to={b.leftElbow} color={handHeat} />
                      <Bone from={b.leftElbow} to={b.leftWrist} color={handHeat} />
                      <Bone from={b.rightShoulder} to={b.rightElbow} color={handHeat} />
                      <Bone from={b.rightElbow} to={b.rightWrist} color={handHeat} />
                      <Bone from={b.leftShoulder} to={b.leftHip} color={torsoHeat} />
                      <Bone from={b.rightShoulder} to={b.rightHip} color={torsoHeat} />
                      <Bone from={b.leftHip} to={b.rightHip} color={torsoHeat} />
                      {/* Joints */}
                      <Joint pos={b.nose} color={headHeat} pulse={headMoving} />
                      <Joint pos={b.leftShoulder} color={torsoHeat} pulse={torsoMoving} />
                      <Joint pos={b.rightShoulder} color={torsoHeat} pulse={torsoMoving} />
                      <Joint pos={b.leftElbow} color={handHeat} pulse={handMoving} />
                      <Joint pos={b.rightElbow} color={handHeat} pulse={handMoving} />
                      <Joint pos={b.leftWrist} color={handHeat} pulse={handMoving} />
                      <Joint pos={b.rightWrist} color={handHeat} pulse={handMoving} />
                      <Joint pos={b.leftHip} color={torsoHeat} pulse={false} />
                      <Joint pos={b.rightHip} color={torsoHeat} pulse={false} />
                    </div>
                  )
                })() : undefined
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
