/**
 * EyeContactIndicator — Measurement-driven overlay for eye contact quality.
 *
 * This is NOT an instructional "look here" prompt.
 * It reflects the output of the gaze tracking engine:
 *   - Confidence ring that fills/drains based on measured gaze quality
 *   - Three-tier color state: green (good), amber (weak), red (lost)
 *   - Live confidence meter
 *   - Session percentage and streak counter
 *   - Head position indicator showing tracked yaw/pitch
 *
 * The UI updates are driven entirely by the tracking state.
 * No element tells the user where to look — it shows them how they're doing.
 */
import { motion } from 'framer-motion'
import type { GazeQuality } from '../../analysis/hooks/useEyeContact'

interface EyeContactIndicatorProps {
  quality: GazeQuality
  confidence: number          // 0–100 (smoothed)
  sessionPercent: number      // 0–100
  currentStreak: number       // seconds
  headYaw: number             // degrees (-45 to 45)
  headPitch: number           // degrees (-30 to 30)
  signals: {
    irisCenter: number        // 0–100
    headPose: number          // 0–100
    blendshape: number        // 0–100
  }
}

const QUALITY_COLORS: Record<GazeQuality, string> = {
  good: '#58CC02',
  weak: '#F5A623',
  lost: '#FF4B4B',
}

const QUALITY_LABELS: Record<GazeQuality, string> = {
  good: 'Engaged',
  weak: 'Drifting',
  lost: 'Disengaged',
}

export function EyeContactIndicator({
  quality, confidence, sessionPercent, currentStreak,
  headYaw, headPitch, signals,
}: EyeContactIndicatorProps) {
  const color = QUALITY_COLORS[quality]
  const label = QUALITY_LABELS[quality]

  // Confidence ring: SVG arc that fills based on confidence
  const ringRadius = 22
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference * (1 - confidence / 100)

  return (
    <>
      {/* ── Border glow driven by quality state ── */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
        boxShadow: `inset 0 0 40px ${color}25`,
        transition: 'box-shadow 0.5s ease',
      }} />

      {/* ── Confidence meter — top right ── */}
      <div style={{
        position: 'absolute', top: 14, right: 14, pointerEvents: 'none',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {/* Circular confidence gauge */}
        <div style={{ position: 'relative', width: 52, height: 52 }}>
          <svg width={52} height={52} style={{ transform: 'rotate(-90deg)' }}>
            {/* Background ring */}
            <circle cx={26} cy={26} r={ringRadius} fill="none"
              stroke="rgba(255,255,255,0.15)" strokeWidth={4} />
            {/* Confidence arc */}
            <circle cx={26} cy={26} r={ringRadius} fill="none"
              stroke={color} strokeWidth={4} strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.4s ease' }}
            />
          </svg>
          {/* Center number */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color, transition: 'color 0.4s ease',
          }}>
            {confidence}
          </div>
        </div>

        {/* Quality label + state */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <motion.div
            key={quality}
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              fontSize: 13, fontWeight: 800, color, letterSpacing: 0.3,
              textTransform: 'uppercase', transition: 'color 0.4s ease',
            }}
          >
            {label}
          </motion.div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
            Eye Contact
          </div>
        </div>
      </div>

      {/* ── Head position indicator — top left ── */}
      {/* Small dot that moves based on tracked head yaw/pitch */}
      <div style={{
        position: 'absolute', top: 14, left: 14, pointerEvents: 'none',
        width: 48, height: 48, borderRadius: 12,
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Crosshair lines */}
        <div style={{ position: 'absolute', width: 1, height: '100%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', width: '100%', height: 1, background: 'rgba(255,255,255,0.1)' }} />
        {/* Head position dot */}
        <motion.div
          animate={{
            x: Math.max(-16, Math.min(16, headYaw * 0.7)),
            y: Math.max(-12, Math.min(12, headPitch * 0.7)),
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: color,
            boxShadow: `0 0 6px ${color}80`,
            transition: 'background 0.4s ease, box-shadow 0.4s ease',
          }}
        />
      </div>

      {/* ── Session stats — bottom left ── */}
      <div style={{
        position: 'absolute', bottom: 14, left: 14, pointerEvents: 'none',
        display: 'flex', gap: 8,
      }}>
        {/* Session % */}
        <div style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, padding: '5px 10px',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: sessionPercent >= 70 ? '#58CC02' : sessionPercent >= 40 ? '#F5A623' : '#FF4B4B' }}>
            {sessionPercent}%
          </span>
          <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            session
          </span>
        </div>
      </div>

      {/* ── Streak counter — bottom right (only when > 0) ── */}
      {currentStreak > 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            position: 'absolute', bottom: 14, right: 14, pointerEvents: 'none',
            background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(88,204,2,0.3)',
            borderRadius: 10, padding: '5px 10px',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 800, color: '#58CC02' }}>
            {currentStreak}s
          </span>
          <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            streak
          </span>
        </motion.div>
      )}

      {/* ── Confidence bar — full width at bottom edge ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: 'rgba(255,255,255,0.1)', borderRadius: '0 0 inherit inherit',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${confidence}%`,
          background: color, borderRadius: 'inherit',
          transition: 'width 0.4s ease, background 0.4s ease',
        }} />
      </div>

      {/* ── Signal breakdown — bottom center (small, subtle) ── */}
      <div style={{
        position: 'absolute', bottom: 42, left: '50%', transform: 'translateX(-50%)',
        pointerEvents: 'none', display: 'flex', gap: 12,
      }}>
        {[
          { label: 'Iris', value: signals.irisCenter },
          { label: 'Pose', value: signals.headPose },
          { label: 'Gaze', value: signals.blendshape },
        ].map(s => (
          <div key={s.label} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
          }}>
            <div style={{
              width: 28, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${s.value}%`, background: color,
                transition: 'width 0.3s ease, background 0.4s ease',
              }} />
            </div>
            <span style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
