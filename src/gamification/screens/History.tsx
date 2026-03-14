import { motion } from 'framer-motion'
import { Radar, Gamepad2 } from 'lucide-react'
import { TopBanner } from '../components/Banner'
import { Sparkline } from '../components/Sparkline'
import { TalkingBubble } from '../components/Mike'
import { useScanStore } from '../../store/scanStore'
import { useGameStore } from '../../store/gameStore'
import { formatRelativeTime } from '../../lib/dateUtils'

const GAME_NAMES: Record<string, string> = {
  'filler-ninja': 'Filler Ninja', 'eye-lock': 'Eye Lock',
  'pace-racer': 'Pace Racer', 'pitch-surfer': 'Pitch Surfer', 'statue-mode': 'Stage Presence',
}

type HistoryEntry = { type: 'scan'; timestamp: number; score: number; label: string }
  | { type: 'game'; timestamp: number; score: number; label: string }

export default function History() {
  const scans = useScanStore((s) => s.scans)
  const gameHistory = useGameStore((s) => s.gameHistory)

  const entries: HistoryEntry[] = [
    ...scans.map((s) => ({ type: 'scan' as const, timestamp: s.timestamp, score: Math.round(s.scores.overall), label: 'Radar Scan' })),
    ...gameHistory.map((g) => ({ type: 'game' as const, timestamp: g.timestamp, score: g.score, label: GAME_NAMES[g.gameType] || g.gameType })),
  ].sort((a, b) => b.timestamp - a.timestamp)

  const overallTrend = scans.map((s) => Math.round(s.scores.overall))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBanner backTo="/queue" title="History" />
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Mascot header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}
          >
            <img src="/IDLE.gif" alt="Mike" style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid rgba(194,143,231,0.3)', flexShrink: 0 }} />
            <div style={{
              background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
              padding: '12px 18px', flex: 1,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                <TalkingBubble text={entries.length > 0
                  ? `You've completed <strong style='color:#C28FE7'>${entries.length}</strong> sessions! Keep it up!`
                  : "No sessions yet. Complete a scan or game to see your history!"
                } />
              </div>
            </div>
          </motion.div>

          {/* Score trend */}
          {overallTrend.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, padding: '20px 24px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 24,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Overall Score Trend</div>
                <Sparkline data={overallTrend} width={300} height={56} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--purple)' }}>{overallTrend[overallTrend.length - 1]}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>Latest Score</div>
              </div>
            </motion.div>
          )}

          {entries.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)', fontSize: 15, fontWeight: 600 }}>
              No history yet. Complete a scan or game to see your timeline.
            </div>
          )}

          {/* Timeline entries */}
          <div style={{ display: 'grid', gap: 10 }}>
            {entries.map((entry, i) => (
              <motion.div
                key={`${entry.type}-${entry.timestamp}`}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.03 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16, padding: '16px 20px',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: entry.type === 'scan' ? 'rgba(194,143,231,0.12)' : 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {entry.type === 'scan' ? <Radar size={20} color="var(--purple)" /> : <Gamepad2 size={20} color="var(--muted)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{entry.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginTop: 2 }}>{formatRelativeTime(entry.timestamp)}</div>
                </div>
                <div style={{
                  fontSize: 24, fontWeight: 800,
                  color: entry.score >= 70 ? '#58CC02' : entry.score >= 40 ? '#FCD34D' : '#FF4B4B',
                }}>
                  {entry.score}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
