import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const routes = [
  { path: '/', label: 'Homepage' },
  { path: '/onboarding', label: 'Onboarding' },
  { path: '/scan', label: 'Radar Scan' },
  { path: '/results', label: 'Radar Results' },
  { path: '/queue', label: 'Game Queue' },
  { path: '/filler-ninja', label: 'Filler Ninja' },
  { path: '/eye-lock', label: 'Eye Lock' },
  { path: '/pace-racer', label: 'Pace Racer' },
  { path: '/pitch-surfer', label: 'Pitch Surfer' },
  { path: '/statue-mode', label: 'Statue Mode' },
  { path: '/score/filler', label: 'Score: Filler Ninja' },
  { path: '/score/eyelock', label: 'Score: Eye Lock' },
  { path: '/score/pitch', label: 'Score: Pitch Surfer' },
  { path: '/progress', label: 'Progress' },
]

export function DevMenu() {
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const loc = useLocation()

  return (
    <>
      <div onClick={() => setOpen(!open)} style={{
        position: 'fixed', bottom: 16, left: 16, width: 44, height: 44,
        borderRadius: 12, background: 'var(--purple)', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', zIndex: 1000, boxShadow: '0 4px 12px rgba(194,143,231,0.4)',
      }}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </div>
      {open && (
        <div style={{
          position: 'fixed', bottom: 68, left: 16, width: 220,
          background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
          padding: 8, zIndex: 1000, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          maxHeight: '70vh', overflowY: 'auto',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--muted)', padding: '8px 12px' }}>Dev Navigation</div>
          {routes.map(r => (
            <div key={r.path} onClick={() => { nav(r.path); setOpen(false) }} style={{
              padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
              background: loc.pathname === r.path ? 'var(--surface)' : 'transparent',
              color: loc.pathname === r.path ? 'var(--purple)' : 'var(--text)',
            }}>
              {r.label}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
