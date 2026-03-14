import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Crosshair, Eye, Activity, Waves, Shield, ArrowRight } from 'lucide-react'
import { TopBanner, BottomBanner } from '../components/Banner'
import { MikeWithBubble } from '../components/Mike'
import { RadarChart } from '../components/radar-chart'
import { useScanStore } from '../../store/scanStore'

const AXIS_ICONS = [Crosshair, Eye, Activity, Waves, Shield]
const AXIS_NAMES = ['Clarity', 'Confidence', 'Pacing', 'Expression', 'Composure']
const AXIS_KEYS = ['clarity', 'confidence', 'pacing', 'expression', 'composure'] as const
const AXIS_TIPS: Record<string, (score: number) => string> = {
  clarity: (s) => s >= 80 ? 'Excellent! Very few filler words.' : s >= 50 ? 'Some filler words detected. Try pausing instead.' : 'High filler word density. Replace fillers with pauses.',
  confidence: (s) => s >= 80 ? 'Strong eye contact and posture!' : s >= 50 ? 'Eye contact dropped in parts. Stay focused on camera.' : 'Eye contact and posture need work. Look at the camera more.',
  pacing: (s) => s >= 80 ? 'Great pace — clear and steady.' : s >= 50 ? 'Pace varied a bit. Try to stay in the 120-160 WPM zone.' : 'Pace was inconsistent. Practice speaking at a steady rhythm.',
  expression: (s) => s >= 80 ? 'Dynamic and expressive delivery!' : s >= 50 ? 'Good variation. Add more emphasis on key words.' : 'Delivery was flat. Vary your pitch to keep listeners engaged.',
  composure: (s) => s >= 80 ? 'Calm and composed throughout!' : s >= 50 ? 'Some fidgeting detected. Try keeping hands still.' : 'Lots of movement. Plant your feet and keep hands steady.',
}

function getGrade(overall: number): string {
  if (overall >= 90) return 'A+'
  if (overall >= 80) return 'A'
  if (overall >= 70) return 'B+'
  if (overall >= 60) return 'B'
  if (overall >= 50) return 'C+'
  if (overall >= 40) return 'C'
  return 'D'
}

export default function RadarResults() {
  const nav = useNavigate()
  const getLatestScores = useScanStore((s) => s.getLatestScores)
  const latestScores = getLatestScores()

  const scores = latestScores ?? { clarity: 42, confidence: 58, pacing: 61, expression: 70, composure: 74, overall: 67 }
  const overall = scores.overall
  const grade = getGrade(overall)

  // Find weakest axis for mascot message
  const weakest = AXIS_KEYS.reduce((min, key) => scores[key] < scores[min] ? key : min, AXIS_KEYS[0])
  const weakestName = AXIS_NAMES[AXIS_KEYS.indexOf(weakest)]

  const axes = AXIS_KEYS.map((key, i) => ({
    name: AXIS_NAMES[i],
    score: Math.round(scores[key]),
    icon: AXIS_ICONS[i],
    tip: AXIS_TIPS[key](scores[key]),
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBanner title={<>Speech<span style={{ color: 'var(--purple)' }}>MAX</span></>} showBack={false} right={<span style={{ fontSize: 13, opacity: 0.8 }}>Today, {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: 1060, display: 'flex', gap: 56, padding: '8px 48px', alignItems: 'center' }}>
          <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <MikeWithBubble text={`Here's your profile! Let's work on <strong style='color:var(--purple)'>${weakestName}</strong> first.`} state="talking" size={110} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '8px 0' }}>
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }} style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, background: 'linear-gradient(135deg, #C28FE7, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{Math.round(overall)}</motion.span>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Speech<span style={{ color: 'var(--purple)' }}>MAX</span> Score</div><div style={{ display: 'inline-block', background: 'var(--surface)', color: 'var(--purple)', fontSize: 20, fontWeight: 800, padding: '4px 16px', borderRadius: 12, marginTop: 4 }}>{grade}</div></div>
            </div>
            <RadarChart
              scores={{ clarity: scores.clarity, confidence: scores.confidence, pacing: scores.pacing, expression: scores.expression, composure: scores.composure }}
              size={320}
              animated={true}
            />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', marginBottom: 14 }}>Per-Axis Breakdown</div>
            {axes.map((a, i) => (
              <motion.div key={a.name} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 + i*0.15 }} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple)' }}><a.icon size={14} /></div>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{a.name}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--purple)' }}>{a.score}</span>
                </div>
                <div className="progress-track" style={{ marginBottom: 4 }}><motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${a.score}%` }} transition={{ duration: 1.2, delay: 0.5 + i*0.15 }} /></div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.tip}</div>
              </motion.div>
            ))}
            <button className="btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={() => nav('/queue')}>Start Training</button>
          </div>
        </div>
      </div>
      <BottomBanner left={<div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>Let's work on {weakestName} first!</div>} center={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ fontSize: 22, fontWeight: 800 }}>5 Games Ready</div><div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Personalised for you</div></div>} right={<ArrowRight size={18} />} />
    </div>
  )
}
