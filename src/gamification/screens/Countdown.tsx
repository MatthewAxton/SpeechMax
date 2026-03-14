import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, Crosshair, Eye, Activity, Waves, Shield } from 'lucide-react'
import { TopBanner, BottomBanner } from '../components/Banner'
import { Mike, TalkingBubble } from '../components/Mike'
import { playCountdownBeep, playGoTone } from '../../lib/sounds'

const gameInfo: Record<string, { title: string; axis: string; duration: string; icon: any; steps: string[]; goal: string; tip: string; message: string; countdownMsg: string }> = {
  '/filler-ninja': { title: 'Filler Ninja', axis: 'Clarity', duration: '90s', icon: Crosshair, steps: ['A prompt will appear — speak about it naturally', 'Every filler word ("um", "like", "basically") gets flagged in red', 'Replace fillers with a silent pause to build your streak'], goal: 'Survive 90 seconds with as few fillers as possible', tip: 'Silence sounds more confident than fillers!', message: "You've got this! Remember — pause, don't fill.", countdownMsg: "Here we go!" },
  '/eye-lock': { title: 'Eye Lock', axis: 'Confidence', duration: '45s', icon: Eye, steps: ['A green dot will appear on screen — look directly at it', 'Answer the question while keeping your gaze locked', 'The screen glows green when locked, red when you look away'], goal: 'Keep your gaze locked for as much of the 45 seconds as possible', tip: 'Relax your shoulders and breathe.', message: "Focus on the dot — you've got this!", countdownMsg: "Eyes on the dot!" },
  '/pace-racer': { title: 'Pace Racer', axis: 'Pacing', duration: '60s', icon: Activity, steps: ['Speak on the prompt at a natural pace', 'A pace bar shows your live WPM — stay in the green zone (120–160)', 'Too fast or too slow and the bar turns red'], goal: 'Keep your speaking pace in the green zone for 60 seconds', tip: 'Breathe between sentences to control pace.', message: "Find your rhythm. Not too fast, not too slow.", countdownMsg: "Find your pace!" },
  '/pitch-surfer': { title: 'Pitch Surfer', axis: 'Expression', duration: '30s', icon: Waves, steps: ['Read the passage aloud with expression', 'Your pitch creates a wave on screen — vary it to keep the wave alive', 'A flat, monotone voice = flatline = game over'], goal: 'Keep the wave dynamic for 30 seconds — no flatlines!', tip: 'Emphasise key words to create variation.', message: "Make the wave dance with your voice!", countdownMsg: "Ride the wave!" },
  '/statue-mode': { title: 'Statue Mode', axis: 'Composure', duration: '45s', icon: Shield, steps: ['Speak on the prompt while staying as still as possible', 'The camera tracks your body — fidgeting costs points', 'Green zones = stable, red zones = too much movement'], goal: 'Deliver your speech with minimal body movement for 45 seconds', tip: 'Plant your feet and keep hands still.', message: "Stay still, stay strong. You can do this!", countdownMsg: "Stay still!" },
}

const ease = [0.25, 0.46, 0.45, 0.94] as const

