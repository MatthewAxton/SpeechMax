import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LiquidGlassPill } from 'anam-react-liquid-glass'
import PaperWaveBackground from './components/PaperWaveBackground'
import GamificationLayout from './gamification/GamificationLayout'
import { DevMenu } from './gamification/components/DevMenu'
import { ErrorBoundary } from './components/ErrorBoundary'
import './App.css'

const RadarScan = lazy(() => import('./gamification/screens/RadarScan'))
const RadarResults = lazy(() => import('./gamification/screens/RadarResults'))
const GameQueue = lazy(() => import('./gamification/screens/GameQueue'))
const FillerNinja = lazy(() => import('./gamification/screens/FillerNinja'))
const EyeLock = lazy(() => import('./gamification/screens/EyeLock'))
const PaceRacer = lazy(() => import('./gamification/screens/PaceRacer'))
const PitchSurfer = lazy(() => import('./gamification/screens/PitchSurfer'))
const StatueMode = lazy(() => import('./gamification/screens/StatueMode'))
const ScoreCard = lazy(() => import('./gamification/screens/ScoreCard'))
const Onboarding = lazy(() => import('./gamification/screens/Onboarding'))
const Progress = lazy(() => import('./gamification/screens/Progress'))

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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{ height: '100vh', overflow: 'hidden' }}
      >
        <Suspense fallback={null}>
          <Routes location={location}>
            {/* YOUR HOMEPAGE — preserved exactly as-is */}
            <Route path="/" element={<Homepage />} />

            {/* GAMIFICATION ROUTES — teammate's screens, wrapped in light theme */}
            <Route element={<GamificationLayout />}>
              <Route path="/scan" element={<RadarScan />} />
              <Route path="/results" element={<RadarResults />} />
              <Route path="/queue" element={<GameQueue />} />
              <Route path="/filler-ninja" element={<FillerNinja />} />
              <Route path="/eye-lock" element={<EyeLock />} />
              <Route path="/pace-racer" element={<PaceRacer />} />
              <Route path="/pitch-surfer" element={<PitchSurfer />} />
              <Route path="/statue-mode" element={<StatueMode />} />
              <Route path="/score/:game" element={<ScoreCard />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/progress" element={<Progress />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

/* ====== 404 NOT FOUND ====== */
function NotFound() {
  const nav = useNavigate()
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050508', color: 'rgba(255,255,255,0.9)', fontFamily: 'Nunito, sans-serif' }}>
      <img src="/IDLE.gif" alt="Mike" style={{ width: 120, height: 120, marginBottom: 24 }} />
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Lost your way?</h1>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>This page doesn't exist. Let's get you back on track.</p>
      <button onClick={() => nav('/')} style={{ background: '#c28fe7', color: 'white', border: 'none', padding: '12px 32px', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Go Home</button>
    </div>
  )
}

/* ====================================================================
   EVERYTHING BELOW IS YOUR ORIGINAL HOMEPAGE — UNCHANGED
   ==================================================================== */

export type Screen = 'splash' | 'goal'

// Mascot positions for each screen
const mascotPositions: Record<Screen, { x: string; y: string; size: number; gif: string }> = {
  splash: { x: '50%', y: '50%', size: 256, gif: '/IDLE.gif' },
  goal: { x: '15%', y: '12%', size: 96, gif: '/TALKING_1.gif' },
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
      </AnimatePresence>

      {/* Screen content — slides in/out smoothly */}
      <AnimatePresence mode="wait">
        {screen === 'splash' && (
          <SplashContent key="splash" onNext={() => setScreen('goal')} />
        )}
        {screen === 'goal' && (
          <GoalContent key="goal" onNext={handleGoalNext} onBack={() => setScreen('splash')} />
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

