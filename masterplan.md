# SpeechMAX Master Plan

## Context

SpeechMAX is a browser-based AI speech coach for UNIHACK 2026. React + TypeScript + Vite. Uses Web Speech API, Web Audio API, and MediaPipe for real-time speech analysis. All 5 mini-games connect to real analysis modules and produce real scores.

**Design rule (non-negotiable):** `#050508` background, glass cards (`rgba(255,255,255,0.06)` + `backdrop-filter: blur(20px)`), `#c28fe7` purple accent, `rgba(255,255,255,0.x)` text hierarchy.

---

## Sprint 1: Data Integrity [COMPLETE]

### 1.1 — localStorage persistence for all Zustand stores [DONE]
### 1.2 — Wire real sensor data into RadarScan [DONE]
### 1.3 — Wire real game metrics into ScoreCard [DONE]

---

## Sprint 2: Dark Theme Conversion [COMPLETE]

### 2.1 — Convert gamification CSS to dark theme [DONE]
### 2.2 — Convert all screen inline styles to dark theme [DONE]

---

## Sprint 3: UX Flow Completion [COMPLETE]

### 3.1 — Blackout transition: scan → results [DONE]
### 3.2 — Rescan flow with radar overlay [DONE]
### 3.3 — Per-game prompt picker [DONE]
### 3.4 — Wire difficulty auto-scaling [DONE]
### 3.5 — Route guards [DONE]
### 3.6 — Hide DevMenu in production [DONE]
### 3.7 — ErrorBoundary [DONE]

---

## Sprint 4: Game Visual Upgrades [COMPLETE]

### 4.1 — Filler Ninja: floating targets + slash animation [DONE]
### 4.2 — Eye Lock: full-screen pulse/dim [DONE]
### 4.3 — Pitch Surfer: ocean wave + surfing mascot [DONE]
### 4.4 — Statue Mode: body outline heatmap [DONE]
### 4.5 — Pace Racer: glow/pulse effects [DONE]

---

## Sprint 5: Sound & Final Polish [COMPLETE]

### 5.1 — Sound FX system (oscillator-based) [DONE]
### 5.2 — Visual QA pass (dark theme tokens + progress bar) [DONE]
### 5.3 — Performance (lazy loading + MediaPipe frame-skipping) [DONE]

---

## Sprint 6: Per-Game Intro Screens [COMPLETE]

> Replace shared Countdown.tsx with unique intro screens built into each game.

### 6.1 — Shared components [DONE]

Created `GameIntro.tsx` (split left/right layout with mascot, hero visual, instructions, prompt, 3-2-1 countdown built-in) and `CountdownOverlay.tsx`.

**Files:**
- New: `src/gamification/components/GameIntro.tsx`
- New: `src/gamification/components/CountdownOverlay.tsx`

### 6.2 — Per-game intro phases [DONE]

Each game has `phase: 'intro' | 'playing'` state machine. Intro shows game-specific hero visual:
- **FillerNinja** — floating filler word bubbles
- **EyeLock** — pulsing green dot with concentric rings
- **PaceRacer** — animated pace bar preview
- **PitchSurfer** — undulating wave SVG
- **StatueMode** — body silhouette outline

### 6.3 — Remove Countdown.tsx [DONE]

Deleted shared Countdown screen and route. GameQueue paths simplified from `/countdown?next=/X` to `/X`. ScoreCard replay paths updated.

**Files modified:** All 5 game screens, `GameQueue.tsx`, `ScoreCard.tsx`, `DevMenu.tsx`, `App.tsx`

---

## Sprint 7: Fullscreen Camera + Glass HUD [COMPLETE]

> Camera games (EyeLock, StatueMode, RadarScan) redesigned with fullscreen camera feed and floating glass overlay cards.

### 7.1 — Fullscreen camera layout [DONE]

Camera fills the entire viewport. All UI elements (timer, stats, prompt, back button, finish early) float as semi-transparent glass cards with backdrop blur.

Glass card style: `background: rgba(0,0,0,0.5)`, `backdropFilter: blur(16px)`, `borderRadius: 14`, `border: 1px solid rgba(255,255,255,0.1)`

**Files:** `EyeLock.tsx`, `StatueMode.tsx`, `RadarScan.tsx`

### 7.2 — Eye tracking video ref fix [DONE]

