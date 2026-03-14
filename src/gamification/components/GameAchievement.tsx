import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Achievement {
  id: string
  label: string
  icon: string
}

interface GameAchievementProps {
  /** Current streak/value to check milestones against */
  value: number
  /** Milestone thresholds and their achievement text */
  milestones: { threshold: number; label: string; icon: string }[]
}

/**
 * Mid-game achievement toast — shows pop-up badges when milestones are hit.
 * Reusable across all games.
 */
export function GameAchievement({ value, milestones }: GameAchievementProps) {
  const [shown, setShown] = useState<Set<number>>(new Set())
  const [current, setCurrent] = useState<Achievement | null>(null)

  useEffect(() => {
    for (const m of milestones) {
      if (value >= m.threshold && !shown.has(m.threshold)) {
        setShown(s => new Set(s).add(m.threshold))
        setCurrent({ id: `${m.threshold}`, label: m.label, icon: m.icon })
        const t = setTimeout(() => setCurrent(null), 2500)
        return () => clearTimeout(t)
      }
    }
  }, [value, milestones, shown])

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ y: -40, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{
            position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
            zIndex: 100, pointerEvents: 'none',
            background: 'rgba(194,143,231,0.15)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(194,143,231,0.3)',
            borderRadius: 16, padding: '10px 20px',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <span style={{ fontSize: 22 }}>{current.icon}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{current.label}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
