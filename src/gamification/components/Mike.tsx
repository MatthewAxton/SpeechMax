import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playTalkBlip } from '../../lib/sounds'

interface MikeProps { state?: 'idle' | 'talking'; size?: number }

export function Mike({ state = 'idle', size = 80 }: MikeProps) {
  const src = state === 'talking' ? '/talking.gif' : '/IDLE.gif'
  return (
    <div style={{ width: size + 16, height: size + 16, borderRadius: '50%', background: 'var(--surface)', padding: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 24px rgba(0,0,0,0.3)' }}>
      <img src={src} width={size} height={size} style={{ objectFit: 'contain' }} alt="Mike" />
    </div>
  )
}

export function MikeSmall({ state = 'talking' }: { state?: 'idle' | 'talking' }) {
  return (
    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', padding: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img src={state === 'talking' ? '/talking.gif' : '/IDLE.gif'} width={38} height={38} style={{ objectFit: 'contain' }} alt="Mike" />
    </div>
  )
}

export function TalkingBubble({ text }: { text: string }) {
  const plainText = text.replace(/<[^>]*>/g, '')
  const [charIndex, setCharIndex] = useState(0)
  const done = charIndex >= plainText.length
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setCharIndex(0)
    intervalRef.current = setInterval(() => {
      setCharIndex(prev => {
        const next = prev + 1
        if (next <= plainText.length) {
          const ch = plainText[prev]
          if (ch && ch !== ' ') playTalkBlip()
        }
        if (next >= plainText.length) {
          if (intervalRef.current) clearInterval(intervalRef.current)
        }
        return next
      })
    }, 40)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [text, plainText])

  if (done) {
    return <span dangerouslySetInnerHTML={{ __html: text }} />
  }

  return <span>{plainText.slice(0, charIndex)}<span style={{ opacity: charIndex % 2 === 0 ? 1 : 0.3 }}>|</span></span>
}

interface MikeWithBubbleProps { text: string; state?: 'idle' | 'talking'; size?: number; delay?: number }

export function MikeWithBubble({ text, size = 80, delay = 1.0 }: MikeWithBubbleProps) {
  const [phase, setPhase] = useState<'idle' | 'talking'>('idle')
  const [showBubble, setShowBubble] = useState(false)
  const [bounced, setBounced] = useState(false)

  const smoothEaseOut = [0.25, 0.46, 0.45, 0.94] as const

  useEffect(() => {
    const plainText = text.replace(/<[^>]*>/g, '')
    const speakDuration = Math.max(3000, plainText.length * 100)
    const tBounce = setTimeout(() => { setBounced(true) }, delay * 1000)
    const tBubble = setTimeout(() => { setPhase('talking'); setShowBubble(true) }, delay * 1000 + 350)
    const tIdle = setTimeout(() => { setPhase('idle') }, delay * 1000 + 350 + speakDuration)
    return () => { clearTimeout(tBounce); clearTimeout(tBubble); clearTimeout(tIdle) }
  }, [delay, text])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, minHeight: size + 80 }}>
      <motion.div
        animate={bounced ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, ease: smoothEaseOut }}
      >
        <Mike state={phase} size={size} />
      </motion.div>
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, ease: smoothEaseOut }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ duration: 0.5, ease: smoothEaseOut, delay: 0.2 }}
              style={{ transformOrigin: 'top center' }}
            >
              <div style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid rgba(255,255,255,0.08)', margin: '0 auto' }} />
              <div style={{ width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '7px solid rgba(255,255,255,0.06)', margin: '-7px auto 0' }} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: smoothEaseOut, delay: 0.4 }}
              style={{ transformOrigin: 'top center', background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '2px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 22px', fontSize: 16, fontWeight: 600, color: 'var(--text)', maxWidth: 360, textAlign: 'center', lineHeight: 1.4, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
            >
              <TalkingBubble text={text} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
