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

  return (
    <>
      {/* Full-frame subtle border glow */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
        boxShadow: `inset 0 0 60px ${color}20`,
        transition: 'box-shadow 0.5s ease',
      }} />

      {/* Eye tracking reticles — squared brackets with crosshair lines */}
      {[leftEyePos, rightEyePos].map((eyePos, i) => eyePos && (
        <div key={i} style={{
          position: 'absolute', pointerEvents: 'none',
          left: `${(1 - eyePos.x) * 100}%`,
          top: `${eyePos.y * 100}%`,
          width: 64, height: 64,
          marginLeft: -32, marginTop: -32,
          transition: 'left 0.1s ease-out, top 0.1s ease-out',
        }}>
          <svg width={64} height={64} style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}>
            {/* Corner brackets */}
            <path d="M4,18 L4,4 L18,4" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" style={{ transition: 'stroke 0.3s' }} />
            <path d="M46,4 L60,4 L60,18" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" style={{ transition: 'stroke 0.3s' }} />
            <path d="M60,46 L60,60 L46,60" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" style={{ transition: 'stroke 0.3s' }} />
            <path d="M18,60 L4,60 L4,46" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" style={{ transition: 'stroke 0.3s' }} />
            {/* Crosshair lines */}
            <line x1={32} y1={22} x2={32} y2={28} stroke={color} strokeWidth={1.5} opacity={0.6} />
            <line x1={32} y1={36} x2={32} y2={42} stroke={color} strokeWidth={1.5} opacity={0.6} />
            <line x1={22} y1={32} x2={28} y2={32} stroke={color} strokeWidth={1.5} opacity={0.6} />
            <line x1={36} y1={32} x2={42} y2={32} stroke={color} strokeWidth={1.5} opacity={0.6} />
            {/* Center dot */}
            <circle cx={32} cy={32} r={3} fill={color} style={{ transition: 'fill 0.3s', filter: `drop-shadow(0 0 4px ${color})` }} />
          </svg>
        </div>
      ))}

      {/* Loading indicator when eye tracking model is initializing */}
      {!leftEyePos && !rightEyePos && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          pointerEvents: 'none', textAlign: 'center',
        }}>
          <motion.div animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}
            style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
            Initializing eye tracking...
          </motion.div>
        </div>
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
