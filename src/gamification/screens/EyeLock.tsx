import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Lock } from 'lucide-react'
import { TopBanner, BottomBanner } from '../components/Banner'
import { AudioWave } from '../components/AudioWave'
import { GraceCountdown } from '../components/GraceCountdown'
import { CameraFeed } from '../components/CameraFeed'
import { initFaceTracker, startFaceTracking, stopFaceTracking, onFaceFrame } from '../../analysis/mediapipe/faceTracker'

export default function EyeLock() {
  const nav = useNavigate()
  const [time, setTime] = useState(3)
  const [ready, setReady] = useState(false)
  const [gazePercent, setGazePercent] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [longestStreak, setLongestStreak] = useState(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const gazeFrames = useRef({ total: 0, locked: 0, currentStreak: 0 })
  const [modelLoading, setModelLoading] = useState(true)

  const onReady = useCallback(async () => {
    try {
      await initFaceTracker()
    } catch {
      // MediaPipe may fail — continue anyway with placeholder data
    }
    setModelLoading(false)
    setReady(true)
  }, [])

  // Start tracking when camera stream is ready
  const handleStream = useCallback((stream: MediaStream) => {
    // Get the video element from the stream
    const video = document.querySelector('video') as HTMLVideoElement | null
    if (video && !modelLoading) {
      videoRef.current = video
      startFaceTracking(video)
    }
  }, [modelLoading])

  // Start tracking when both model and video are ready
  useEffect(() => {
    if (!ready || modelLoading) return
    // Slight delay to let video element mount
    const t = setTimeout(() => {
      const video = document.querySelector('video') as HTMLVideoElement | null
      if (video) {
        videoRef.current = video
        startFaceTracking(video)
      }
    }, 500)
    return () => clearTimeout(t)
  }, [ready, modelLoading])

  // Listen for face tracking data
  useEffect(() => {
    if (!ready) return
    const unsub = onFaceFrame((frame) => {
      gazeFrames.current.total++
      if (frame.eyeContact) {
        gazeFrames.current.locked++
        gazeFrames.current.currentStreak++
        setLongestStreak(prev => Math.max(prev, gazeFrames.current.currentStreak))
      } else {
        gazeFrames.current.currentStreak = 0
      }
      setIsLocked(frame.eyeContact)
      const pct = gazeFrames.current.total > 0
        ? Math.round((gazeFrames.current.locked / gazeFrames.current.total) * 100)
        : 0
      setGazePercent(pct)
    })
    return unsub
  }, [ready])

  // Timer
  useEffect(() => {
    if (!ready) return
    const t = setInterval(() => setTime(p => {
      if (p <= 1) {
        clearInterval(t)
        stopFaceTracking()
        nav('/score/eyelock')
        return 0
      }
      return p - 1
    }), 1000)
    return () => clearInterval(t)
  }, [nav, ready])

  const glowColor = isLocked ? 'rgba(88,204,2,0.3)' : 'rgba(255,75,75,0.2)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {!ready && <GraceCountdown onReady={onReady} prompt="What's your greatest professional strength?" promptLabel="Behavioral Question" />}
      <TopBanner backTo="/queue" title="Eye Lock" center={<span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 12, fontSize: 15, fontWeight: 800 }}>0:{time.toString().padStart(2, '0')}</span>} right={<span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700 }}><Zap size={14} /> {gazePercent}%</span>} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 40px' }}>
          <div style={{ width: '100%', maxWidth: 640, marginBottom: 10, boxShadow: `0 0 0 4px ${glowColor}, 0 4px 20px rgba(194,143,231,0.08)`, borderRadius: 20, transition: 'box-shadow 0.3s ease' }}>
            <CameraFeed
              style={{ height: 300 }}
              withAudio={true}
              onStream={handleStream}
              overlay={
                <motion.div animate={{ scale: [1, 1.2, 1], boxShadow: isLocked ? ['0 0 0 6px rgba(88,204,2,0.3)', '0 0 0 12px rgba(88,204,2,0.1)', '0 0 0 6px rgba(88,204,2,0.3)'] : ['0 0 0 6px rgba(255,75,75,0.3)', '0 0 0 12px rgba(255,75,75,0.1)', '0 0 0 6px rgba(255,75,75,0.3)'] }} transition={{ repeat: Infinity, duration: 3 }} style={{ position: 'absolute', top: 20, right: 20, width: 28, height: 28, borderRadius: '50%', background: isLocked ? 'var(--green)' : 'var(--red)' }} />
              }
            />
          </div>
          <div className="card" style={{ width: '100%', maxWidth: 600, textAlign: 'center', padding: '18px 28px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', marginBottom: 6 }}>Behavioral Question</div>
            <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4 }}>What's your greatest professional strength?</div>
          </div>
          <AudioWave />
        </div>
      </div>
      <BottomBanner left={<div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>{isLocked ? 'Great eye contact! Stay locked in.' : 'Look at the camera!'}</div>} center={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><motion.div key={gazePercent} initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }} style={{ fontSize: 22, fontWeight: 800, color: isLocked ? '#58CC02' : '#FF4B4B' }}>{gazePercent}% Locked</motion.div><div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Gaze Score</div></div>} right={<><Lock size={16} /> {isLocked ? 'Locked' : 'Look up!'}</>} />
    </div>
  )
}
