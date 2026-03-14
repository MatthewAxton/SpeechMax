import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { TopBanner } from '../components/Banner'
import { TalkingBubble } from '../components/Mike'
import { useSessionStore } from '../../store/sessionStore'
import PROMPTS from '../../lib/prompts'
import type { PromptCategory } from '../../analysis/types'

type Tab = 'all' | PromptCategory | 'favorites'

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'casual', label: 'Casual' },
  { key: 'professional', label: 'Professional' },
  { key: 'interview', label: 'Interview' },
  { key: 'reading', label: 'Reading' },
  { key: 'favorites', label: 'Favorites' },
]

interface PromptItem {
  text: string
  category: string
}

export default function Library() {
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>('all')
  const favoritePrompts = useSessionStore((s) => s.favoritePrompts)
  const addFavoritePrompt = useSessionStore((s) => s.addFavoritePrompt)
  const removeFavoritePrompt = useSessionStore((s) => s.removeFavoritePrompt)

  const allPrompts: PromptItem[] = Object.entries(PROMPTS).flatMap(([cat, texts]) =>
    texts.map((text) => ({ text, category: cat }))
  )

  const filtered = tab === 'all' ? allPrompts
    : tab === 'favorites' ? allPrompts.filter((p) => favoritePrompts.includes(p.text))
    : allPrompts.filter((p) => p.category === tab)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBanner backTo="/queue" title="Prompt Library" />
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Mascot header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}
          >
            <img src="/IDLE.gif" alt="Mike" style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid rgba(194,143,231,0.3)', flexShrink: 0 }} />
            <div style={{
              background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
              padding: '12px 18px', flex: 1,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                <TalkingBubble text="Pick a prompt and hit <strong style='color:#C28FE7'>Practice</strong> to start a free session!" />
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '8px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                  background: tab === t.key ? 'var(--purple)' : 'rgba(255,255,255,0.08)',
                  color: tab === t.key ? 'white' : 'var(--muted)',
                  transition: 'all 0.2s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)', fontSize: 14, fontWeight: 600 }}>
              {tab === 'favorites' ? 'No favorite prompts yet. Tap the heart icon to save prompts.' : 'No prompts in this category.'}
            </div>
          )}

          <div style={{ display: 'grid', gap: 10 }}>
            {filtered.map((p, i) => {
              const isFav = favoritePrompts.includes(p.text)
              return (
                <motion.div
                  key={`${p.text.slice(0, 30)}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 18, padding: '16px 20px',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.7, marginBottom: 12 }}>{p.text}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '3px 10px',
                      borderRadius: 8, background: 'rgba(194,143,231,0.1)', color: 'var(--purple)',
                    }}>
                      {p.category}
                    </span>
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={() => isFav ? removeFavoritePrompt(p.text) : addFavoritePrompt(p.text)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: isFav ? '#FF4B6E' : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }}
                    >
                      <Heart size={18} fill={isFav ? '#FF4B6E' : 'none'} />
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ height: 32, fontSize: 12, padding: '0 16px' }}
                      onClick={() => nav('/practice', { state: { prompt: p.text } })}
                    >
                      Practice
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
