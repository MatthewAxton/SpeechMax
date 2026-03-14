import { motion } from 'framer-motion'
import type { GazeQuality } from '../../analysis/hooks/useEyeContact'

interface EyeContactIndicatorProps {
  quality: GazeQuality
  confidence: number
  sessionPercent: number
  currentStreak: number
  headYaw: number
  headPitch: number
  signals: { irisCenter: number; headPose: number; blendshape: number }
  leftEyePos: { x: number; y: number } | null
  rightEyePos: { x: number; y: number } | null
}

const QUALITY_COLORS: Record<GazeQuality, string> = {
  good: '#58CC02',
  weak: '#FCD34D',
  lost: '#FF4B4B',
}

export function EyeContactIndicator({
  quality, confidence, sessionPercent, currentStreak,
  leftEyePos, rightEyePos,
}: EyeContactIndicatorProps) {
  const color = QUALITY_COLORS[quality]
  const ringSize = 52

  return (
    <>
      {/* Full-frame subtle border glow */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
        boxShadow: `inset 0 0 60px ${color}20`,
        transition: 'box-shadow 0.5s ease',
      }} />

      {/* Eye tracking circles — positioned at actual eye locations */}
      {leftEyePos && (
        <motion.div
          animate={{
            left: `${(1 - leftEyePos.x) * 100}%`,
            top: `${leftEyePos.y * 100}%`,
          }}
          transition={{ type: 'spring', stiffness: 150, damping: 20 }}
          style={{
            position: 'absolute', pointerEvents: 'none',
            width: ringSize, height: ringSize,
            marginLeft: -ringSize / 2, marginTop: -ringSize / 2,
          }}
        >
          <svg width={ringSize} height={ringSize}>
            <circle cx={ringSize / 2} cy={ringSize / 2} r={ringSize / 2 - 3} fill="none"
              stroke={color} strokeWidth={3} opacity={0.8}
              style={{ transition: 'stroke 0.3s ease', filter: `drop-shadow(0 0 8px ${color}80)` }} />
            <circle cx={ringSize / 2} cy={ringSize / 2} r={4} fill={color}
              style={{ transition: 'fill 0.3s ease' }} />
          </svg>
        </motion.div>
      )}

      {rightEyePos && (
        <motion.div
          animate={{
            left: `${(1 - rightEyePos.x) * 100}%`,
            top: `${rightEyePos.y * 100}%`,
          }}
          transition={{ type: 'spring', stiffness: 150, damping: 20 }}
          style={{
            position: 'absolute', pointerEvents: 'none',
            width: ringSize, height: ringSize,
            marginLeft: -ringSize / 2, marginTop: -ringSize / 2,
          }}
        >
          <svg width={ringSize} height={ringSize}>
            <circle cx={ringSize / 2} cy={ringSize / 2} r={ringSize / 2 - 3} fill="none"
              stroke={color} strokeWidth={3} opacity={0.8}
              style={{ transition: 'stroke 0.3s ease', filter: `drop-shadow(0 0 8px ${color}80)` }} />
            <circle cx={ringSize / 2} cy={ringSize / 2} r={4} fill={color}
              style={{ transition: 'fill 0.3s ease' }} />
          </svg>
        </motion.div>
      )}

      {/* Session stats — top right */}
      <div style={{
        position: 'absolute', top: 12, right: 12, pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end',
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          borderRadius: 10, padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 18, fontWeight: 800, color, transition: 'color 0.3s' }}>{confidence}%</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
            {quality === 'good' ? 'Locked' : quality === 'weak' ? 'Drifting' : 'Lost'}
          </span>
        </div>
      </div>

      {/* Session % — bottom left */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12, pointerEvents: 'none',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
        borderRadius: 10, padding: '5px 10px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: sessionPercent >= 70 ? '#58CC02' : sessionPercent >= 40 ? '#FCD34D' : '#FF4B4B' }}>
          {sessionPercent}%
        </span>
        <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>session</span>
      </div>

      {/* Streak — bottom right */}
      {currentStreak > 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            position: 'absolute', bottom: 12, right: 12, pointerEvents: 'none',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(88,204,2,0.3)',
            borderRadius: 10, padding: '5px 10px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 800, color: '#58CC02' }}>{currentStreak}s</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>streak</span>
        </motion.div>
      )}

      {/* Confidence bar — bottom edge */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${confidence}%`,
          background: color, transition: 'width 0.4s ease, background 0.4s ease',
        }} />
      </div>
    </>
  )
}
