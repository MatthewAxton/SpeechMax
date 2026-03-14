import { motion } from 'framer-motion'
import { TopBanner } from '../components/Banner'
import { Sparkline } from '../components/Sparkline'
import { TalkingBubble } from '../components/Mike'
import { RadarOverlay } from '../components/radar-chart/RadarOverlay'
import { useScanStore } from '../../store/scanStore'
import { useGameStore } from '../../store/gameStore'
import { generateInsights } from '../../lib/insightGenerator'
import { filterByWeek } from '../../lib/dateUtils'
import type { ScanResult } from '../../analysis/types'

const AXIS_KEYS = ['clarity', 'confidence', 'pacing', 'expression', 'composure'] as const
const AXIS_NAMES = ['Clarity', 'Confidence', 'Pacing', 'Expression', 'Composure']
const AXIS_COLORS = ['#58CC02', '#3B82F6', '#FCD34D', '#FB923C', '#C28FE7']

function avgScores(scans: ScanResult[]) {
  const result: Record<string, number> = {}
  for (const key of AXIS_KEYS) {
    result[key] = scans.length > 0
      ? scans.reduce((sum, s) => sum + s.scores[key], 0) / scans.length
      : 0
  }
  return result
}

export default function Insights() {
  const scans = useScanStore((s) => s.scans)
  const gameHistory = useGameStore((s) => s.gameHistory)

  const insights = generateInsights(scans, gameHistory)

  const thisWeekScans = filterByWeek(scans, (s) => s.timestamp, 0)
  const lastWeekScans = filterByWeek(scans, (s) => s.timestamp, 1)

  const thisWeekAvg = avgScores(thisWeekScans)
  const lastWeekAvg = avgScores(lastWeekScans)

  const hasComparison = thisWeekScans.length > 0 && lastWeekScans.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBanner backTo="/queue" title="Weekly Insights" />
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
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
                <TalkingBubble text={scans.length >= 2
                  ? "Here's how your week is going! Keep practicing to see improvements."
                  : "Complete more scans to unlock weekly insights and comparisons!"
                } />
              </div>
            </div>
          </motion.div>

          <div style={{ display: 'flex', gap: 24 }}>
            {/* Left column — insights + sparklines */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {insights.map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 18, padding: '16px 20px',
                    fontSize: 14, fontWeight: 600, lineHeight: 1.6,
                  }}
                >
                  {text}
                </motion.div>
              ))}

              {/* Axis sparklines */}
              {scans.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 20, padding: '20px 24px',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 14 }}>Axis Trends</div>
                  {AXIS_KEYS.map((key, i) => {
                    const data = scans.map((s) => Math.round(s.scores[key]))
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, width: 90, color: AXIS_COLORS[i] }}>{AXIS_NAMES[i]}</span>
                        <Sparkline data={data} width={200} height={36} color={AXIS_COLORS[i]} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)', marginLeft: 'auto' }}>{data[data.length - 1]}</span>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </div>

            {/* Right column — radar overlay comparison */}
            {hasComparison && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  width: 360, flexShrink: 0,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 14 }}>This Week vs Last Week</div>
                <RadarOverlay
                  scores={{ clarity: thisWeekAvg.clarity, confidence: thisWeekAvg.confidence, pacing: thisWeekAvg.pacing, expression: thisWeekAvg.expression, composure: thisWeekAvg.composure }}
                  previousScores={{ clarity: lastWeekAvg.clarity, confidence: lastWeekAvg.confidence, pacing: lastWeekAvg.pacing, expression: lastWeekAvg.expression, composure: lastWeekAvg.composure }}
                  size={280}
                  animated={true}
                />
                <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 3, borderRadius: 2, background: '#C28FE7' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>This week</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>Last week</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
