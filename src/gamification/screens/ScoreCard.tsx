import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { TrendingUp, AlertCircle, CheckCircle, Clock, Eye, Lock, EyeOff, Waves, Minus, ArrowRight, Activity, Shield } from 'lucide-react'
import { TopBanner, BottomBanner } from '../components/Banner'
import { MikeWithBubble } from '../components/Mike'
import { useGameStore } from '../../store/gameStore'
import { useSessionStore } from '../../store/sessionStore'
import type { GameType } from '../../analysis/types'

const GAME_KEY_MAP: Record<string, GameType> = {
  filler: 'filler-ninja', eyelock: 'eye-lock', pace: 'pace-racer', pitch: 'pitch-surfer', statue: 'statue-mode',
}

const data: Record<string, { title: string; axis: string; score: number; prev: number; icon: any; message: string; stats: { icon: any; label: string; value: string; green?: boolean }[]; next: string; replay: string }> = {
  filler: { title: 'Filler Ninja', axis: 'Clarity', score: 78, prev: 42, icon: AlertCircle, message: "36 points in one session. That's real progress!", stats: [{ icon: AlertCircle, label: 'Filler words detected', value: '2' }, { icon: CheckCircle, label: 'Clean streaks', value: '3', green: true }, { icon: Clock, label: 'Best filler-free streak', value: '23s' }], next: '/countdown?next=/eye-lock', replay: '/countdown?next=/filler-ninja' },
  eyelock: { title: 'Eye Lock', axis: 'Confidence', score: 87, prev: 58, icon: Eye, message: "87%! Your eye contact is getting rock solid.", stats: [{ icon: Eye, label: 'Time on camera', value: '87%' }, { icon: Lock, label: 'Longest gaze streak', value: '23 seconds', green: true }, { icon: EyeOff, label: 'Look-aways', value: '3' }], next: '/countdown?next=/pace-racer', replay: '/countdown?next=/eye-lock' },
  pitch: { title: 'Pitch Surfer', axis: 'Expression', score: 74, prev: 70, icon: Waves, message: "Nice waves! Your voice is getting more dynamic.", stats: [{ icon: Waves, label: 'Pitch range', value: '85–240 Hz' }, { icon: TrendingUp, label: 'Variation score', value: 'Good', green: true }, { icon: Minus, label: 'Monotone stretches', value: '2' }], next: '/countdown?next=/statue-mode', replay: '/countdown?next=/pitch-surfer' },
  pace: { title: 'Pace Racer', axis: 'Pacing', score: 72, prev: 61, icon: Activity, message: "Great rhythm! You stayed in the zone most of the time.", stats: [{ icon: Activity, label: 'Average WPM', value: '138' }, { icon: CheckCircle, label: 'Time in zone', value: '42s', green: true }, { icon: Clock, label: 'Time outside zone', value: '18s' }], next: '/countdown?next=/pitch-surfer', replay: '/countdown?next=/pace-racer' },
  statue: { title: 'Statue Mode', axis: 'Composure', score: 82, prev: 74, icon: Shield, message: "Rock solid! Your composure is really improving.", stats: [{ icon: Shield, label: 'Composure score', value: '82%' }, { icon: CheckCircle, label: 'Stable regions', value: '4/5', green: true }, { icon: AlertCircle, label: 'Movement alerts', value: '2' }], next: '/queue', replay: '/countdown?next=/statue-mode' },
}

export default function ScoreCard() {
  const { game } = useParams<{ game: string }>()
  const nav = useNavigate()
  const d = data[game || 'filler']

  // Store integration
  const gameType = GAME_KEY_MAP[game || 'filler']
  const getLastResult = useGameStore((s) => s.getLastResult)
  const recordGame = useSessionStore((s) => s.recordGame)
  const checkBadges = useSessionStore((s) => s.checkBadges)

  const lastResult = getLastResult(gameType)
  const currentScore = lastResult?.score ?? d.score
  const prevScore = d.prev
  const improvement = currentScore - prevScore

  // Record the game on mount
  useEffect(() => {
    if (gameType) {
      recordGame(gameType)
      checkBadges()
    }
  }, [gameType, recordGame, checkBadges])

  const [showConfetti, setShowConfetti] = useState(true)

  // Generate confetti particles once
  const [confettiParticles] = useState(() =>
    Array.from({ length: 30 }, () => ({
      x: (Math.random() - 0.5) * 600,
      y: -(200 + Math.random() * 300),
      rotation: Math.random() * 360,
      size: 6 + Math.random() * 8,
      color: ['#C28FE7', '#8B5CF6', '#A855F7', '#58CC02', '#FCD34D', '#FB923C'][Math.floor(Math.random() * 6)],
      delay: Math.random() * 0.3,
    }))
  )

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 2500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <AnimatePresence>
        {showConfetti && confettiParticles.map((p, i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: p.x, y: p.y, rotate: p.rotation, opacity: 0 }}
            transition={{ duration: 1.8, delay: p.delay, ease: 'easeOut' }}
            style={{
              position: 'fixed', top: '30%', left: '50%',
              width: p.size, height: p.size,
              borderRadius: p.size > 10 ? 2 : '50%',
              background: p.color,
              zIndex: 200, pointerEvents: 'none',
            }}
          />
        ))}
      </AnimatePresence>
      <TopBanner backTo="/queue" title="Session Complete" right={<span style={{ fontSize: 13, opacity: 0.8 }}>{d.title} · {d.axis}</span>} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 40px' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 0.5, damping: 10, stiffness: 200 }}
          >
            <MikeWithBubble text={d.message} state="talking" size={90} delay={1.5} />
          </motion.div>
          <div style={{ height: 8 }} />
          <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 8, stiffness: 150, delay: 0.5 }} style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, background: 'linear-gradient(135deg, #C28FE7, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{currentScore}</motion.div>
          <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600, margin: '4px 0 6px' }}>was {prevScore} → now {currentScore}</div>
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.7 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#E8F9D4', color: 'var(--green)', fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 10, marginBottom: 16 }}><TrendingUp size={13} /> +{improvement} improvement</motion.div>
          <div style={{ width: '100%', maxWidth: 480, marginBottom: 16 }}>
            {d.stats.map((s, i) => (
              <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 + i*0.15 }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: i < d.stats.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <s.icon size={16} color={s.green ? 'var(--green)' : 'var(--muted)'} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{s.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: s.green ? 'var(--green)' : 'var(--text)' }}>{s.value}</span>
              </motion.div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 480 }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => nav(d.next)}>Next Game</button>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => nav(d.replay)}>Play Again</button>
          </div>
          <div style={{ marginTop: 12 }}><span onClick={() => nav('/queue')} style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Back to dashboard</span></div>
        </div>
      </div>
      <BottomBanner left={<div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>{d.message}</div>} center={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ fontSize: 22, fontWeight: 800 }}>+{improvement}</div><div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>{d.axis} Improvement</div></div>} right={<><ArrowRight size={18} /> Next</>} />
    </div>
  )
}
