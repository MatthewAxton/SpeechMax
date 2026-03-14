import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { TopBanner, BottomBanner } from '../components/Banner'
import { AudioWave } from '../components/AudioWave'
import { GraceCountdown } from '../components/GraceCountdown'
import { CameraFeed } from '../components/CameraFeed'
import { initPoseTracker, startPoseTracking, stopPoseTracking, onPoseFrame } from '../../analysis/mediapipe/poseTracker'

export default function StatueMode() {
  const nav = useNavigate()
  const [time, setTime] = useState(45)
  const [ready, setReady] = useState(false)
  const [composureScore, setComposureScore] = useState(100)
  const [movementAlerts, setMovementAlerts] = useState(0)
  const [headStatus, setHeadStatus] = useState<'stable' | 'moving'>('stable')
  const [handStatus, setHandStatus] = useState<'stable' | 'moving'>('stable')
  const [modelLoading, setModelLoading] = useState(true)
  const alertCount = useRef(0)

  const onReady = useCallback(async () => {
    try {
      await initPoseTracker()
    } catch {
      // MediaPipe may fail — continue anyway
    }
    setModelLoading(false)
    setReady(true)
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
      setComposureScore(Math.round(frame.postureScore * 0.4 + frame.headStability * 60))
      setHeadStatus(frame.headStability > 0.7 ? 'stable' : 'moving')
      setHandStatus(frame.handMovement < 0.2 ? 'stable' : 'moving')
      if (frame.isFidgeting) {
        alertCount.current++
        setMovementAlerts(alertCount.current)
      }
    })
    return unsub
  }, [ready])

  // Timer
  useEffect(() => {
    if (!ready) return
    const t = setInterval(() => setTime(p => {
      if (p <= 1) {
        clearInterval(t)
        stopPoseTracking()
        nav('/score/statue')
        return 0
      }
      return p - 1
    }), 1000)
    return () => clearInterval(t)
  }, [nav, ready])

  const headColor = headStatus === 'stable' ? 'var(--green, #58CC02)' : 'var(--red, #FF4B4B)'
  const handColor = handStatus === 'stable' ? 'var(--green, #58CC02)' : 'var(--red, #FF4B4B)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {!ready && <GraceCountdown onReady={onReady} prompt="Present your biggest achievement. Stay composed." promptLabel="Composure Challenge" />}
      <TopBanner backTo="/queue" title="Statue Mode" center={<span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 12, fontSize: 15, fontWeight: 800 }}>0:{time.toString().padStart(2, '0')}</span>} right={<span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700 }}><Zap size={14} /> {composureScore}</span>} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 40px' }}>
          <div style={{ width: '100%', maxWidth: 640, marginBottom: 10, boxShadow: '0 4px 20px rgba(194,143,231,0.08)', borderRadius: 20 }}>
            <CameraFeed
              style={{ height: 300 }}
              overlay={
                <svg style={{ position: 'absolute', inset: 30, pointerEvents: 'none' }} viewBox="0 0 580 300">
                  <rect x={230} y={5} width={120} height={70} rx={8} fill={headStatus === 'stable' ? 'rgba(88,204,2,0.06)' : 'rgba(255,75,75,0.06)'} stroke={headColor} strokeWidth={1} strokeDasharray={4} />
                  <text x={290} y={84} textAnchor="middle" fontFamily="Nunito" fontSize={10} fontWeight={600} fill={headColor}>Head: {headStatus === 'stable' ? 'Stable' : 'Moving!'}</text>
                  <rect x={200} y={90} width={180} height={50} rx={8} fill="rgba(88,204,2,0.06)" stroke="var(--green, #58CC02)" strokeWidth={1} strokeDasharray={4} />
                  <text x={290} y={150} textAnchor="middle" fontFamily="Nunito" fontSize={10} fontWeight={600} fill="var(--green, #58CC02)">Shoulders: Stable</text>
                  <rect x={120} y={140} width={100} height={70} rx={8} fill={handStatus === 'stable' ? 'rgba(88,204,2,0.06)' : 'rgba(255,75,75,0.06)'} stroke={handColor} strokeWidth={1} strokeDasharray={4} />
                  <text x={170} y={220} textAnchor="middle" fontFamily="Nunito" fontSize={10} fontWeight={600} fill={handColor}>Left Hand: {handStatus === 'stable' ? 'Stable' : 'Moving!'}</text>
                  <line x1={290} y1={40} x2={290} y2={110} stroke="var(--purple, #C28FE7)" strokeWidth={2} opacity={0.4} />
                  <line x1={290} y1={110} x2={230} y2={160} stroke="var(--purple, #C28FE7)" strokeWidth={2} opacity={0.4} />
                  <line x1={290} y1={110} x2={350} y2={160} stroke="var(--purple, #C28FE7)" strokeWidth={2} opacity={0.4} />
                  <line x1={230} y1={160} x2={170} y2={180} stroke={handColor} strokeWidth={2} opacity={0.5} />
                  <line x1={350} y1={160} x2={405} y2={180} stroke="var(--purple, #C28FE7)" strokeWidth={2} opacity={0.4} />
                </svg>
              }
            />
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green, #58CC02)' }} /> Stable</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--red, #FF4B4B)' }} /> Moving</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted, #777)' }}>Alerts: {movementAlerts}</span>
          </div>
          <div className="card" style={{ width: '100%', maxWidth: 600, textAlign: 'center', padding: '14px 28px', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', marginBottom: 6 }}>Composure Challenge</div>
            <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>Present your biggest achievement. Stay composed.</div>
          </div>
          <AudioWave />
        </div>
      </div>
      <BottomBanner left={<div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>{movementAlerts > 3 ? 'Too much movement! Stay still.' : 'Great composure! Keep it up.'}</div>} center={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ fontSize: 22, fontWeight: 800 }}>{composureScore}</div><div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Composure Score</div></div>} right={<><Zap size={14} /> {movementAlerts} alerts</>} />
    </div>
  )
}
