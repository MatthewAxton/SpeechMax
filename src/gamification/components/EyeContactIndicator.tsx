/**
 * EyeContactIndicator — Visual red/green feedback overlay for eye contact.
 *
 * Shows:
 * - A target crosshair near the camera area (top-center) that the user should look at
 * - A pulsing ring that's GREEN when eye contact is good, RED when poor
 * - A text label: "Good eye contact" or "Look here ↑"
 * - A live score percentage
 * - The entire camera border glows green/red
 */
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'

interface EyeContactIndicatorProps {
  goodEyeContact: boolean
  eyeContactScore: number
  sessionPercent: number
  currentStreak: number
}

export function EyeContactIndicator({
  goodEyeContact,
  eyeContactScore,
  sessionPercent,
  currentStreak,
}: EyeContactIndicatorProps) {
  const green = '#58CC02'
  const red = '#FF4B4B'
  const color = goodEyeContact ? green : red

  return (
    <>
      {/* Full-screen subtle border glow */}
      <div
        style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit',
          boxShadow: `inset 0 0 30px ${goodEyeContact ? 'rgba(88,204,2,0.15)' : 'rgba(255,75,75,0.15)'}`,
          pointerEvents: 'none',
          transition: 'box-shadow 0.3s ease',
        }}
      />

      {/* Target crosshair — top center, where the camera is */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        pointerEvents: 'none',
      }}>
        {/* Pulsing target ring */}
        <motion.div
          animate={{
            scale: goodEyeContact ? [1, 1.1, 1] : [1, 1.2, 1],
            boxShadow: goodEyeContact
              ? [`0 0 0 4px ${green}40`, `0 0 0 8px ${green}20`, `0 0 0 4px ${green}40`]
              : [`0 0 0 4px ${red}40`, `0 0 0 10px ${red}20`, `0 0 0 4px ${red}40`],
          }}
          transition={{ repeat: Infinity, duration: goodEyeContact ? 2.5 : 1.2 }}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            border: `3px solid ${color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${color}15`,
            transition: 'border-color 0.3s, background 0.3s',
          }}
        >
          {/* Inner crosshair dot */}
          <motion.div
            animate={{ scale: goodEyeContact ? 1 : [1, 0.6, 1] }}
            transition={{ repeat: goodEyeContact ? 0 : Infinity, duration: 0.8 }}
            style={{
              width: 10, height: 10, borderRadius: '50%',
              background: color,
              transition: 'background 0.3s',
            }}
          />
        </motion.div>

        {/* "Look here" label */}
        <AnimatePresence mode="wait">
          <motion.div
            key={goodEyeContact ? 'good' : 'bad'}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: `${color}20`,
              border: `1.5px solid ${color}50`,
              borderRadius: 10, padding: '4px 10px',
              fontSize: 12, fontWeight: 700, color,
              transition: 'all 0.3s',
            }}
          >
            {goodEyeContact ? <Eye size={13} /> : <EyeOff size={13} />}
            {goodEyeContact ? 'Good eye contact' : 'Look here ↑'}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Score badge — bottom left */}
      <div style={{
        position: 'absolute', bottom: 14, left: 14,
        display: 'flex', flexDirection: 'column', gap: 4,
        pointerEvents: 'none',
      }}>
        <div style={{
          background: `${color}20`, border: `1.5px solid ${color}40`,
          borderRadius: 12, padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.3s',
        }}>
          <span style={{ fontSize: 20, fontWeight: 800, color, transition: 'color 0.3s' }}>
            {sessionPercent}%
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            session
          </span>
        </div>
      </div>

      {/* Streak badge — bottom right */}
      {currentStreak > 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            position: 'absolute', bottom: 14, right: 14,
            background: `${green}20`, border: `1.5px solid ${green}40`,
            borderRadius: 12, padding: '6px 12px',
            display: 'flex', alignItems: 'center', gap: 6,
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 800, color: green }}>
            {currentStreak}s
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: green, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            streak
          </span>
        </motion.div>
      )}

      {/* Live score bar across the bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
        background: `${red}30`, borderRadius: '0 0 inherit inherit',
        overflow: 'hidden',
      }}>
        <motion.div
          animate={{ width: `${eyeContactScore}%` }}
          transition={{ duration: 0.3 }}
          style={{
            height: '100%',
            background: color,
            borderRadius: 'inherit',
            transition: 'background 0.3s',
          }}
        />
      </div>
    </>
  )
}
