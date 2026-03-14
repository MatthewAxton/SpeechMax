import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Flame, Crosshair, Eye, Activity, Waves, Shield, Award, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { TopBanner } from '../components/Banner'
import { RadarChart } from '../components/radar-chart'
import { useScanStore } from '../../store/scanStore'
import { useGameStore } from '../../store/gameStore'
import { useSessionStore } from '../../store/sessionStore'
import type { GameType } from '../../analysis/types'
import { useRequireScan } from '../hooks/useRequireScan'
import BADGES from '../../lib/badges'

const GAME_META: Record<GameType, { name: string; icon: LucideIcon; axis: string; time: string; desc: string; path: string }> = {
  'filler-ninja': { name: 'Filler Ninja', icon: Crosshair, axis: 'Clarity', time: '90s', desc: 'Speak without filler words. Every "um" and "like" gets slashed!', path: '/filler-ninja' },
  'eye-lock': { name: 'Eye Lock', icon: Eye, axis: 'Confidence', time: '45s', desc: 'Keep your gaze locked on the camera. Look away and the screen dims.', path: '/eye-lock' },
  'pace-racer': { name: 'Pace Racer', icon: Activity, axis: 'Pacing', time: '60s', desc: 'Stay in the WPM zone. Not too fast, not too slow — find your rhythm.', path: '/pace-racer' },
  'pitch-surfer': { name: 'Pitch Surfer', icon: Waves, axis: 'Expression', time: '30s', desc: 'Surf the wave with your voice. Vary your pitch to keep it alive!', path: '/pitch-surfer' },
  'statue-mode': { name: 'Statue Mode', icon: Shield, axis: 'Composure', time: '45s', desc: 'Speak while staying perfectly still. Movement gets tracked!', path: '/statue-mode' },
}
const AXIS_MAP: Record<GameType, 'clarity' | 'confidence' | 'pacing' | 'expression' | 'composure'> = {
  'filler-ninja': 'clarity', 'eye-lock': 'confidence', 'pace-racer': 'pacing', 'pitch-surfer': 'expression', 'statue-mode': 'composure',
}

export default function GameQueue() {
  const hasScans = useRequireScan()
  const nav = useNavigate()
  const getLatestScores = useScanStore((s) => s.getLatestScores)
  const getRecommendedGameOrder = useGameStore((s) => s.getRecommendedGameOrder)
  const getBestResult = useGameStore((s) => s.getBestResult)
  const streakDays = useSessionStore((s) => s.streakDays)
  const earnedBadges = useSessionStore((s) => s.earnedBadges)

  const latestScores = getLatestScores()
  if (!hasScans) return null
  const scores = latestScores ?? { clarity: 42, confidence: 58, pacing: 61, expression: 70, composure: 74, overall: 67 }
  const gameOrder = getRecommendedGameOrder()

  // Show up to 5 most recently earned badges
  const earnedList = BADGES.filter(b => earnedBadges.has(b.id))
  const topBadges = earnedList.slice(-5)

  const games = gameOrder.map((gameType, i) => {
    const meta = GAME_META[gameType]
    const axisKey = AXIS_MAP[gameType]
    const best = getBestResult(gameType)
    return { ...meta, gameType, score: Math.round(scores[axisKey]), bestScore: best?.score, priority: i === 0 }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBanner title={<>Speech<span style={{ color: 'var(--purple)' }}>MAX</span></>} showBack={false}
        right={<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}><Flame size={14} /> {streakDays || 1}</span>
          <button className="btn-secondary" style={{ height: 32, fontSize: 12, padding: '0 12px' }} onClick={() => nav('/progress')}>Progress</button>
          <button className="btn-secondary" style={{ height: 32, fontSize: 12, padding: '0 12px' }} onClick={() => nav('/scan')}>Rescan</button>
        </div>}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '16px 24px', gap: 24 }}>
        {/* LEFT — Radar + Score */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: 340, flexShrink: 0, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <RadarChart
            scores={{ clarity: scores.clarity, confidence: scores.confidence, pacing: scores.pacing, expression: scores.expression, composure: scores.composure }}
            size={280}
            animated={false}
          />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }} style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, marginTop: 8, background: 'linear-gradient(135deg, #C28FE7, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{Math.round(scores.overall)}</motion.div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginTop: 4 }}>Your Score</div>
        </motion.div>

        {/* RIGHT — Badges + Game Library */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Top Awards */}
          {topBadges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '12px 16px' }}
            >
              <Award size={18} color="var(--purple)" style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                {topBadges.map(b => (
                  <div key={b.id} title={`${b.name}: ${b.description}`} style={{ background: 'rgba(194,143,231,0.12)', border: '1px solid rgba(194,143,231,0.25)', borderRadius: 10, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: 'var(--purple)', whiteSpace: 'nowrap' }}>{b.name}</div>
                ))}
              </div>
              <div onClick={() => nav('/progress')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'var(--muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {earnedList.length}/{BADGES.length} <ChevronRight size={14} />
              </div>
            </motion.div>
          )}

          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Training Games</div>
          {games.map((g, i) => (
            <motion.div key={g.name}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
              onClick={() => nav(g.path)}
              whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(194,143,231,0.15)' }}
              whileTap={{ scale: 0.99 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 20,
                background: g.priority ? 'rgba(194,143,231,0.08)' : 'rgba(255,255,255,0.04)',
                border: g.priority ? '2px solid rgba(194,143,231,0.3)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, padding: '20px 24px',
                cursor: 'pointer', position: 'relative',
                transition: 'all 0.2s',
              }}
            >
              {g.priority && <div style={{ position: 'absolute', top: -8, right: 16, background: 'var(--purple)', color: 'white', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Recommended</div>}

              {/* Game icon */}
              <div style={{ width: 56, height: 56, borderRadius: 16, background: g.priority ? 'rgba(194,143,231,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <g.icon size={26} color="var(--purple)" />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{g.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--purple)', background: 'rgba(194,143,231,0.1)', padding: '2px 8px', borderRadius: 6 }}>{g.axis}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>{g.time}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, lineHeight: 1.4 }}>{g.desc}</div>
              </div>

              {/* Score */}
              <div style={{ textAlign: 'center', flexShrink: 0, width: 80 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: g.score >= 70 ? '#58CC02' : g.score >= 40 ? '#FCD34D' : '#FF4B4B' }}>{g.score}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Axis Score</div>
                {g.bestScore != null && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--purple)', marginTop: 2 }}>Best: {g.bestScore}</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
