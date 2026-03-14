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

const QUALITY_COLORS = { good: '#58CC02', weak: '#F5A623', lost: '#FF4B4B' }

export default function EyeLock() {
  const nav = useNavigate()
  const [time, setTime] = useState(45)
  const [ready, setReady] = useState(false)

  const eye = useEyeContact()

  const onReady = useCallback(async () => {
    await eye.init()
    setReady(true)
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

  // Timer
  useEffect(() => {
    if (!ready) return
    const t = setInterval(() => setTime(p => {
      if (p <= 1) {
        clearInterval(t)
        eye.stopTracking()
        nav('/score/eyelock')
        return 0
      }
      return p - 1
    }), 1000)
    return () => clearInterval(t)
  }, [nav, ready, eye.stopTracking])

  const color = QUALITY_COLORS[eye.quality]
  const mins = Math.floor(time / 60)
  const secs = time % 60

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {!ready && <GraceCountdown onReady={onReady} prompt="What's your greatest professional strength?" promptLabel="Behavioral Question" />}

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
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700 }}>
            <Zap size={14} /> Best: {eye.longestStreak}s
          </span>
        }
      />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 40px' }}>

          {/* Camera with eye contact measurement overlay */}
          <div style={{
            width: '100%', maxWidth: 640, marginBottom: 12,
            boxShadow: `0 0 0 3px ${color}50, 0 4px 24px rgba(0,0,0,0.15)`,
            borderRadius: 20,
            transition: 'box-shadow 0.5s ease',
          }}>
            <CameraFeed
              style={{ height: 360 }}
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
