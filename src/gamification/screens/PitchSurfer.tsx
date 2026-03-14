import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, TrendingUp, Minus } from 'lucide-react'
import { TopBanner, BottomBanner } from '../components/Banner'
import { Mike } from '../components/Mike'
import { AudioWave } from '../components/AudioWave'
import { GraceCountdown } from '../components/GraceCountdown'
import { startAudioAnalysis, stopAudioAnalysis, onAudioFrame } from '../../analysis/audio/pitchAnalyzer'
import { useMicrophone } from '../../analysis/hooks/useMicrophone'

export default function PitchSurfer() {
  const nav = useNavigate()
  const [time, setTime] = useState(30)
  const [ready, setReady] = useState(false)
  const [pitchHistory, setPitchHistory] = useState<number[]>([])
  const [currentPitch, setCurrentPitch] = useState(0)
  const [variation, setVariation] = useState<'low' | 'good' | 'high'>('low')
  const { requestMic, stopMic } = useMicrophone()
  const pitchBuffer = useRef<number[]>([])

  const onReady = useCallback(async () => {
    const stream = await requestMic()
    if (stream) startAudioAnalysis(stream)
    setReady(true)
  }, [requestMic])

  // Listen for real pitch data
  useEffect(() => {
    if (!ready) return
    const unsub = onAudioFrame((frame) => {
      if (frame.pitch > 0) {
        setCurrentPitch(frame.pitch)
        pitchBuffer.current.push(frame.pitch)
        // Keep last 60 readings for wave visualization
        setPitchHistory(prev => [...prev.slice(-59), frame.pitch])
      }
    })
    return unsub
  }, [ready])

  // Calculate variation every second
  useEffect(() => {
    if (!ready) return
    const id = setInterval(() => {
      const buf = pitchBuffer.current
      if (buf.length < 5) { setVariation('low'); return }
      const mean = buf.reduce((a, b) => a + b, 0) / buf.length
      const stdDev = Math.sqrt(buf.reduce((sum, v) => sum + (v - mean) ** 2, 0) / buf.length)
      if (stdDev > 30) setVariation('high')
      else if (stdDev > 15) setVariation('good')
      else setVariation('low')
    }, 1000)
    return () => clearInterval(id)
  }, [ready])

  // Build SVG wave path from pitch history
  const wavePath = (() => {
    if (pitchHistory.length < 2) return ''
    const w = 800
    const h = 220
    const step = w / Math.max(1, pitchHistory.length - 1)
    let d = `M0,${h}`
    pitchHistory.forEach((p, i) => {
      const y = h - ((p - 50) / 400) * h // map 50-450Hz to 0-h
      const x = i * step
      if (i === 0) d = `M${x},${Math.max(10, Math.min(h - 10, y))}`
      else d += ` L${x},${Math.max(10, Math.min(h - 10, y))}`
    })
    const fillPath = d + ` L${(pitchHistory.length - 1) * step},${h} L0,${h} Z`
    return fillPath
  })()

  const strokePath = wavePath.replace(/ L\d+,220 L0,220 Z$/, '')

  useEffect(() => {
    if (!ready) return
    const t = setInterval(() => {
      setTime(p => {
        if (p <= 1) {
          clearInterval(t)
          stopAudioAnalysis()
          stopMic()
          nav('/score/pitch')
          return 0
        }
        return p - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [nav, ready, stopMic])

  const variationColor = variation === 'high' ? 'var(--green)' : variation === 'good' ? 'var(--purple)' : 'var(--red)'
  const VariationIcon = variation === 'low' ? Minus : TrendingUp

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {!ready && <GraceCountdown onReady={onReady} prompt="We need to talk about the quarterly results. The numbers show a significant improvement." promptLabel="Read With Expression" />}
      <TopBanner backTo="/queue" title="Pitch Surfer" center={<span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 12, fontSize: 15, fontWeight: 800 }}>0:{time.toString().padStart(2, '0')}</span>} right={<span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700 }}><Zap size={14} /> {Math.round(currentPitch)}Hz</span>} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 40px' }}>
          <div style={{ width: '100%', maxWidth: 800, height: 220, position: 'relative', marginBottom: 12 }}>
            <svg width="100%" height="100%" viewBox="0 0 800 220" preserveAspectRatio="none">
              <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(194,143,231,0.15)" /><stop offset="100%" stopColor="rgba(194,143,231,0.02)" /></linearGradient></defs>
              {wavePath && <path d={wavePath} fill="url(#wg)" />}
              {strokePath && <path d={strokePath} fill="none" stroke="var(--purple)" strokeWidth={2.5} />}
            </svg>
            <motion.div animate={{ y: [0, -12, 0, -6, 0], rotate: [0, 3, 0, -2, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} style={{ position: 'absolute', top: 20, left: '52%', transform: 'translateX(-50%)' }}>
              <Mike state="talking" size={90} />
            </motion.div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: variationColor, fontSize: 16, fontWeight: 700, marginBottom: 10 }}><VariationIcon size={18} /> {variation === 'high' ? 'HIGH VARIATION — Great!' : variation === 'good' ? 'GOOD VARIATION' : 'LOW VARIATION — Add expression!'}</div>
          <div className="card" style={{ width: '100%', maxWidth: 600, textAlign: 'center', padding: '18px 28px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', marginBottom: 6 }}>Read With Expression</div>
            <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4 }}>We need to talk about the quarterly results. The numbers show a significant improvement.</div>
          </div>
          <AudioWave />
        </div>
      </div>
      <BottomBanner left={<div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>{variation === 'high' ? 'Ride the wave! Great variation.' : 'Vary your pitch more!'}</div>} center={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: variationColor }}>{variation === 'low' ? 'Flat' : variation === 'good' ? 'Good' : 'High'}</div><div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pitch Variation</div></div>} right={<><Zap size={14} /> {Math.round(currentPitch)}Hz</>} />
    </div>
  )
}
