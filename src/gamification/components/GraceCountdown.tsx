import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GraceCountdownProps {
  onReady: () => void
  prompt?: string
  promptLabel?: string
}

const ease = [0.25, 0.46, 0.45, 0.94] as const

export function GraceCountdown({ onReady, prompt, promptLabel }: GraceCountdownProps) {
  const [count, setCount] = useState(5)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) return
    if (count === 0) {
      setTimeout(() => { setDone(true); onReady() }, 800)
      return
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, done, onReady])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease }}
          style={{
            position: 'absolute', inset: 0, zIndex: 100,
            background: 'white',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 24,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={count}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.35, ease }}
              style={{
                width: 110, height: 110, borderRadius: '50%',
                background: count > 0 ? 'white' : 'var(--purple)',
                border: '4px solid var(--purple)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 28px rgba(194,143,231,0.2)',
              }}
            >
              <span style={{
                fontSize: count > 0 ? 52 : 30, fontWeight: 900,
                lineHeight: 1,
                ...(count > 0
                  ? { background: 'linear-gradient(135deg, #C28FE7, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
                  : { color: 'white' }),
              }}>
                {count > 0 ? count : 'GO!'}
              </span>
            </motion.div>
          </AnimatePresence>

          {prompt && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease }}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20,
                padding: '18px 28px', textAlign: 'center', maxWidth: 480,
              }}
            >
              {promptLabel && (
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', marginBottom: 8 }}>{promptLabel}</div>
              )}
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', lineHeight: 1.5 }}>{prompt}</div>
            </motion.div>
          )}

          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}
          >
            {count > 0 ? 'Read the prompt and get ready...' : ''}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
