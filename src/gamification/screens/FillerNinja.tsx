import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, X, Crosshair } from 'lucide-react'
import GameIntro from '../components/GameIntro'
import { TopBanner, BottomBanner } from '../components/Banner'
import { AudioWave } from '../components/AudioWave'
import { startTranscription, stopTranscription, onTranscript } from '../../analysis/speech/transcriber'
import { startFillerDetection, stopFillerDetection, onFillerDetected, getFillerCount } from '../../analysis/speech/fillerDetector'
import { useMicrophone } from '../../analysis/hooks/useMicrophone'
import { computeSimpleGameScore } from '../../analysis/scoring/gameScorer'
import { useGameStore } from '../../store/gameStore'
import { useSessionStore } from '../../store/sessionStore'
import { useRequireScan } from '../hooks/useRequireScan'
import { playFillerBuzz, playGameComplete, playBadgeEarned } from '../../lib/sounds'
import { getPromptCategory, getPromptLabel } from '../../lib/goalPromptMap'
import type { Difficulty } from '../../analysis/types'

const FILLER_TARGETS = ['um', 'uh', 'like', 'so', 'you know', 'basically', 'actually', 'right']
const FLOAT_TOPS = [10, 22, 35, 48, 55, 65, 73, 80]
const FLOAT_DURATIONS = [18, 24, 15, 30, 20, 12, 26, 22]
const FLOAT_DELAYS = [0, 3, 7, 1, 5, 9, 2, 6]

const DIFFICULTY_CONFIG: Record<Difficulty, { duration: number; silenceTimeout: number; penaltyMultiplier: number; hideFillerList: boolean; tip: string }> = {
  easy:   { duration: 60,  silenceTimeout: 5000, penaltyMultiplier: 1, hideFillerList: false, tip: 'Take your time — pauses are better than fillers!' },
  medium: { duration: 60,  silenceTimeout: 4000, penaltyMultiplier: 1, hideFillerList: true,  tip: 'No filler list this time — trust your instincts.' },
  hard:   { duration: 90,  silenceTimeout: 3000, penaltyMultiplier: 2, hideFillerList: true,  tip: 'Strict rules — every filler costs double!' },
}

