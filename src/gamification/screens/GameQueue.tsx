import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Crosshair, Eye, Activity, Waves, Shield, Flame, Play } from 'lucide-react'
import { TopBanner, BottomBanner } from '../components/Banner'
import { MikeWithBubble } from '../components/Mike'
import { RadarChart } from '../components/radar-chart'
import { useScanStore } from '../../store/scanStore'
import { useGameStore } from '../../store/gameStore'
import { useSessionStore } from '../../store/sessionStore'
import type { GameType } from '../../analysis/types'

const GAME_META: Record<GameType, { name: string; axis: string; time: string; icon: typeof Crosshair; path: string }> = {
  'filler-ninja': { name: 'Filler Ninja', axis: 'Clarity', time: '90s', icon: Crosshair, path: '/countdown?next=/filler-ninja' },
  'eye-lock': { name: 'Eye Lock', axis: 'Confidence', time: '45s', icon: Eye, path: '/countdown?next=/eye-lock' },
  'pace-racer': { name: 'Pace Racer', axis: 'Pacing', time: '60s', icon: Activity, path: '/countdown?next=/pace-racer' },
  'pitch-surfer': { name: 'Pitch Surfer', axis: 'Expression', time: '30s', icon: Waves, path: '/countdown?next=/pitch-surfer' },
  'statue-mode': { name: 'Statue Mode', axis: 'Composure', time: '45s', icon: Shield, path: '/countdown?next=/statue-mode' },
}
const AXIS_MAP: Record<GameType, 'clarity' | 'confidence' | 'pacing' | 'expression' | 'composure'> = {
  'filler-ninja': 'clarity', 'eye-lock': 'confidence', 'pace-racer': 'pacing', 'pitch-surfer': 'expression', 'statue-mode': 'composure',
}

export default function GameQueue() {
  const nav = useNavigate()
  const getLatestScores = useScanStore((s) => s.getLatestScores)
  const getRecommendedGameOrder = useGameStore((s) => s.getRecommendedGameOrder)
  const streakDays = useSessionStore((s) => s.streakDays)

  const latestScores = getLatestScores()
  const scores = latestScores ?? { clarity: 42, confidence: 58, pacing: 61, expression: 70, composure: 74, overall: 67 }
  const gameOrder = getRecommendedGameOrder()

  const games = gameOrder.map((gameType, i) => {
    const meta = GAME_META[gameType]
    const axisKey = AXIS_MAP[gameType]
    return { ...meta, gameType, score: Math.round(scores[axisKey]), priority: i === 0 }
  })

  const weakestName = games[0]?.axis ?? 'Clarity'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBanner title={<>Speech<span style={{ color: 'var(--purple)' }}>MAX</span></>} showBack={false} right={<span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}><Flame size={14} /> {streakDays || 1} Day Streak</span>} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '0 32px' }}>
        <div style={{ display: 'flex', gap: 24, width: '100%', maxWidth: 1200, alignItems: 'stretch' }}>

          {/* LEFT COLUMN — Mike + Score */}
          <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(194,143,231,0.12)', borderRadius: 24, padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 8px 32px rgba(194,143,231,0.1)' }}
            >
              <MikeWithBubble text={`Your biggest opportunity: <strong style='color:var(--purple)'>${weakestName}</strong>. Let's fix that first.`} size={90} delay={0.6} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(194,143,231,0.12)', borderRadius: 24, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, boxShadow: '0 8px 32px rgba(194,143,231,0.1)' }}
            >
              <RadarChart
                scores={{ clarity: scores.clarity, confidence: scores.confidence, pacing: scores.pacing, expression: scores.expression, composure: scores.composure }}
                size={200}
                animated={false}
              />
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.5 }} style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, marginTop: 4, background: 'linear-gradient(135deg, #C28FE7, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{Math.round(scores.overall)}</motion.div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginTop: 2 }}>Your Speech<span style={{ color: 'var(--purple)' }}>MAX</span> Score</div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN — Game Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ flex: 1, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(194,143,231,0.12)', borderRadius: 24, padding: '28px 28px', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(194,143,231,0.1)' }}
          >
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Game Dashboard</div>
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', marginBottom: 16 }}>Recommended For You</div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
              {games.map((g, i) => (
                <motion.div key={g.name}
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  onClick={() => nav(g.path)}
                  whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(194,143,231,0.18)' }}
                  whileTap={{ y: 1, boxShadow: 'none' }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    background: g.priority ? 'var(--surface)' : 'white',
                    border: '1px solid var(--border)',
                    borderBottom: g.priority ? '4px solid #9B6BC2' : '4px solid var(--border)',
                    borderLeft: g.priority ? '5px solid var(--purple)' : 'none',
                    borderRadius: 20, padding: '20px 24px',
                    cursor: 'pointer', position: 'relative',
                    transition: 'box-shadow 0.2s',
                    boxShadow: '0 4px 20px rgba(194,143,231,0.08)',
                  }}
                >
                  {g.priority && <div style={{ position: 'absolute', top: -8, right: 14, background: 'var(--purple)', color: 'white', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Start Here</div>}
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple)', flexShrink: 0 }}>
                    <g.icon size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{g.name}</div>
                    <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600 }}>{g.axis} · {g.time}</div>
                  </div>
                  <div style={{ width: 110, textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{g.score} / 100</div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${g.score}%` }} /></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>

      <BottomBanner
        left={<div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>Let's fix {weakestName} first.</div>}
        center={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ fontSize: 20, fontWeight: 800 }}>5 Games</div><div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Personalised training</div></div>}
        right={<><Play size={18} /> Start</>}
      />
    </div>
  )
}
