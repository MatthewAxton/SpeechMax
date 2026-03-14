import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Lock } from 'lucide-react'
import { TopBanner, BottomBanner } from '../components/Banner'
import { AudioWave } from '../components/AudioWave'
import { GraceCountdown } from '../components/GraceCountdown'
import { CameraFeed } from '../components/CameraFeed'
import { EyeContactIndicator } from '../components/EyeContactIndicator'
import { useEyeContact } from '../../analysis/hooks/useEyeContact'

export default function EyeLock() {
  const nav = useNavigate()
  const [time, setTime] = useState(45)
  const [ready, setReady] = useState(false)

  const {
    goodEyeContact, eyeContactScore, sessionPercent,
    currentStreak, longestStreak, modelReady,
    init, startTracking, stopTracking,
  } = useEyeContact()

  // Init model during countdown
  const onReady = useCallback(async () => {
    await init()
    setReady(true)
  }, [init])

  // Start tracking once video stream is available
  const handleStream = useCallback(() => {
    if (!modelReady) return
    // Small delay to let video element mount and start playing
    setTimeout(() => {
      const video = document.querySelector('video') as HTMLVideoElement | null
      if (video) startTracking(video)
    }, 600)
  }, [modelReady, startTracking])

  // Retry starting when model finishes loading after stream
  useEffect(() => {
    if (!ready || !modelReady) return
    const t = setTimeout(() => {
      const video = document.querySelector('video') as HTMLVideoElement | null
      if (video) startTracking(video)
    }, 600)
    return () => clearTimeout(t)
  }, [ready, modelReady, startTracking])

  // Timer
  useEffect(() => {
    if (!ready) return
    const t = setInterval(() => setTime(p => {
      if (p <= 1) {
        clearInterval(t)
        stopTracking()
        nav('/score/eyelock')
        return 0
      }
      return p - 1
    }), 1000)
    return () => clearInterval(t)
  }, [nav, ready, stopTracking])

  const glowColor = goodEyeContact ? 'rgba(88,204,2,0.35)' : 'rgba(255,75,75,0.25)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {!ready && <GraceCountdown onReady={onReady} prompt="What's your greatest professional strength?" promptLabel="Behavioral Question" />}

      <TopBanner
        backTo="/queue"
        title="Eye Lock"
        center={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 12, fontSize: 15, fontWeight: 800 }}>
              0:{time.toString().padStart(2, '0')}
            </span>
            <span style={{
              background: goodEyeContact ? 'rgba(88,204,2,0.3)' : 'rgba(255,75,75,0.3)',
              padding: '4px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              transition: 'background 0.3s',
            }}>
              {sessionPercent}%
            </span>
          </div>
        }
        right={
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700 }}>
            <Zap size={14} /> Best: {longestStreak}s
          </span>
        }
      />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 40px' }}>

          {/* Camera with eye contact overlay */}
          <div style={{
            width: '100%', maxWidth: 640, marginBottom: 12,
            boxShadow: `0 0 0 4px ${glowColor}, 0 4px 24px rgba(194,143,231,0.08)`,
            borderRadius: 20,
            transition: 'box-shadow 0.3s ease',
          }}>
            <CameraFeed
              style={{ height: 340 }}
              withAudio={true}
              onStream={handleStream}
              overlay={
                <EyeContactIndicator
                  goodEyeContact={goodEyeContact}
                  eyeContactScore={eyeContactScore}
                  sessionPercent={sessionPercent}
                  currentStreak={currentStreak}
                />
              }
            />
          </div>

          {/* Question card */}
          <div className="card" style={{ width: '100%', maxWidth: 600, textAlign: 'center', padding: '18px 28px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', marginBottom: 6 }}>Behavioral Question</div>
            <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4 }}>What's your greatest professional strength?</div>
          </div>

          <AudioWave />
        </div>
      </div>

      <BottomBanner
        left={
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>
            {goodEyeContact ? 'Great eye contact! Stay locked in.' : 'Look at the target above ↑'}
          </div>
        }
        center={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <motion.div
              key={sessionPercent}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              style={{ fontSize: 22, fontWeight: 800, color: goodEyeContact ? '#58CC02' : '#FF4B4B' }}
            >
              {sessionPercent}% Locked
            </motion.div>
            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Gaze Score
            </div>
          </div>
        }
        right={<><Lock size={16} /> {goodEyeContact ? 'Locked' : 'Look up!'}</>}
      />
    </div>
  )
}
