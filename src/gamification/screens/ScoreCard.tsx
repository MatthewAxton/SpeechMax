import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { TrendingUp, AlertCircle, CheckCircle, Clock, Eye, Lock, EyeOff, Waves, Minus, Activity, Shield } from 'lucide-react'
import { TopBanner } from '../components/Banner'
import { useGameStore } from '../../store/gameStore'
import type { GameType } from '../../analysis/types'
import { useRequireScan } from '../hooks/useRequireScan'

const GAME_KEY_MAP: Record<string, GameType> = {
  filler: 'filler-ninja', eyelock: 'eye-lock', pace: 'pace-racer', pitch: 'pitch-surfer', statue: 'statue-mode',
}

const GAME_PATH_MAP: Record<GameType, string> = {
  'filler-ninja': '/filler-ninja', 'eye-lock': '/eye-lock', 'pace-racer': '/pace-racer', 'pitch-surfer': '/pitch-surfer', 'statue-mode': '/statue-mode',
}

interface GameConfig {
  title: string
  axis: string
  icon: typeof AlertCircle
  replay: string
}

const gameConfigs: Record<string, GameConfig> = {
  filler: { title: 'Filler Ninja', axis: 'Clarity', icon: AlertCircle, replay: '/filler-ninja' },
  eyelock: { title: 'Eye Lock', axis: 'Confidence', icon: Eye, replay: '/eye-lock' },
  pitch: { title: 'Pitch Surfer', axis: 'Expression', icon: Waves, replay: '/pitch-surfer' },
  pace: { title: 'Pace Racer', axis: 'Pacing', icon: Activity, replay: '/pace-racer' },
  statue: { title: 'Statue Mode', axis: 'Composure', icon: Shield, replay: '/statue-mode' },
}

function getMessage(score: number, axis: string): string {
  if (score >= 85) return `Outstanding ${axis.toLowerCase()}! You're a natural.`
  if (score >= 70) return `Great ${axis.toLowerCase()}! Real progress showing.`
  if (score >= 50) return `Good effort! Your ${axis.toLowerCase()} is improving.`
  return `Keep practicing — your ${axis.toLowerCase()} will improve!`
}

function getStats(game: string, metrics: Record<string, number>) {
  switch (game) {
    case 'filler':
      return [
        { icon: AlertCircle, label: 'Filler words detected', value: String(metrics.fillerCount ?? 0) },
        { icon: CheckCircle, label: 'Best filler-free streak', value: `${metrics.longestStreakSeconds ?? 0}s`, green: true },
        { icon: Clock, label: 'Duration', value: `${metrics.durationSeconds ?? 90}s` },
      ]
    case 'eyelock':
      return [
        { icon: Eye, label: 'Eye contact %', value: `${Math.round(metrics.gazeLockedPercent ?? 0)}%` },
        { icon: Lock, label: 'Longest gaze streak', value: `${metrics.longestGazeSeconds ?? 0}s`, green: true },
        { icon: EyeOff, label: 'Look-aways', value: `${100 - Math.round(metrics.gazeLockedPercent ?? 0)}%` },
      ]
    case 'pace':
      return [
        { icon: Activity, label: 'Average WPM', value: String(Math.round(metrics.avgWpm ?? 0)) },
        { icon: CheckCircle, label: 'Time in zone', value: `${metrics.timeInZoneSeconds ?? 0}s`, green: true },
        { icon: Clock, label: 'Time outside zone', value: `${(metrics.totalSeconds ?? 60) - (metrics.timeInZoneSeconds ?? 0)}s` },
      ]
    case 'pitch':
      return [
        { icon: Waves, label: 'Pitch variation', value: `${Math.round(metrics.pitchVariation ?? 0)} Hz` },
        { icon: TrendingUp, label: 'Variation quality', value: (metrics.pitchVariation ?? 0) > 30 ? 'High' : (metrics.pitchVariation ?? 0) > 15 ? 'Good' : 'Low', green: (metrics.pitchVariation ?? 0) > 15 },
        { icon: Minus, label: 'Monotone time', value: `${metrics.monotoneSeconds ?? 0}s` },
      ]
    case 'statue':
      return [
        { icon: Shield, label: 'Composure score', value: `${Math.round(metrics.stillnessPercent ?? 0)}%` },
        { icon: CheckCircle, label: 'Stability', value: (metrics.movementAlerts ?? 0) <= 3 ? 'Good' : 'Needs work', green: (metrics.movementAlerts ?? 0) <= 3 },
        { icon: AlertCircle, label: 'Movement alerts', value: String(Math.round(metrics.movementAlerts ?? 0)) },
      ]
    default:
      return []
  }
}