Replaced fragile `document.querySelector('video')` with proper `onVideoRef` callback from CameraFeed. Eliminates race condition where model loads before video element exists.

---

## Sprint 8: Dashboard & UX Improvements [COMPLETE]

### 8.1 — Dashboard enhancements [DONE]
- Lucide icons replace emojis on game cards (Crosshair, Eye, Activity, Waves, Shield)
- Wider radar chart (340px container, 280px chart) so axis labels display properly
- Top Awards badge row with earned badge names + "View All" link to Progress
- Mascot tip popup with random coaching tips

### 8.2 — Remove mascot/bottom banner from non-game screens [DONE]
- Removed `MikeWithBubble` and `BottomBanner` from Progress, ScoreCard, RadarResults, RadarScan
- Games/Rescan buttons moved to Progress top banner

### 8.3 — Progress page redesign [DONE]
- Split layout: radar + stats left, personal bests + badges right
- Score deltas from previous scan
- Overall trend indicator
- Share Results button (UI only)

### 8.4 — ScoreCard coaching tips [DONE]
- Per-game coaching tips based on actual metrics
- "Coach's Tip" card with contextual advice

---

## Sprint 9: Analysis Engine Improvements [COMPLETE]

### 9.1 — MediaPipe sensitivity tuning [DONE]
- Gaze: good threshold 0.65→0.55, weak 0.35→0.30, EMA alpha 0.3→0.2
- Pose: head stability multiplier 15→8, hand movement 8→4, fidget threshold 0.35→0.5
- Result: normal speaking gestures no longer flagged, more forgiving eye contact

### 9.2 — Pitch scoring fix [DONE]
- Variation multiplier increased from 1.5x to 3x
- Typical speech (20-30Hz std dev) now produces meaningful scores

### 9.3 — Filler detection improvements [DONE]
- Added 11 more filler words: er, ah, hmm, uhh, umm, well, okay so, honestly, yeah, just, i guess
- Rewrote detection with count-based tracking (not position-based) for accurate repeated word detection
- Processes interim transcripts for faster detection

### 9.4 — Speech recognition reliability [DONE]
- Restart gap reduced from 200ms to 50ms
- `maxAlternatives: 3` for better word recognition
- Error state cleared on successful results
- Smart error handling (only restart on recoverable errors)

### 9.5 — Filler streak pauses during silence [DONE]
- Timer and streak only tick while user is actively speaking
- 3s silence threshold triggers pause
- Visual indicators: yellow "PAUSED" badge on timer, progress bar turns yellow, streak counter dims with "paused — speak to continue" label

### 9.6 — Finish Early button [DONE]
- Added to PitchSurfer, EyeLock, StatueMode (prompt-based games)
- Appears after 10 seconds of gameplay
- Uses actual elapsed time for scoring

---

## Key Architecture

| Area | Files |
|------|-------|
| **Stores** | `src/store/{scanStore,gameStore,sessionStore}.ts` |
| **Game Screens** | `src/gamification/screens/*.tsx` |
| **Shared Components** | `src/gamification/components/{GameIntro,CountdownOverlay,Banner,CameraFeed,AudioWave,RadarChart}` |
| **Analysis** | `src/analysis/{speech,audio,mediapipe}/*.ts` |
| **Scoring** | `src/analysis/scoring/{radarScorer,gameScorer}.ts` |
| **Sounds** | `src/lib/sounds.ts` |
| **Badges/Prompts** | `src/lib/{badges,prompts}.ts` |

---

## Known Limitations

| Issue | Impact | Notes |
|-------|--------|-------|
| Web Speech API merges repeated words server-side | Filler detection may miss "um um um" → "um" | Chrome limitation, no client fix. Deepgram Nova-3 would solve this ($200 free credit) |
| 50ms restart gap in speech recognition | Occasional missed words during Chrome session reset | Near-optimal; further reduction risks race conditions |
| MediaPipe + Web Speech API CPU load | Possible jank on low-end hardware | Frame-skipping (every 2nd frame) mitigates |
| `SpeechRecognition` not available in all browsers | Firefox/Safari have limited support | Simulation fallback activates after 5s |

---

## Build & Verify

```bash
npx tsc --noEmit    # Type check
npm run build       # Production build
npm run dev         # Dev server
```
