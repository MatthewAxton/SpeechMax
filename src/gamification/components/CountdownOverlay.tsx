import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playCountdownBeep, playGoTone } from '../../lib/sounds'

interface CountdownOverlayProps {
  onComplete: () => void
}

export default function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
  const [count, setCount] = useState(3)

  useEffect(() => {
    if (count > 0) {
      playCountdownBeep()
      const timer = setTimeout(() => setCount((c) => c - 1), 1000)
      return () => clearTimeout(timer)
    }

    if (count === 0) {
      playGoTone()
      const timer = setTimeout(() => onComplete(), 800)
      return () => clearTimeout(timer)
    }
  }, [count, onComplete])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        background: '#050508',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AnimatePresence mode="wait">
        {count > 0 ? (
          <motion.div
            key={count}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              fontSize: 120,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #c28fe7, #9b59d0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {count}
          </motion.div>
        ) : (
          <motion.div
            key="go"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #c28fe7, #9b59d0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 52,
                  fontWeight: 800,
                  color: '#fff',
                  letterSpacing: 2,
                  userSelect: 'none',
                }}
              >
                GO!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