export default function ScoreCard() {
  const hasScans = useRequireScan()
  const { game } = useParams<{ game: string }>()
  const nav = useNavigate()
  const config = gameConfigs[game || 'filler']
  const gameType = GAME_KEY_MAP[game || 'filler']

  if (!hasScans) return null
  const gameHistory = useGameStore((s) => s.gameHistory)
  const getRecommendedGameOrder = useGameStore((s) => s.getRecommendedGameOrder)

  // Get results for this game type
  const gameResults = gameHistory.filter((r) => r.gameType === gameType)
  const lastResult = gameResults.length > 0 ? gameResults[gameResults.length - 1] : undefined
  const prevResult = gameResults.length > 1 ? gameResults[gameResults.length - 2] : undefined

  const currentScore = lastResult?.score ?? 0
  const prevScore = prevResult?.score ?? 0
  const improvement = currentScore - prevScore
  const metrics = lastResult?.metrics ?? {}
  const stats = getStats(game || 'filler', metrics)
  const message = getMessage(currentScore, config.axis)

  // Compute next game from recommended order
  const recommendedOrder = getRecommendedGameOrder()
  const currentIdx = recommendedOrder.indexOf(gameType)
  const nextGameType = currentIdx >= 0 && currentIdx < recommendedOrder.length - 1
    ? recommendedOrder[currentIdx + 1]
    : null
  const nextPath = nextGameType
    ? GAME_PATH_MAP[nextGameType]
    : '/progress'

  const [showConfetti, setShowConfetti] = useState(true)

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
      <TopBanner backTo="/queue" title="Session Complete" right={<span style={{ fontSize: 13, opacity: 0.8 }}>{config.title} · {config.axis}</span>} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 40px' }}>
          <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 8, stiffness: 150, delay: 0.5 }} style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, background: 'linear-gradient(135deg, #C28FE7, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{currentScore}</motion.div>
          <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600, margin: '4px 0 6px' }}>
            {prevResult ? `was ${prevScore} → now ${currentScore}` : `Score: ${currentScore}`}
          </div>
          {improvement !== 0 && prevResult && (
            <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.7 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: improvement > 0 ? 'rgba(74,222,128,0.15)' : 'rgba(255,75,75,0.1)', color: improvement > 0 ? 'var(--green)' : 'var(--red)', fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 10, marginBottom: 16 }}><TrendingUp size={13} /> {improvement > 0 ? '+' : ''}{improvement} {improvement > 0 ? 'improvement' : 'change'}</motion.div>
          )}
          {!prevResult && <div style={{ marginBottom: 16 }} />}
          <div style={{ width: '100%', maxWidth: 480, marginBottom: 16 }}>
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 + i*0.15 }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: i < stats.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <s.icon size={16} color={s.green ? 'var(--green)' : 'var(--muted)'} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{s.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: s.green ? 'var(--green)' : 'var(--text)' }}>{s.value}</span>
              </motion.div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 480 }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => nav(nextPath)}>{nextGameType ? 'Next Game' : 'View Progress'}</button>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => nav(config.replay)}>Play Again</button>
          </div>
          <div style={{ marginTop: 12 }}><button className="btn-secondary" style={{ height: 36, fontSize: 13, padding: '0 20px' }} onClick={() => nav('/queue')}>Back to Dashboard</button></div>
        </div>
      </div>
    </div>
  )
}
