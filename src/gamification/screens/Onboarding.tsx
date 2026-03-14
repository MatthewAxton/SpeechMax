import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mike, TalkingBubble } from '../components/Mike'

const ease = [0.25, 0.46, 0.45, 0.94] as const

const slideVariants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
}

export default function Onboarding() {
  const nav = useNavigate()
  const [step, setStep] = useState(0)

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', position: 'relative',
    }}>
      {/* Step dots */}
      <div style={{ position: 'absolute', top: 32, display: 'flex', gap: 8 }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              width: 10, height: 10, borderRadius: '50%',
              background: i <= step ? 'var(--purple, #C28FE7)' : 'var(--border, #E5D5F7)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Slide 1 — Mascot Introduction */}
        {step === 0 && (
          <motion.div
            key="slide-0"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 400 }}
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Mike state="talking" size={120} />
            </motion.div>

            <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '2px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px 28px', fontSize: 17, fontWeight: 600, lineHeight: 1.6, color: 'var(--text, rgba(255,255,255,0.9))', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <TalkingBubble text="Hey! I'm <strong style='color:#C28FE7'>Mike</strong>, your speech coach. I'm going to listen to you speak for 30 seconds and figure out how to help you improve." />
            </div>

            <button
              className="btn-primary"
              style={{ marginTop: 32, width: '100%', maxWidth: 320 }}
              onClick={() => setStep(1)}
            >
              Next
            </button>
          </motion.div>
        )}

        {/* Slide 2 — Camera Permission */}
        {step === 1 && (
          <motion.div
            key="slide-1"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 400 }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Mike state="talking" size={100} />
            </motion.div>

            <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '2px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '18px 24px', fontSize: 18, fontWeight: 700, lineHeight: 1.5, color: 'var(--text, rgba(255,255,255,0.9))', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <TalkingBubble text="I need to <strong style='color:#C28FE7'>see and hear</strong> you. Ready?" />
            </div>

            <button
              className="btn-primary"
              style={{ marginTop: 32, width: '100%', maxWidth: 320 }}
              onClick={() => nav('/scan')}
            >
              Start My Scan
            </button>

            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted, #777)', fontWeight: 500 }}>
              We never store your video or audio
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