export default function FillerNinja() {
  const hasScans = useRequireScan()
  const nav = useNavigate()
  const [difficulty] = useState(() => useGameStore.getState().getDifficultyFor('filler-ninja'))
  const config = DIFFICULTY_CONFIG[difficulty]
  const [promptCategory] = useState(() => getPromptCategory(useSessionStore.getState().userGoal, 'interview'))
  const [prompt] = useState(() => useSessionStore.getState().getUnusedPrompt(promptCategory))
  const promptLabel = getPromptLabel(promptCategory)
  const gameDuration = config.duration
  const [time, setTime] = useState(gameDuration)
  const [streak, setStreak] = useState(0)
  const [fillers, setFillers] = useState(0)
  const [lastFiller, setLastFiller] = useState<string | null>(null)
  const [liveText, setLiveText] = useState('')
  const [phase, setPhase] = useState<'intro' | 'playing'>('intro')
  const [ready, setReady] = useState(false)
  const [silent, setSilent] = useState(false)
  const [shaking, setShaking] = useState(false)
  const lastFillerTime = useRef(Date.now())
  const lastSpeechTime = useRef(Date.now())
  const { requestMic, stopMic } = useMicrophone()

  useEffect(() => {
    if (phase !== 'playing') return
    let cancelled = false
    ;(async () => {
      await requestMic()
      if (!cancelled) {
        stopTranscription()
        stopFillerDetection()
        startTranscription()
        startFillerDetection()
        setReady(true)
      }
    })()
    return () => { cancelled = true }
  }, [phase, requestMic])

  // Listen for fillers
  useEffect(() => {
    if (!ready) return
    const unsub = onFillerDetected((e) => {
      playFillerBuzz()
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      setFillers(getFillerCount())
      setLastFiller(e.word)
      setStreak(0) // reset streak on filler
      lastFillerTime.current = Date.now()
    })
    return unsub
  }, [ready])

  // Listen for live transcript
  useEffect(() => {
    if (!ready) return
    const unsub = onTranscript((e) => {
      setLiveText(e.text)
      lastSpeechTime.current = Date.now()
      setSilent(false)
    })
    return unsub
  }, [ready])

  // Timer + streak counter — only ticks while user is speaking
  useEffect(() => {
    if (!ready) return
    lastFillerTime.current = Date.now()
    const t = setInterval(() => {
      const isSilent = Date.now() - lastSpeechTime.current > config.silenceTimeout
      setSilent(isSilent)

      // Only tick timer and streak while speaking
      if (!isSilent) {
        setTime(p => {
          if (p <= 1) {
            clearInterval(t)
            stopTranscription()
            stopFillerDetection()
            stopMic()
            const metrics = { fillerCount: getFillerCount(), durationSeconds: gameDuration, longestStreakSeconds: Math.floor((Date.now() - lastFillerTime.current) / 1000) }
            const score = computeSimpleGameScore('filler-ninja', metrics)
            useGameStore.getState().addGameResult({ gameType: 'filler-ninja', score, metrics, timestamp: Date.now() })
            useSessionStore.getState().markPromptUsed(prompt)
            useSessionStore.getState().recordGame('filler-ninja')
            const badges = useSessionStore.getState().checkBadges()
            playGameComplete()
            if (badges && badges.length > 0) playBadgeEarned()
            nav('/score/filler')
            return 0
          }
          return p - 1
        })
        setStreak(Math.floor((Date.now() - lastFillerTime.current) / 1000))
      }
    }, 1000)
    return () => clearInterval(t)
  }, [nav, ready, stopMic])

  if (!hasScans) return null

  const comboTier = streak >= 25 ? { label: 'UNSTOPPABLE', color: '#FF6B00' }
    : streak >= 20 ? { label: 'PERFECT', color: '#FFD700' }
    : streak >= 15 ? { label: 'ON FIRE', color: '#FF4B4B' }
    : streak >= 10 ? { label: 'GREAT', color: '#58CC02' }
    : streak >= 5 ? { label: 'GOOD', color: '#C28FE7' }
    : null

  const multiplier = streak >= 25 ? 5 : streak >= 20 ? 4 : streak >= 15 ? 3 : streak >= 10 ? 2 : 1

  if (phase === 'intro') return (
    <GameIntro
      title="Filler Ninja"
      axis="Clarity"
      duration={`${gameDuration}s`}
      icon={Crosshair}
      steps={[
        'A prompt will appear — speak about it naturally',
        'Every filler word ("um", "like", "basically") gets flagged in red',
        'Replace fillers with a silent pause to build your streak',
      ]}
      goal="Survive without filler words as long as possible"
      tip={config.tip}
      prompt={prompt}
      promptLabel={promptLabel}
      heroContent={
        config.hideFillerList ? (
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(194,143,231,0.5)', fontStyle: 'italic' }}>Filler list hidden — stay sharp!</div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['um', 'uh', 'like', 'basically', 'you know'].map(w => (
              <motion.div key={w} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
                style={{ background: 'rgba(194,143,231,0.1)', border: '1px solid rgba(194,143,231,0.2)', borderRadius: 12, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: 'rgba(194,143,231,0.5)' }}>{w}</motion.div>
            ))}
          </div>
        )
      }
      onReady={() => setPhase('playing')}
    />
  )
  function highlightFillers(text: string): React.ReactNode {
    if (!text) return null
    const fillerWords = ['um', 'uh', 'uhh', 'umm', 'er', 'ah', 'hmm', 'like', 'you know', 'basically', 'right', 'actually', 'i mean']
    const pattern = fillerWords.map(w => w.replace(/\s+/g, '\\s+')).join('|')
    const regex = new RegExp(`(\\b(?:${pattern})\\b)`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) => {
      const isF = regex.test(part)
      regex.lastIndex = 0
      if (isF) return <span key={i} style={{ color: '#FF4B4B', fontWeight: 800, background: 'rgba(255,75,75,0.15)', padding: '1px 4px', borderRadius: 4 }}>{part}</span>
      return <span key={i}>{part}</span>
    })
  }

  const ninjaBarColor = streak > 20 ? '#58CC02' : streak > 10 ? '#C28FE7' : '#6B21A8'
  return (
    <motion.div
      animate={shaking ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
      transition={shaking ? { duration: 0.5, ease: 'easeOut' } : { duration: 0.1 }}
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Floating filler word bubbles (ambient, decorative) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {FILLER_TARGETS.map((word, i) => (
          <motion.div
            key={word}
            animate={{ x: ['calc(-100px)', 'calc(100vw + 100px)'] }}
            transition={{ duration: FLOAT_DURATIONS[i], repeat: Infinity, ease: 'linear', delay: FLOAT_DELAYS[i] }}
            style={{
              position: 'absolute', top: `${FLOAT_TOPS[i]}%`,
              background: 'rgba(194,143,231,0.08)', border: '1px solid rgba(194,143,231,0.15)',
              color: 'rgba(194,143,231,0.25)', borderRadius: 20, padding: '6px 16px',
              fontSize: 14, fontWeight: 600, backdropFilter: 'blur(4px)', whiteSpace: 'nowrap',
            }}
          >
            {word}
          </motion.div>
        ))}
      </div>

      <TopBanner backTo="/queue" title="Filler Ninja"
        center={<><span style={{ background: silent ? 'rgba(252,211,77,0.2)' : 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 12, fontSize: 15, fontWeight: 800, transition: 'background 0.3s' }}>{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}{silent && <span style={{ fontSize: 10, fontWeight: 700, color: '#FCD34D', marginLeft: 6 }}>PAUSED</span>}</span><div style={{ width: 160, height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}><motion.div animate={{ width: `${((gameDuration-time)/gameDuration)*100}%` }} style={{ height: '100%', background: silent ? '#FCD34D' : 'var(--purple)', borderRadius: 4, transition: 'background 0.3s' }} /></div></>}
        right={<><span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700 }}><Zap size={14} /> {fillers}</span><span style={{ background: `${difficulty === 'hard' ? '#FF4B4B' : difficulty === 'medium' ? '#FCD34D' : '#58CC02'}30`, color: difficulty === 'hard' ? '#FF4B4B' : difficulty === 'medium' ? '#FCD34D' : '#58CC02', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, textTransform: 'uppercase' }}>{difficulty}</span></>} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 40px' }}>
          <div className="card" style={{ width: '100%', maxWidth: 600, textAlign: 'center', marginBottom: 12, padding: '20px 28px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', marginBottom: 8 }}>{promptLabel}</div>
            <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4 }}>{prompt}</div>
          </div>
          <div style={{ maxWidth: 520, textAlign: 'center', fontSize: 16, fontWeight: 500, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 12, minHeight: 60 }}>
            {silent ? (
              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ color: '#FCD34D', fontWeight: 700, fontSize: 18 }}>Keep talking!</motion.span>
            ) : liveText ? highlightFillers(liveText) : <span style={{ opacity: 0.4 }}>Start speaking...</span>}
          </div>

          {/* Filler badge with slash animation */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            {lastFiller && (
              <div style={{ position: 'relative' }}>
                <motion.span
                  key={fillers}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  style={{ background: 'var(--red)', color: 'white', fontSize: 14, fontWeight: 700, padding: '8px 18px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <X size={14} /> {lastFiller}
                </motion.span>
                <svg key={`slash-${fillers}`} width={120} height={60} style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
                  <motion.line x1={0} y1={50} x2={120} y2={10} stroke="#FF4B4B" strokeWidth={3} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1, opacity: [1, 0] }} transition={{ duration: 0.5 }} />
                  <motion.line x1={10} y1={60} x2={110} y2={0} stroke="#FF4B4B" strokeWidth={3} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1, opacity: [1, 0] }} transition={{ duration: 0.5, delay: 0.1 }} />
                </svg>
              </div>
            )}
          </div>

          {/* Streak counter with pulsing ring */}
          <div style={{ textAlign: 'center', position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            {streak > 15 && (
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ position: 'absolute', top: -10, width: 80, height: 80, borderRadius: '50%', border: '2px solid rgba(194,143,231,0.3)', pointerEvents: 'none' }}
              />
            )}
            <motion.div key={streak} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: silent ? 0.4 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }} style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, background: silent ? 'linear-gradient(135deg, #FCD34D, #F59E0B)' : 'linear-gradient(135deg, #C28FE7, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textShadow: streak > 10 && !silent ? '0 0 20px rgba(194,143,231,0.5)' : 'none' }}>{streak}</motion.div>
            <div style={{ fontSize: 13, fontWeight: 600, color: silent ? '#FCD34D' : 'var(--muted)' }}>{silent ? 'paused — speak to continue' : 'seconds filler-free'}</div>

            {/* Combo tier */}
            {comboTier && (
              <motion.div
                key={comboTier.label}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ fontSize: 16, fontWeight: 900, color: comboTier.color, textTransform: 'uppercase', letterSpacing: 2, marginTop: 6, textShadow: `0 0 20px ${comboTier.color}60` }}
              >
                {comboTier.label}!
              </motion.div>
            )}
            {multiplier > 1 && (
              <motion.div
                key={`mult-${multiplier}`}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ fontSize: 13, fontWeight: 800, color: '#FCD34D', marginTop: 4 }}
              >
                {multiplier}x MULTIPLIER
              </motion.div>
            )}

            {/* Ninja meter */}
            <div style={{ width: 200, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${Math.min(100, (streak / 30) * 100)}%` }}
                transition={{ duration: 0.5 }}
                style={{ height: '100%', background: ninjaBarColor, borderRadius: 3 }}
              />
            </div>
          </div>
          <div style={{ marginTop: 16 }}><AudioWave /></div>
        </div>
      </div>
      <BottomBanner left={<div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>{comboTier ? `${comboTier.label}! ${multiplier}x multiplier` : streak > 0 ? 'Build your streak!' : 'Keep going!'}</div>} center={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ fontSize: 22, fontWeight: 800 }}>{streak}s Streak</div><div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Filler-Free</div></div>} right={<><Zap size={14} /> Fillers: {fillers}</>} />
    </motion.div>
  )
}
