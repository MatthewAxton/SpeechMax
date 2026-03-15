import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Send, X } from 'lucide-react'
import { sendToGemini } from '../../lib/geminiClient'
import { buildMikeSystemPrompt } from '../../lib/buildMikeSystemPrompt'
import { TalkingBubble } from './Mike'

interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

const HIDDEN_ROUTES = ['/filler-ninja', '/eye-lock', '/pace-racer', '/pitch-surfer', '/statue-mode', '/scan']

const INTRO_KEY = 'mike-chat-intro-seen'

export default function MikeChat() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTalking, setIsTalking] = useState(false)
  const [talkingKey, setTalkingKey] = useState(0)
  const [showIntro, setShowIntro] = useState(() => !localStorage.getItem(INTRO_KEY))
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const systemPromptRef = useRef<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const mikeAvatar = isTalking ? `/talking.gif?k=${talkingKey}` : '/IDLE.gif'

  const hidden = HIDDEN_ROUTES.some((r) => location.pathname.startsWith(r))

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    if (showIntro) {
      setShowIntro(false)
      localStorage.setItem(INTRO_KEY, '1')
    }

    if (messages.length === 0) {
      const systemPrompt = buildMikeSystemPrompt()
      systemPromptRef.current = systemPrompt
      setMessages([
        { role: 'model', text: "Hey! I can see your speech data. Ask me anything about your scores or how to improve!" },
      ])
    }
  }, [showIntro, messages.length])

  const dismissIntro = useCallback(() => {
    if (showIntro) {
      setShowIntro(false)
      localStorage.setItem(INTRO_KEY, '1')
    }
  }, [showIntro])

  const handleSend = useCallback(async () => {
    console.log('[MikeChat] handleSend called, input:', input, 'loading:', loading)
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMsg: ChatMessage = { role: 'user', text: trimmed }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)
    setIsTalking(true)
    setTalkingKey(k => k + 1)

    try {
      const geminiMessages = [
        { role: 'user' as const, text: systemPromptRef.current ?? buildMikeSystemPrompt() },
        { role: 'model' as const, text: 'Understood! I\'m Mike, ready to help with speech coaching based on the user\'s data.' },
        ...updatedMessages,
      ]

      const response = await sendToGemini(geminiMessages)
      setMessages((prev) => [...prev, { role: 'model', text: response }])
    } catch {
      setMessages((prev) => [...prev, { role: 'model', text: "Oops, something went wrong. Try again!" }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  if (hidden) return null

  return (
    <>
      {/* Intro tooltip */}
      <AnimatePresence>
        {showIntro && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 1.5 }}
            onClick={dismissIntro}
            style={{
              position: 'fixed', bottom: 84, right: 20, zIndex: 101,
              background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14,
              padding: '10px 16px', maxWidth: 220,
              cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
              Chat with me! I can help with your scores.
            </div>
            <div style={{
              position: 'absolute', bottom: -6, right: 24,
              width: 12, height: 12, background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderTop: 'none', borderLeft: 'none',
              transform: 'rotate(45deg)',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed', bottom: 84, right: 20, zIndex: 101,
              width: 380, height: 500,
              background: 'rgba(20,20,28,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 16px 64px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              <img src={isTalking ? `/talking.gif?k=${talkingKey}` : '/IDLE.gif'} alt="Mike" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              <span style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>Chat with Mike</span>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8,
                  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '16px 14px',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', gap: 8,
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                  }}
                >
                  {msg.role === 'model' && (
                    <img
                      src={i === messages.length - 1 && isTalking ? mikeAvatar : '/IDLE.gif'} alt="Mike"
                      style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }}
                    />
                  )}
                  <div style={{
                    maxWidth: '80%',
                    background: msg.role === 'user'
                      ? 'rgba(194,143,231,0.15)'
                      : 'rgba(255,255,255,0.06)',
                    border: msg.role === 'user'
                      ? '1px solid rgba(194,143,231,0.3)'
                      : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    padding: '10px 14px',
                    fontSize: 13, fontWeight: 500, lineHeight: 1.5,
                    color: 'rgba(255,255,255,0.9)',
                  }}>
                    {msg.role === 'model' && i === messages.length - 1 && !loading
                      ? <TalkingBubble text={msg.text} onComplete={() => setIsTalking(false)} />
                      : msg.text
                    }
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <img src={`/talking.gif?k=${talkingKey}`} alt="Mike" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px 16px 16px 4px', padding: '10px 14px',
                  }}>
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      style={{ fontSize: 13, color: 'var(--muted)' }}
                    >
                      Mike is typing...
                    </motion.div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
              display: 'flex', gap: 8, padding: '12px 14px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Mike anything..."
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                  padding: '10px 14px', fontSize: 13, fontWeight: 500,
                  color: 'rgba(255,255,255,0.9)', outline: 'none',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: input.trim() ? 'var(--purple)' : 'rgba(255,255,255,0.06)',
                  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: input.trim() ? 'pointer' : 'default',
                  transition: 'background 0.2s',
                }}
              >
                <Send size={16} color={input.trim() ? 'white' : 'rgba(255,255,255,0.3)'} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mike avatar button */}
      <motion.button
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 100,
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(194,143,231,0.15)', border: '2px solid rgba(194,143,231,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(194,143,231,0.2)',
          padding: 0,
        }}
      >
        <img src={mikeAvatar} alt="Mike" style={{ width: 40, height: 40, borderRadius: '50%' }} />
      </motion.button>
    </>
  )
}