export default function Countdown() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const target = params.get('next') || '/filler-ninja'
  const info = gameInfo[target] || gameInfo['/filler-ninja']
  const [phase, setPhase] = useState<'intro' | 'counting' | 'go'>('intro')
  const [count, setCount] = useState(3)
  const [mikeState, setMikeState] = useState<'idle' | 'talking'>('idle')
  const [bubbleText, setBubbleText] = useState('')
  const [showParticles, setShowParticles] = useState(false)
  const [buttonClicked, setButtonClicked] = useState(false)

  const [particles] = useState(() =>
    Array.from({ length: 14 }, (_, i) => ({
      x: Math.cos((Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.5) * (60 + Math.random() * 50),
      y: Math.sin((Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.5) * (60 + Math.random() * 50),
      size: 6 + Math.random() * 6,
      delay: Math.random() * 0.1,
    }))
  )

  // Intro: Mike speaks the instruction message
  useEffect(() => {
    if (phase !== 'intro') return
    const t1 = setTimeout(() => { setMikeState('talking'); setBubbleText(info.message) }, 1000)
    const dur = Math.max(2500, info.message.length * 80)
    const t2 = setTimeout(() => setMikeState('idle'), 1000 + dur)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [phase, info.message])

  // Counting: Mike counts down with speech bubbles
  useEffect(() => {
    if (phase !== 'counting') return
    setMikeState('talking')
    setBubbleText(String(count))
    if (count === 0) {
      playGoTone()
      setBubbleText('GO!')
      setPhase('go')
      setTimeout(() => nav(target, { replace: true }), 800)
      return
    }
    playCountdownBeep()
    const t = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, phase, nav, target])

  const Icon = info.icon

  const handleButtonClick = () => {
    if (buttonClicked) return
    setButtonClicked(true)
    setShowParticles(true)
    setBubbleText(info.countdownMsg)
    setMikeState('talking')
    setTimeout(() => setShowParticles(false), 1000)
    setTimeout(() => setPhase('counting'), 900)
  }

  // Mike layout position
  const isIntro = phase === 'intro'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBanner backTo="/queue" title={info.title} right={<span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>{info.axis} · {info.duration}</span>} />

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 40px' }}>

          {/* Mike - visible during intro, fades out for countdown */}
          <AnimatePresence>
            {isIntro && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.7, ease }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}
              >
                <motion.div animate={{ scale: mikeState === 'talking' ? [1, 1.05, 1] : 1 }} transition={{ duration: 0.3 }}>
                  <Mike state={mikeState} size={100} />
                </motion.div>

                {/* Speech bubble */}
                <AnimatePresence mode="wait">
                  {bubbleText && (
                    <motion.div
                      key={bubbleText}
                      initial={{ opacity: 0, y: 6, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.35, ease }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -2 }}
                    >
                      <div style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid rgba(255,255,255,0.08)' }} />
                      <div style={{ width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '7px solid rgba(255,255,255,0.06)', marginTop: -7 }} />
                      <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '2px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 22px', fontSize: 16, fontWeight: 600, maxWidth: 360, textAlign: 'center', lineHeight: 1.4, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                        <TalkingBubble text={bubbleText} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content area */}
          <AnimatePresence mode="wait">
            {isIntro ? (
              <motion.div
                key="instructions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.5, ease } }}
                transition={{ duration: 0.6, ease }}
                style={{ textAlign: 'center', maxWidth: 460, marginTop: 8 }}
              >
                {/* Game badge */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5, ease }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '8px 16px', marginBottom: 12 }}>
                  <Icon size={18} color="var(--purple)" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--purple)' }}>{info.title}</span>
                  <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{info.duration}</span>
                </motion.div>

                {/* How to play label */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.4, ease }}
                  style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', marginBottom: 10 }}>How To Play</motion.div>

                {/* Steps */}
                <div style={{ textAlign: 'left', marginBottom: 10 }}>
                  {info.steps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.25, duration: 0.5, ease }}
                      style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}
                    >
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--purple)', color: 'white', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: 'var(--text)', paddingTop: 2 }}>{step}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Goal */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 0.5, ease }}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 16px', marginBottom: 14, fontSize: 14, fontWeight: 700, color: 'var(--purple)' }}>
                  {info.goal}
                </motion.div>

                {/* Tip */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8, duration: 0.5, ease }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 14px', marginBottom: 16 }}>
                  <Lightbulb size={14} color="var(--purple)" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{info.tip}</span>
                </motion.div>

                {/* Button */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.1, duration: 0.5, ease }}
                  style={{ position: 'relative', display: 'inline-block' }}>
                  <motion.button
                    className="btn-primary"
                    style={{ width: 280, position: 'relative', zIndex: 1 }}
                    onClick={handleButtonClick}
                    animate={buttonClicked ? { scale: [1, 1.1, 0.95, 1] } : {}}
                    transition={buttonClicked ? { duration: 0.3, times: [0, 0.3, 0.6, 1] } : {}}
                  >
                    I'M READY
                  </motion.button>
                  <AnimatePresence>
                    {showParticles && particles.map((p, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: 0, y: 0, scale: 1, opacity: 0.8 }}
                        animate={{ x: p.x, y: p.y, scale: 0, opacity: 0 }}
                        transition={{ duration: 0.9, delay: p.delay, ease: 'easeOut' }}
                        style={{ position: 'absolute', left: '50%', top: '50%', width: p.size, height: p.size, borderRadius: '50%', background: 'var(--purple)', pointerEvents: 'none', zIndex: 0, marginLeft: -p.size / 2, marginTop: -p.size / 2 }}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="countdown-display"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
              >
                <motion.div animate={{ scale: mikeState === 'talking' ? [1, 1.05, 1] : 1 }} transition={{ duration: 0.3 }}>
                  <Mike state={mikeState} size={100} />
                </motion.div>
                <AnimatePresence mode="wait">
                  {bubbleText && (
                    <motion.div
                      key={bubbleText}
                      initial={{ opacity: 0, y: 6, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.4, ease } }}
                      transition={{ duration: 0.5, ease }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -2 }}
                    >
                      <div style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid rgba(255,255,255,0.08)' }} />
                      <div style={{ width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '7px solid rgba(255,255,255,0.06)', marginTop: -7 }} />
                      <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '2px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '12px 28px', fontSize: 36, fontWeight: 900, color: 'var(--purple)', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                        <TalkingBubble text={bubbleText} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ fontSize: 18, fontWeight: 700, color: 'var(--muted)', marginTop: 12 }}>
                  {info.title}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <BottomBanner
        left={<div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>{isIntro ? 'Read the instructions' : info.countdownMsg}</div>}
        center={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ fontSize: 20, fontWeight: 800 }}>{phase === 'counting' ? count : info.title}</div><div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>{info.axis} · {info.duration}</div></div>}
      />
    </div>
  )
}
