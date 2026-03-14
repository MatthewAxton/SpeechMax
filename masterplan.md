# SpeechMAX Master Plan

## Context

SpeechMAX is a browser-based AI speech coach for UNIHACK 2026. The app has a strong foundation — real browser APIs (Web Speech, Web Audio, MediaPipe) power speech recognition, filler detection, WPM tracking, pitch analysis, gaze tracking, and pose estimation. All 5 mini-games connect to real analysis modules and produce real scores.

**However, the app has critical gaps that make it feel like a prototype rather than a product:**

1. **RadarScan throws away real data** — eye contact, posture, pitch variation, stillness, fidgets are all HARDCODED despite sensors running
2. **No persistence** — all progress, scores, badges, streaks lost on page refresh
3. **Theme split** — homepage is dark (#050508), all gamification screens are white/light
4. **ScoreCard is mocked** — games don't save results to the store before navigating to ScoreCard
5. **Game visuals don't match the brief** — no floating targets, no ocean wave, no heatmap
6. **Missing UX flows** — no blackout transition, no rescan overlay, no per-game prompts, no route guards, no sound FX

**Design rule (non-negotiable):** The homepage splash and goal screens are the visual reference. Every screen must use: `#050508` background, glass cards (`rgba(255,255,255,0.06)` + `backdrop-filter: blur(20px)`), `#c28fe7` purple accent, `rgba(255,255,255,0.x)` text hierarchy.

---

## Git Rules

- **Branch:** All work happens on `bruno/master-plan`. NEVER push to `main`.
- **Push command:** `git push origin bruno/master-plan`
- **PRs:** When ready, open PR from `bruno/master-plan` → `main`. Do not merge directly.
- Commit after each completed sprint task with a descriptive message.

---

## Execution Order

```
Sprint 1 (Data Integrity)     Sprint 2 (Dark Theme)
  1.1 Persistence [M]           2.1 CSS conversion [M]
  1.2 Sensor wiring [L]   ←→   2.2 Inline styles [M]
  1.3 ScoreCard wiring [M]     (CAN RUN IN PARALLEL - zero code overlap)
         ↓                              ↓
         └──────────┬───────────────────┘
                    ↓
              Sprint 3 (UX Flows)
              3.1-3.7 [S-M each]
                    ↓
              Sprint 4 (Game Visuals)
              4.1-4.5 [S-M each]
                    ↓
              Sprint 5 (Sound & Polish)
              5.1-5.3 [S-M each]
```

- Sprint 1 + Sprint 2 can be fully parallelized (different files, zero overlap)
- Within Sprint 3, tasks 3.1–3.7 are independent
- Within Sprint 4, all 5 game upgrades are independent files
- Sprint 5 depends on all prior sprints being complete

---

## Sprint 1: Data Integrity (Wire Everything Real) [COMPLETE]

> Without real data flowing end-to-end, the app is a tech demo with hardcoded numbers. This sprint makes every score genuine.

### 1.1 — Add localStorage persistence to all Zustand stores [DONE]

**Why:** Demo judges will refresh the page. All progress vanishes.

**Files:**
- `src/store/scanStore.ts` — wrap with `persist({ name: 'speechmax-scan' })`
- `src/store/gameStore.ts` — wrap with `persist({ name: 'speechmax-game' })`
- `src/store/sessionStore.ts` — wrap with `persist({ name: 'speechmax-session' })` + custom serializer for `Set<string>` fields (`usedPrompts`, `earnedBadges`)

**Gotcha:** `gameStore` imports `useScanStore.getState()` at runtime for difficulty/recommendations. Verify hydration order doesn't cause stale reads. Use Zustand's `onRehydrateStorage` callback if needed.

#### Discovered gap: Set serialization

`sessionStore` uses `Set<string>` for `usedPrompts` and `earnedBadges`. `JSON.stringify` converts Sets to `{}`. Must add a custom `storage` option with `serialize`/`deserialize` that converts `Set` ↔ `Array`.

---

### 1.2 — Wire real sensor data into RadarScan [DONE]

**Why:** The ENTIRE radar scoring system is meaningless — 5 of 7 inputs are hardcoded.

**Current state** (`src/gamification/screens/RadarScan.tsx` lines 64-75):
```
eyeContactPercent: 70,    // HARDCODED — gazeEngine running but data discarded
postureScore: 75,          // HARDCODED — poseTracker running but data discarded
pitchStdDev: 35,           // HARDCODED — pitchAnalyzer running but data discarded
stillnessPercent: 80,      // HARDCODED
fidgetCount: 2,            // HARDCODED
wordCount: 0,              // NOT TRACKED
wpmStdDev: 10,             // HARDCODED
```

**Fix:** Add `useRef` accumulators that subscribe to each engine's callbacks during the 30s scan:
- `onGazeReading` → accumulate good/total frames → `eyeContactPercent`
- `onPoseFrame` → accumulate `postureScore[]`, count still/fidget frames → `postureScore`, `stillnessPercent`, `fidgetCount`
- `onAudioFrame` → collect non-zero pitch readings → compute `pitchStdDev` via std deviation
- `onTranscript` → count final words → `wordCount`
- Export `getWpmStdDev()` from `src/analysis/speech/wpmTracker.ts`

**Also requires:** Initialize `gazeEngine` and `poseTracker` in RadarScan (currently only initialized in individual game screens).

**Files:**
- `src/gamification/screens/RadarScan.tsx` — main integration
- `src/analysis/speech/wpmTracker.ts` — implement and export `getWpmStdDev()`
- `src/gamification/components/CameraFeed.tsx` — expose existing internal `videoRef` via callback prop

**Risk:** Running FaceLandmarker + PoseLandmarker + PitchAnalyzer simultaneously. Test on demo hardware. Add frame-skipping (every 2nd frame) if fps drops below 20.

#### Discovered gaps in this task

**`getWpmStdDev()` does not exist** [CRITICAL]
`wpmTracker.ts` exports `getSessionWpm()`, `getRollingWpm()`, `startWpmTracking()`, `stopWpmTracking()`, `onWpmReading()` — but NO `getWpmStdDev()`. RadarScan hardcodes `wpmStdDev: 10` and `radarScorer.ts` uses it in the pacing formula. **Fix:** Implement `getWpmStdDev()` by collecting rolling WPM samples into a buffer and computing standard deviation.

**`wordCount` not tracked** [CRITICAL]
RadarScan sets `wordCount: 0`. Transcriber emits `TranscriptEvent` with `wordCount` per event but nobody accumulates the total during a scan. **Fix:** Add a `useRef` accumulator in RadarScan that sums `wordCount` from final transcript events.

**CameraFeed videoRef already exists internally** [LOW]
CameraFeed already has `const videoRef = useRef<HTMLVideoElement>(null)`. Don't create a new ref — expose the existing one via a callback prop: `onVideoRef?: (el: HTMLVideoElement) => void`.

**`sessionStore.recordScan()` never called** [MEDIUM]
`sessionStore` has `recordScan()` for tracking engagement stats (`totalScans`). RadarScan never calls it. **Fix:** Call `recordScan()` on scan completion. Also call `checkBadges()` after to evaluate badge conditions.

---

### 1.3 — Wire real game metrics into ScoreCard [DONE]

**Why:** Games compute real scores but never save them. ScoreCard shows hardcoded mock data.

**Current state:** Each game navigates to `/score/:game` but never calls `addGameResult()`. ScoreCard has a `data` dictionary with hardcoded scores (lines 15-21) and falls back to those when no store result exists.

**Fix for each game screen:** Before `nav('/score/...')`, call:
```ts
const score = computeGameScore('filler-ninja', { fillerCount, longestStreak, ... })
addGameResult({ game: 'filler-ninja', score, metrics: { ... }, timestamp: Date.now() })
```

**Fix for ScoreCard:** Replace hardcoded `data` with dynamic reads from `getLastResult(game)` and `getBestResult(game)`. Pull `prevScore` from previous game result, not hardcoded `d.prev`.

**Files:**
- `src/gamification/screens/FillerNinja.tsx` — add `addGameResult` before nav
- `src/gamification/screens/EyeLock.tsx` — add `addGameResult` before nav
- `src/gamification/screens/PaceRacer.tsx` — add `addGameResult` before nav
- `src/gamification/screens/PitchSurfer.tsx` — add `addGameResult` before nav
- `src/gamification/screens/StatueMode.tsx` — add `addGameResult` before nav
- `src/gamification/screens/ScoreCard.tsx` — replace hardcoded data dict with store reads
- `src/analysis/scoring/gameScorer.ts` — verify all 5 scoring functions work

#### Discovered gaps in this task

**Game metrics don't match gameScorer signatures** [HIGH]
`gameScorer.ts` expects typed metric objects but `GameResult.metrics` is `Record<string, number>`. Games track metrics via `useRef` but don't package them into the shape gameScorer expects. Each game must pass these exact keys:
- FillerNinja: `{ fillerCount, durationSeconds: 90, longestStreakSeconds }`
- EyeLock: `{ gazeLockedPercent, longestGazeSeconds }`
- PaceRacer: `{ timeInZoneSeconds, totalSeconds: 60, avgWpm }`
- PitchSurfer: `{ pitchVariation, monotoneSeconds, totalSeconds: 30 }`
- StatueMode: `{ stillnessPercent, movementAlerts }`

**`sessionStore.recordGame()` never called** [MEDIUM]
`sessionStore` has `recordGame(gameType)` for tracking engagement stats (`totalGames`, `gamesPlayed`). No game screen calls it. **Fix:** Call `recordGame(gameType)` alongside `addGameResult()`.

**Badge checking never triggered** [MEDIUM]
`sessionStore.checkBadges()` evaluates badge conditions but is never called anywhere. **Fix:** Call `checkBadges()` after each `addGameResult()` and `recordGame()`.

---

## Sprint 2: Dark Theme Conversion [COMPLETE]

> Non-negotiable. Every screen must match the homepage's dark aesthetic.

### 2.1 — Convert gamification CSS foundation to dark theme [DONE]

**Target palette** (derived from homepage):
| Token | Light (current) | Dark (target) |
|-------|-----------------|---------------|
| Background | white + purple radial gradients | `#050508` + subtle dark purple radials |
| `--surface` | `#F9F6FF` | `rgba(255,255,255,0.04)` |
| `--border` | `#E5D5F7` | `rgba(255,255,255,0.08)` |
| `--text` | `#1A1A1A` | `rgba(255,255,255,0.9)` |
| `--muted` | `#777777` | `rgba(255,255,255,0.4)` |
| `--purple` | `#C28FE7` | `#C28FE7` (unchanged) |
| `.card` bg | `rgba(255,255,255,0.7)` | `rgba(255,255,255,0.06)` + `blur(20px)` |
| `.btn-secondary` bg | white | transparent + purple border |

**Files:**
- `src/gamification/gamification.css` — full overhaul of CSS variables, backgrounds, card classes, button classes
- `src/gamification/GamificationLayout.tsx` — update `.gamification-theme` wrapper background to `#050508`, verify inline styles compatible with dark theme

#### Discovered gap: GamificationLayout.tsx missing from original plan

`GamificationLayout.tsx` wraps ALL gamification routes. It imports `gamification.css` and applies the theme scope via `className="gamification-theme"`. Its inline styles (`height: '100vh'`, `overflow: 'hidden'`) and the `.gamification-theme` background must also be updated to dark theme. Without this, the wrapper itself will fight the dark CSS variables.

---

### 2.2 — Convert all screen inline styles to dark theme [DONE]

Many screens hardcode `background: 'white'`, `color: '#1A1A1A'`, etc. These won't auto-update from CSS variable changes.

**Files to audit and fix:**
- `src/gamification/screens/Onboarding.tsx` — `background: 'white'` on line 38, white card bg on line 73
- `src/gamification/screens/Countdown.tsx` — white speech bubble backgrounds
- `src/gamification/screens/RadarResults.tsx` — hardcoded light colors
- `src/gamification/screens/GameQueue.tsx` — hardcoded light colors
- `src/gamification/screens/ScoreCard.tsx` — light card backgrounds
- `src/gamification/screens/Progress.tsx` — light card backgrounds
- `src/gamification/screens/RadarScan.tsx` — light prompt card
- `src/gamification/components/CameraFeed.tsx` — `background: 'white'` placeholder
- `src/gamification/components/GraceCountdown.tsx` — white overlay background
- `src/gamification/components/Banner.tsx` — verify gradient works on dark
- `src/gamification/components/DevMenu.tsx` — `background: 'white'`

---

## Sprint 3: UX Flow Completion [COMPLETE]

### 3.1 — Blackout transition: scan → results [DONE]

Add a 2-second dramatic black screen with pulsing "Analyzing your speech..." text between scan completion and results page. Use a local `phase` state in RadarScan.

**File:** `src/gamification/screens/RadarScan.tsx`

---

### 3.2 — Rescan flow with radar overlay animation [DONE]

When user has multiple scans, RadarResults should show previous scores as grey dashed polygon behind current scores (RadarOverlay component already exists). Add delta labels (+5, -3) per axis. Add a "Rescan" button on GameQueue and Progress pages that navigates back to `/scan`.

**Files:**
- `src/gamification/screens/RadarResults.tsx` — wire RadarOverlay with `getPreviousScores()`
- `src/gamification/screens/GameQueue.tsx` — add Rescan button
- `src/gamification/screens/Progress.tsx` — add Rescan button

---

### 3.3 — Per-game prompt picker [DONE]

Currently each game hardcodes its prompt text. Use `sessionStore.getUnusedPrompt(category)` to give each game a fresh prompt. Can integrate into the GraceCountdown component or add a pre-game prompt selection step.

**Files:** All 5 game screens + `src/gamification/components/GraceCountdown.tsx`

---

### 3.4 — Wire difficulty auto-scaling [DONE]

`gameStore.getDifficultyFor(game)` already returns easy/medium/hard based on scan scores. Games should consume this to adjust parameters (timer duration, target zones, thresholds).

**Files:** All 5 game screens (combine with 3.3)

---

### 3.5 — Route guards [DONE]

Create `useRequireScan()` hook — redirect to `/scan` if no scan exists. Apply to `/results`, `/queue`, game screens.

**Files:**
- New: `src/gamification/hooks/useRequireScan.ts`
- `src/gamification/screens/RadarResults.tsx`, `GameQueue.tsx`, `ScoreCard.tsx`, `Progress.tsx`, all 5 game screens

---

### 3.6 — Hide DevMenu in production [DONE]

Wrap DevMenu in `import.meta.env.DEV` check or add a keyboard shortcut toggle (Ctrl+Shift+D).

**File:** `src/App.tsx` line 28

---

### 3.7 — ErrorBoundary [DONE]

React error boundary with mascot + "Something went wrong" + "Go Home" button. Catches MediaPipe failures, camera errors, etc.

**Files:**
- New: `src/components/ErrorBoundary.tsx`
- `src/App.tsx` — wrap routes

---

## Sprint 4: Game Visual Upgrades

### 4.1 — Filler Ninja: floating targets + slash animation [M]

**Brief:** "Filler words appear as floating targets. Ninja slash animation cuts through them."

Add: floating word bubbles that drift across screen, ninja slash SVG animation on detection, ninja meter (progress bar showing filler-free streak duration). Keep existing streak counter but make it more visually dramatic.

**File:** `src/gamification/screens/FillerNinja.tsx`

---

### 4.2 — Eye Lock: full-screen pulse/dim [S]

**Brief:** "Screen pulses green when locked, dims when looking away."

Add full-screen overlay: `quality === 'good'` → subtle green pulse (0.02 opacity, animating), `quality === 'lost'` → screen dims to 0.3 opacity. Keep existing EyeContactIndicator overlay on camera.

**File:** `src/gamification/screens/EyeLock.tsx`

---

### 4.3 — Pitch Surfer: ocean wave + surfing mascot [M]

**Brief:** "Ocean wave responds to pitch. Mascot surfs the wave. Flat pitch = flat water = wipeout."

Replace purple SVG waveform with ocean-themed gradient (blues/teals). Add Mike mascot riding the wave crest. Add wipeout animation when pitch variation is flat for >3s (mascot tumbles, wave flattens).

**File:** `src/gamification/screens/PitchSurfer.tsx`

---

### 4.4 — Statue Mode: body outline heatmap [M]

**Brief:** "Body outline heatmap — areas with excess movement glow red."

Replace rectangular SVG boxes with a body outline where regions glow green→yellow→red based on movement intensity. Use real-time `postureScore`, `headStability`, `handMovement` values.

**File:** `src/gamification/screens/StatueMode.tsx`

---

### 4.5 — Pace Racer: glow/pulse effects [S]

Add green glow (box-shadow animation) on progress bar when in 120-160 WPM zone. Pulse the WPM number. Red warning glow when outside zone.

**File:** `src/gamification/screens/PaceRacer.tsx`

---

## Sprint 5: Sound & Final Polish

### 5.1 — Sound FX system [M]

Create Web Audio API oscillator-based sound manager (no .mp3 files needed). Short synthesized tones:
1. Scan start — ascending tone
2. Scan complete — success chord
3. Countdown beeps (3, 2, 1)
4. Filler detected — error buzz
5. Streak milestone — ding
6. Game complete — celebration
7. Badge earned — achievement sound

**Files:**
- New: `src/lib/sounds.ts`
- All game screens + RadarScan — add sound calls at appropriate moments

---

### 5.2 — Final visual QA pass [S]

Verify every screen matches dark theme. Check for any remaining white backgrounds, light text on dark text, broken contrast, etc.

---

### 5.3 — Performance check [S]

Verify lazy loading works, test simultaneous MediaPipe models on demo hardware, add frame-skipping fallbacks if needed.

---

## Key Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Dual MediaPipe models (face + pose) dropping frames | Scan scores inaccurate | Process every 2nd frame, test on demo hardware early |
| Set serialization in sessionStore | Badges/prompts reset on refresh | Custom Zustand serializer converting Set↔Array |
| Zustand cross-store hydration race | Wrong difficulty on first load | Use `onRehydrateStorage` callback |
| CSS variable cascade breaking inline styles | Visual regressions | Full audit in Task 2.2 — grep for `'white'`, `'#fff'`, `'#1A1A1A'` |
| Game metrics shape mismatch | gameScorer returns wrong scores | Exact key mapping documented per game in Task 1.3 |
| `getWpmStdDev()` missing from wpmTracker | Pacing score always wrong | Must implement in Task 1.2 before scan can produce real data |

---

## Verification

After each sprint:
1. `npx tsc --noEmit` — type check passes
2. `npm run build` — production build succeeds
3. Manual test in Chrome: full flow (splash → goal → onboarding → scan → results → queue → game → score → progress)
4. Verify camera + mic permissions work
5. Refresh page — verify persistence (scores, badges, streaks survive)
6. Check all screens visually match dark theme
