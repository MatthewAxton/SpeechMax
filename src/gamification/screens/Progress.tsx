import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Flame, Target, Gamepad2, Trophy } from 'lucide-react'
import { TopBanner, BottomBanner } from '../components/Banner'
import { RadarChart } from '../components/radar-chart'
import { RadarOverlay } from '../components/radar-chart/RadarOverlay'
import { MikeWithBubble } from '../components/Mike'
import { useScanStore } from '../../store/scanStore'
import { useRequireScan } from '../hooks/useRequireScan'
import { useSessionStore } from '../../store/sessionStore'
import BADGES from '../../lib/badges'

export default function Progress() {
  const hasScans = useRequireScan()
  const nav = useNavigate()
  const getLatestScores = useScanStore((s) => s.getLatestScores)
  const getPreviousScores = useScanStore((s) => s.getPreviousScores)
  const latestScores = getLatestScores()
  const previousScores = getPreviousScores()

  if (!hasScans) return null
  const totalScans = useSessionStore((s) => s.totalScans)
  const totalGames = useSessionStore((s) => s.totalGames)
  const streakDays = useSessionStore((s) => s.streakDays)
  const personalBests = useSessionStore((s) => s.personalBests)
  const earnedBadges = useSessionStore((s) => s.earnedBadges)

  const stats = [
    { label: 'Total Scans', value: totalScans, icon: Target },
    { label: 'Total Games', value: totalGames, icon: Gamepad2 },
    { label: 'Day Streak', value: `${streakDays || 0} 🔥`, icon: Flame },
  ]

  const bests = [
    { label: 'Best Overall', value: personalBests.overallScore },
    { label: 'Best Clarity', value: personalBests.clarityScore },
    { label: 'Filler-Free Streak', value: `${personalBests.longestFillerFreeStreak}s` },
    { label: 'Highest Game Score', value: personalBests.highestGameScore },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBanner backTo="/queue" title="Your Progress" right={<span style={{ fontSize: 13, opacity: 0.8 }}>Keep going!</span>} />

      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          {/* Radar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-surface"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, marginBottom: 20 }}
          >
            {latestScores ? (
              previousScores ? (
                <RadarOverlay
                  scores={{ clarity: latestScores.clarity, confidence: latestScores.confidence, pacing: latestScores.pacing, expression: latestScores.expression, composure: latestScores.composure }}
                  previousScores={{ clarity: previousScores.clarity, confidence: previousScores.confidence, pacing: previousScores.pacing, expression: previousScores.expression, composure: previousScores.composure }}
                  size={300}
                  animated={true}
                />
              ) : (
                <RadarChart
                  scores={{ clarity: latestScores.clarity, confidence: latestScores.confidence, pacing: latestScores.pacing, expression: latestScores.expression, composure: latestScores.composure }}
                  size={300}
                  animated={true}
                />
              )
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No scans yet</div>
                <div style={{ fontSize: 14 }}>Complete your first scan to see your radar chart!</div>
              </div>
            )}
          </motion.div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="card-surface"
                style={{ textAlign: 'center', padding: 16 }}
              >
                <s.icon size={20} color="var(--purple)" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--purple)' }}>{s.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Personal Bests */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-surface"
            style={{ padding: 20, marginBottom: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Trophy size={18} color="var(--purple)" />
              <span style={{ fontSize: 15, fontWeight: 700 }}>Personal Bests</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {bests.map((b) => (
                <div key={b.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--purple)' }}>{b.value}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginTop: 2 }}>{b.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card-surface"
            style={{ padding: 20, marginBottom: 20 }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Badges</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {BADGES.map((badge) => {
                const earned = earnedBadges.has(badge.id)
                return (
                  <motion.div
                    key={badge.id}
                    whileHover={{ scale: 1.05 }}
                    style={{
                      textAlign: 'center', padding: 12, borderRadius: 16,
                      background: earned ? 'var(--surface)' : 'rgba(255,255,255,0.02)',
                      border: earned ? '1px solid var(--purple)' : '1px solid var(--border)',
                      opacity: earned ? 1 : 0.4,
                      filter: earned ? 'none' : 'grayscale(1)',
                      boxShadow: earned ? '0 0 12px rgba(194,143,231,0.2)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 28 }}>{badge.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: earned ? 'var(--text)' : 'var(--muted)' }}>{badge.name}</div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

        </div>
      </div>

      <BottomBanner
        left={<MikeWithBubble text="Keep practicing! Every session counts." size={36} delay={0.5} />}
        center={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ fontSize: 18, fontWeight: 800 }}>Progress</div></div>}
        right={<div style={{ display: 'flex', gap: 8 }}><button className="btn-secondary" style={{ height: 36, fontSize: 13, padding: '0 14px' }} onClick={() => nav('/queue')}>Games</button><button className="btn-primary" style={{ height: 36, fontSize: 13, padding: '0 14px' }} onClick={() => nav('/scan')}>Rescan</button></div>}
      />
    </div>
  )
}
