import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mike } from '../components/Mike'
import { useSessionStore } from '../../store/sessionStore'

const ease = [0.25, 0.46, 0.45, 0.94] as const

const slideVariants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
}

export default function Onboarding() {
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const getUnusedPrompt = useSessionStore((s) => s.getUnusedPrompt)
  const markPromptUsed = useSessionStore((s) => s.markPromptUsed)

  // Get 3 prompts (one per category) — memoized so they don't change on re-render
  const prompts = useMemo(() => [
    { category: 'Casual', prompt: getUnusedPrompt('casual') },
    { category: 'Professional', prompt: getUnusedPrompt('professional') },
    { category: 'Interview', prompt: getUnusedPrompt('interview') },
  ], [getUnusedPrompt])

  const handleSelectPrompt = (prompt: string) => {
    setSelectedPrompt(prompt)
    markPromptUsed(prompt)
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'white', padding: '40px 24px', position: 'relative',
    }}>
      {/* Step dots */}
      <div style={{ position: 'absolute', top: 32, display: 'flex', gap: 8 }}>
        {[0, 1, 2].map((i) => (
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

            <div style={{ marginTop: 24, background: 'white', border: '2px solid var(--border, #E5D5F7)', borderRadius: 20, padding: '20px 28px', fontSize: 17, fontWeight: 600, lineHeight: 1.6, color: 'var(--text, #1A1A1A)', boxShadow: '0 4px 20px rgba(194,143,231,0.1)' }}>
              Hey! I'm <strong style={{ color: 'var(--purple, #C28FE7)' }}>Mike</strong>, your speech coach. I'm going to listen to you speak for 30 seconds and figure out how to help you improve.
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

        {/* Slide 2 — Prompt Picker */}
        {step === 1 && (
          <motion.div
            key="slide-1"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 480 }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: 'var(--text, #1A1A1A)' }}>Pick a topic to speak about</div>
            <div style={{ fontSize: 14, color: 'var(--muted, #777)', marginBottom: 24 }}>You'll speak about this for 30 seconds</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
              {prompts.map((p) => {
                const isSelected = selectedPrompt === p.prompt
                return (
                  <motion.button
                    key={p.prompt}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectPrompt(p.prompt)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '16px 20px', borderRadius: 16, cursor: 'pointer',
                      background: isSelected ? 'rgba(194,143,231,0.08)' : 'white',
                      border: isSelected ? '2px solid var(--purple, #C28FE7)' : '1px solid var(--border, #E5D5F7)',
                      fontFamily: 'Nunito, sans-serif',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--purple, #C28FE7)', marginBottom: 4 }}>{p.category}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text, #1A1A1A)', lineHeight: 1.4 }}>{p.prompt}</div>
                  </motion.button>
                )
              })}
            </div>

            <button
              className="btn-primary"
              style={{ marginTop: 28, width: '100%', maxWidth: 320, opacity: selectedPrompt ? 1 : 0.4, pointerEvents: selectedPrompt ? 'auto' : 'none' }}
              onClick={() => setStep(2)}
            >
              Next
            </button>
          </motion.div>
        )}

        {/* Slide 3 — Camera Permission */}
        {step === 2 && (
          <motion.div
            key="slide-2"
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

            <div style={{ marginTop: 20, background: 'white', border: '2px solid var(--border, #E5D5F7)', borderRadius: 20, padding: '18px 24px', fontSize: 18, fontWeight: 700, lineHeight: 1.5, color: 'var(--text, #1A1A1A)', boxShadow: '0 4px 20px rgba(194,143,231,0.1)' }}>
              I need to <strong style={{ color: 'var(--purple, #C28FE7)' }}>see and hear</strong> you. Ready?
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
