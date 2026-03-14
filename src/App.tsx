import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LiquidGlassPill } from 'anam-react-liquid-glass'
import PaperWaveBackground from './components/PaperWaveBackground'
import GamificationLayout from './gamification/GamificationLayout'
import RadarScan from './gamification/screens/RadarScan'
import RadarResults from './gamification/screens/RadarResults'
import GameQueue from './gamification/screens/GameQueue'
import Countdown from './gamification/screens/Countdown'
import FillerNinja from './gamification/screens/FillerNinja'
import EyeLock from './gamification/screens/EyeLock'
import PaceRacer from './gamification/screens/PaceRacer'
import PitchSurfer from './gamification/screens/PitchSurfer'
import StatueMode from './gamification/screens/StatueMode'
import ScoreCard from './gamification/screens/ScoreCard'
import Onboarding from './gamification/screens/Onboarding'
import Progress from './gamification/screens/Progress'
import { DevMenu } from './gamification/components/DevMenu'
import { ErrorBoundary } from './components/ErrorBoundary'
import './App.css'

/* ====== ROOT APP WITH ROUTER ====== */
export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AnimatedRoutes />
      </ErrorBoundary>
      {import.meta.env.DEV && <DevMenu />}
    </BrowserRouter>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.01 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ height: '100vh', overflow: 'hidden' }}
      >
        <Routes location={location}>
          {/* YOUR HOMEPAGE — preserved exactly as-is */}
          <Route path="/" element={<Homepage />} />

          {/* GAMIFICATION ROUTES — teammate's screens, wrapped in light theme */}
          <Route element={<GamificationLayout />}>
            <Route path="/scan" element={<RadarScan />} />
            <Route path="/results" element={<RadarResults />} />
            <Route path="/queue" element={<GameQueue />} />
            <Route path="/countdown" element={<Countdown />} />
            <Route path="/filler-ninja" element={<FillerNinja />} />
            <Route path="/eye-lock" element={<EyeLock />} />
            <Route path="/pace-racer" element={<PaceRacer />} />
            <Route path="/pitch-surfer" element={<PitchSurfer />} />
            <Route path="/statue-mode" element={<StatueMode />} />
            <Route path="/score/:game" element={<ScoreCard />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/progress" element={<Progress />} />
          </Route>
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

/* ====================================================================
   EVERYTHING BELOW IS YOUR ORIGINAL HOMEPAGE — UNCHANGED
   ==================================================================== */

export type Screen = 'splash' | 'goal' | 'session'

// Mascot positions for each screen
const mascotPositions: Record<Screen, { x: string; y: string; size: number; gif: string }> = {
  splash: { x: '50%', y: '50%', size: 256, gif: '/IDLE.gif' },
  goal: { x: '15%', y: '12%', size: 96, gif: '/TALKING_1.gif' },
  session: { x: '6%', y: '11%', size: 44, gif: '/TALKING_1.gif' },
}

function Homepage() {
  const [screen, setScreen] = useState<Screen>('splash')
  const navigate = useNavigate()
  const pos = mascotPositions[screen]

  // When user clicks "START SESSION" on goal screen, navigate to onboarding
  const handleGoalNext = () => navigate('/onboarding')

  return (
    <div
      className="h-full w-full relative overflow-hidden select-none"
      style={{ background: '#050508' }}
    >
      <PaperWaveBackground />

      {/* Mascot — shared element that smoothly moves between screens */}
      <motion.img
        src={pos.gif}
        alt="mascot"
        className="absolute z-30 object-contain drop-shadow-lg pointer-events-none"
        animate={{
          left: pos.x,
          top: pos.y,
          width: pos.size,
          height: pos.size,
          x: '-50%',
          y: '-50%',
        }}
        transition={{ type: 'spring', stiffness: 80, damping: 18, mass: 1 }}
      />

      {/* Speech bubble — follows mascot */}
      <AnimatePresence mode="wait">
        {screen === 'splash' && (
          <motion.div
            key="bubble-splash"
            className="absolute z-30 pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              left: '50%',
              top: 'calc(50% - 155px)',
              x: '-50%',
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          >
            <div className="glass px-6 py-3 rounded-2xl">
              <SplashBubbleText />
            </div>
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-[6px] w-0 h-0"
              style={{ borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '7px solid rgba(255,255,255,0.08)' }}
            />
          </motion.div>
        )}
        {screen === 'goal' && (
          <motion.div
            key="bubble-goal"
            className="absolute z-30 pointer-events-none"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0, left: 'calc(15% + 56px)', top: 'calc(12% - 12px)' }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.2 }}
          >
            <div className="glass px-5 py-2.5 rounded-2xl">
              <span className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                What would you like to practice?
              </span>
            </div>
          </motion.div>
        )}
        {screen === 'session' && (
          <motion.div
            key="bubble-session"
            className="absolute z-30 pointer-events-none"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0, left: 'calc(6% + 30px)', top: 'calc(11% - 8px)' }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.3 }}
          >
            <SessionBubble />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen content — slides in/out smoothly */}
      <AnimatePresence mode="wait">
        {screen === 'splash' && (
          <SplashContent key="splash" onNext={() => setScreen('goal')} />
        )}
        {screen === 'goal' && (
          <GoalContent key="goal" onNext={handleGoalNext} onBack={() => setScreen('splash')} />
        )}
        {screen === 'session' && (
          <SessionContent key="session" onBack={() => setScreen('goal')} />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ====== SPLASH BUBBLE TEXT ====== */
function SplashBubbleText() {
  const [showSecond, setShowSecond] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowSecond(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence mode="wait">
      {!showSecond ? (
        <motion.span
          key="welcome"
          className="text-[15px] font-medium"
          style={{ color: 'rgba(255,255,255,0.7)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          Welcome to Speech<span style={{ color: '#c28fe7' }}>MAX</span>!
        </motion.span>
      ) : (
        <motion.span
          key="speaking"
          className="text-[15px] font-medium"
          style={{ color: 'rgba(255,255,255,0.7)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          Let's get you speaking!
        </motion.span>
      )}
    </AnimatePresence>
  )
}

/* ====== SPLASH CONTENT ====== */
function SplashContent({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Logo */}
      <motion.h1
        className="text-[72px] font-bold tracking-tight text-center"
        style={{ color: '#f5f5f5' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        Speech<span style={{ color: '#c28fe7' }}>MAX</span>
      </motion.h1>

      <div className="h-16" />

      {/* Mascot spacer (mascot is abs positioned in App) */}
      <div style={{ height: 240 }} />

      <div className="h-16" />

      {/* Primary CTA */}
      <div className="w-full max-w-[320px] px-6 flex flex-col items-center gap-4">
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <LiquidGlassPill
            onClick={onNext}
            tiltMax={4}
            shineSize={240}
            borderRadius="18px"
            style={{ background: '#c28fe7', width: '100%' }}
          >
            <div className="py-4 text-[16px] font-bold text-white text-center w-full cursor-pointer tracking-wide">
              START PRACTICING
            </div>
          </LiquidGlassPill>
        </motion.div>

        {/* Secondary CTA */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <LiquidGlassPill
            tiltMax={3}
            shineSize={200}
            borderRadius="18px"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}
          >
            <div className="py-4 text-[14px] font-semibold text-center w-full cursor-pointer" style={{ color: 'rgba(255,255,255,0.5)' }}>
              I ALREADY HAVE AN ACCOUNT
            </div>
          </LiquidGlassPill>
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ====== GOAL CONTENT ====== */
const OPTIONS = [
  { title: 'Job Interview', desc: 'Practice behavioral questions with AI feedback' },
  { title: 'Presentation', desc: 'Deliver a pitch or talk to an audience' },
  { title: 'Freestyle', desc: 'Speak freely on any topic' },
  { title: 'Reading Aloud', desc: 'Practice clarity and pacing' },
]

function GoalContent({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState(0)

  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col pt-32 px-6"
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -80 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Back button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onBack}
        className="absolute top-10 left-6 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer bg-transparent border-none z-30"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12.5 15L7.5 10L12.5 5" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.button>

      {/* Options */}
      <div className="flex-1 flex flex-col gap-3 max-w-[480px] mx-auto w-full mt-8">
        {OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08, duration: 0.35 }}
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelected(i)}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left cursor-pointer transition-all duration-200"
            style={{
              background: selected === i ? 'rgba(194,143,231,0.1)' : 'rgba(255,255,255,0.04)',
              border: selected === i ? '1.5px solid rgba(194,143,231,0.4)' : '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-end gap-[3px] shrink-0">
              {[0, 1, 2].map((bar) => (
                <div
                  key={bar}
                  className="w-[5px] rounded-sm transition-colors duration-200"
                  style={{ height: 8 + bar * 5, background: selected === i ? '#c28fe7' : 'rgba(255,255,255,0.2)' }}
                />
              ))}
            </div>
            <div>
              <div className="text-[15px] font-semibold transition-colors duration-200" style={{ color: selected === i ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)' }}>
                {opt.title}
              </div>
              <div className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{opt.desc}</div>
            </div>
            {selected === i && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: '#c28fe7' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7.5L5.5 10L11 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* CTA */}
      <div className="py-8 max-w-[480px] mx-auto w-full">
        <LiquidGlassPill
          onClick={onNext}
          tiltMax={4}
          shineSize={240}
          borderRadius="18px"
          style={{ background: '#c28fe7', width: '100%' }}
        >
          <div className="py-4 text-[16px] font-bold text-white text-center w-full cursor-pointer tracking-wide">
            START SESSION
          </div>
        </LiquidGlassPill>
      </div>
    </motion.div>
  )
}

/* ====== SESSION BUBBLE (tip that changes) ====== */

const TIPS = [
  { type: 'positive' as const, text: 'Great eye contact!' },
  { type: 'warning' as const, text: 'Try slowing down.' },
  { type: 'negative' as const, text: 'Filler: "um" — pause.' },
  { type: 'positive' as const, text: 'Nice gestures!' },
  { type: 'warning' as const, text: 'Add pitch variation.' },
]

function SessionBubble() {
  const [tipIdx, setTipIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 3000)
    return () => clearInterval(id)
  }, [])
  const tip = TIPS[tipIdx]
  const color = tip.type === 'positive' ? '#4ade80' : tip.type === 'warning' ? '#fbbf24' : '#f87171'
  const bg = tip.type === 'positive' ? 'rgba(34,197,94,0.08)' : tip.type === 'warning' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)'
  const border = tip.type === 'positive' ? 'rgba(34,197,94,0.2)' : tip.type === 'warning' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tipIdx}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 8 }}
        transition={{ duration: 0.25 }}
        className="px-4 py-2 rounded-2xl text-[12px] font-medium whitespace-nowrap"
        style={{ background: bg, border: `1px solid ${border}`, color }}
      >
        {tip.text}
      </motion.div>
    </AnimatePresence>
  )
}

/* ====== SESSION CONTENT ====== */
const QUESTIONS = [
  "Tell me about yourself and why you're interested in this role.",
  "Describe a time you faced a difficult challenge at work.",
  "What's your greatest strength?",
  "Tell me about a conflict with a coworker.",
  "Where do you see yourself in five years?",
]

function SessionContent({ onBack }: { onBack: () => void }) {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(true)
  const [qi, setQi] = useState(0)
  const [wpm, setWpm] = useState(136)
  const [fillers, setFillers] = useState(0)
  const [confidence, setConfidence] = useState(78)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) { intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000) }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setWpm(130 + Math.floor(Math.random() * 25))
      setFillers((f) => f + (Math.random() > 0.7 ? 1 : 0))
      setConfidence(70 + Math.floor(Math.random() * 20))
    }, 3000)
    return () => clearInterval(id)
  }, [running])

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')

  function metricColor(label: string) {
    if (label === 'WPM') return wpm >= 130 && wpm <= 150 ? '#4ade80' : '#fbbf24'
    if (label === 'Fillers') return fillers <= 2 ? '#4ade80' : fillers <= 5 ? '#fbbf24' : '#f87171'
    return confidence >= 75 ? '#4ade80' : '#fbbf24'
  }

  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col"
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -80 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="text-[14px] font-semibold cursor-pointer bg-transparent border-none" style={{ color: '#f87171' }}>
          End
        </motion.button>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Interview</span>
          <span className="text-[13px] font-bold px-2.5 py-0.5 rounded-full" style={{ color: '#c28fe7', background: 'rgba(194,143,231,0.1)' }}>Q{qi + 1}/{QUESTIONS.length}</span>
        </div>
        <div className="text-[20px] font-bold tabular-nums tracking-tight" style={{ color: 'rgba(255,255,255,0.85)' }}>{mins}:{secs}</div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 max-w-[520px] mx-auto w-full">
        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div key={qi} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }} className="w-full mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#c28fe7' }}>Question {qi + 1}</p>
            <p className="text-[22px] font-bold leading-snug tracking-tight" style={{ color: 'rgba(255,255,255,0.9)' }}>{QUESTIONS[qi]}</p>
          </motion.div>
        </AnimatePresence>

        {/* Waveform */}
        <div className="w-full mb-6">
          <div className="flex items-end justify-center gap-[3px] h-12">
            {Array.from({ length: 40 }).map((_, i) => {
              const h = running ? 8 + Math.random() * 36 : 8
              return (
                <motion.div key={i} className="w-[4px] rounded-full" style={{ background: '#c28fe7' }}
                  animate={{ height: h, opacity: running ? [0.3, 0.8, 0.3] : 0.15 }}
                  transition={{ duration: 0.3, repeat: Infinity, repeatType: 'reverse', delay: i * 0.03 }}
                />
              )
            })}
          </div>
          <p className="text-center text-[12px] mt-2" style={{ color: 'rgba(255,255,255,0.25)' }}>{running ? 'Listening...' : 'Paused'}</p>
        </div>

        {/* Metrics */}
        <div className="w-full grid grid-cols-3 gap-3 mb-8">
          {[{ label: 'WPM', value: wpm }, { label: 'Fillers', value: fillers }, { label: 'Confidence', value: `${confidence}%` }].map((m) => (
            <div key={m.label} className="glass text-center py-3 rounded-2xl">
              <div className="text-[24px] font-bold tabular-nums" style={{ color: metricColor(m.label) }}>{m.value}</div>
              <div className="text-[11px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1">
            <LiquidGlassPill onClick={() => setRunning(!running)} tiltMax={3} shineSize={180} borderRadius="16px"
              style={{ background: running ? 'rgba(255,255,255,0.04)' : '#c28fe7', border: running ? '1px solid rgba(255,255,255,0.08)' : 'none', width: '100%' }}>
              <div className="py-3.5 text-[15px] font-semibold text-center w-full cursor-pointer" style={{ color: running ? 'rgba(255,255,255,0.6)' : '#fff' }}>
                {running ? 'Pause' : 'Resume'}
              </div>
            </LiquidGlassPill>
          </div>
          <div className="flex-1">
            <LiquidGlassPill onClick={() => { if (qi < QUESTIONS.length - 1) setQi(qi + 1) }} tiltMax={4} shineSize={200} borderRadius="16px"
              style={{ background: '#c28fe7', width: '100%' }}>
              <div className="py-3.5 text-[15px] font-bold text-white text-center w-full cursor-pointer">
                {qi < QUESTIONS.length - 1 ? 'Next Question' : 'Finish'}
              </div>
            </LiquidGlassPill>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
