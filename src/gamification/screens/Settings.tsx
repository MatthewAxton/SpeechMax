import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TopBanner } from '../components/Banner'
import { TalkingBubble } from '../components/Mike'
import { useSessionStore } from '../../store/sessionStore'
import { useScanStore } from '../../store/scanStore'
import { useGameStore } from '../../store/gameStore'
import { isSoundEnabled, setSoundEnabled } from '../../lib/sounds'

type DeviceInfo = { deviceId: string; label: string }

export default function Settings() {
  const preferredCamera = useSessionStore((s) => s.preferredCamera)
  const preferredMic = useSessionStore((s) => s.preferredMic)
  const setPreferredCamera = useSessionStore((s) => s.setPreferredCamera)
  const setPreferredMic = useSessionStore((s) => s.setPreferredMic)
  const resetProgress = useSessionStore((s) => s.resetProgress)
  const getLatestScores = useScanStore((s) => s.getLatestScores)
  const getDifficultyFor = useGameStore((s) => s.getDifficultyFor)

  const [soundOn, setSoundOn] = useState(isSoundEnabled())
  const [cameras, setCameras] = useState<DeviceInfo[]>([])
  const [mics, setMics] = useState<DeviceInfo[]>([])

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setCameras(devices.filter((d) => d.kind === 'videoinput').map((d) => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 6)}` })))
      setMics(devices.filter((d) => d.kind === 'audioinput').map((d) => ({ deviceId: d.deviceId, label: d.label || `Mic ${d.deviceId.slice(0, 6)}` })))
    })
  }, [])

  const latestScores = getLatestScores()
  const avgScore = latestScores ? Math.round(latestScores.overall) : 0
  const userLevel = avgScore <= 30 ? 'Beginner' : avgScore <= 55 ? 'Intermediate' : 'Advanced'

  const axes = [
    { name: 'Clarity', game: 'filler-ninja' as const },
    { name: 'Confidence', game: 'eye-lock' as const },
    { name: 'Pacing', game: 'pace-racer' as const },
    { name: 'Expression', game: 'pitch-surfer' as const },
    { name: 'Composure', game: 'statue-mode' as const },
  ]

  const handleReset = () => {
    if (window.confirm('Are you sure? This will erase all your progress, scores, and settings.')) {
      resetProgress()
    }
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBanner backTo="/queue" title="Settings" />
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 32px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Mascot header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}
          >
            <img src="/IDLE.gif" alt="Mike" style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid rgba(194,143,231,0.3)', flexShrink: 0 }} />
            <div style={{
              background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
              padding: '12px 18px', flex: 1,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                <TalkingBubble text="Configure your devices and preferences here!" />
              </div>
            </div>
          </motion.div>

          {/* Devices */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Devices</div>

            <div style={rowStyle}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Camera</span>
              <select
                value={preferredCamera ?? ''}
                onChange={(e) => setPreferredCamera(e.target.value || null)}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 12px', color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'inherit' }}
              >
                <option value="">Default</option>
                {cameras.map((c) => <option key={c.deviceId} value={c.deviceId}>{c.label}</option>)}
              </select>
            </div>

            <div style={rowStyle}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Microphone</span>
              <select
                value={preferredMic ?? ''}
                onChange={(e) => setPreferredMic(e.target.value || null)}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 12px', color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'inherit' }}
              >
                <option value="">Default</option>
                {mics.map((m) => <option key={m.deviceId} value={m.deviceId}>{m.label}</option>)}
              </select>
            </div>

            <div style={{ ...rowStyle, borderBottom: 'none' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Sound Effects</span>
              <button
                onClick={() => { const next = !soundOn; setSoundOn(next); setSoundEnabled(next) }}
                style={{
                  width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: soundOn ? 'var(--purple)' : 'rgba(255,255,255,0.15)',
                  position: 'relative', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 10, background: 'white',
                  position: 'absolute', top: 3,
                  left: soundOn ? 25 : 3, transition: 'left 0.2s',
                }} />
              </button>
            </div>
          </motion.div>

          {/* User Level */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Your Level</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--purple)' }}>{userLevel}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Based on overall score of {avgScore}</div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>Per-Axis Difficulty</div>
            {axes.map((a) => {
              const diff = getDifficultyFor(a.game)
              const color = diff === 'easy' ? '#58CC02' : diff === 'medium' ? '#FCD34D' : '#FF4B4B'
              return (
                <div key={a.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color, background: `${color}15`, padding: '3px 10px', borderRadius: 8 }}>{diff}</span>
                </div>
              )
            })}
          </motion.div>

          {/* Danger Zone */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ background: 'rgba(255,75,75,0.04)', border: '1px solid rgba(255,75,75,0.15)', borderRadius: 20, padding: '20px 24px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#FF4B4B' }}>Danger Zone</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>This will permanently erase all your progress, scores, and settings.</div>
            <button onClick={handleReset} style={{ background: '#FF4B4B', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Reset All Progress
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
