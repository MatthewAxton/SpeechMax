import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LogIn, LogOut, User } from 'lucide-react'
import { TopBanner } from '../components/Banner'
import { TalkingBubble } from '../components/Mike'
import { useSessionStore } from '../../store/sessionStore'
import { useScanStore } from '../../store/scanStore'
import { useGameStore } from '../../store/gameStore'
import { isSoundEnabled, setSoundEnabled } from '../../lib/sounds'
import { useAuth } from '../../lib/auth'

type DeviceInfo = { deviceId: string; label: string }

export default function Settings() {
  const { isAnonymous, displayName, avatarUrl, email, signInWithGoogle, signOut } = useAuth()

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
                <TalkingBubble text={isAnonymous ? "Sign in with Google to save your progress across devices!" : `Welcome back, ${displayName || 'coach'}!`} />
              </div>
            </div>
          </motion.div>

          {/* Account */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Account</div>

            {isAnonymous ? (
              /* Anonymous user — show sign-in prompt */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={22} color="rgba(255,255,255,0.4)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>Guest User</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>Your progress is saved locally. Sign in to sync across devices.</div>
                  </div>
                </div>
                <button
                  onClick={signInWithGoogle}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 14, padding: '12px 20px', cursor: 'pointer',
                    fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <LogIn size={16} />
                  Sign in with Google
                </button>
              </div>
            ) : (
              /* Authenticated user — show profile */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(194,143,231,0.3)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(194,143,231,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={22} color="#C28FE7" />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayName || 'SpeechMAX User'}
                    </div>
                    {email && (
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {email}
                      </div>
                    )}
                  </div>
                  <div style={{ background: 'rgba(88,204,2,0.12)', border: '1px solid rgba(88,204,2,0.25)', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#58CC02', flexShrink: 0 }}>
                    Synced
                  </div>
                </div>
                <button
                  onClick={signOut}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FF4B4B')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            )}
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
