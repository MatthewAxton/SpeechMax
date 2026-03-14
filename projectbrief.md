**SpeechMAX — Consolidated Project Document** *UNIHACK 2026 — Final Pre-Architecture State*

---

## 1. What It Is

SpeechMAX is a free, browser-based AI speech coach that tackles communication inequality. Professional coaching runs $100–300/hour. 77% of people have speaking anxiety, only 8% seek help. SpeechMAX fills that gap with zero cost, zero downloads, and zero data leaving the browser.

The core experience: a 30-second speech scan that diagnoses your weaknesses across 5 axes, then prescribes personalized mini-games to improve. An animated mascot coaches you through everything.

---

## 2. Who It's For

* **International students** — know the material, can't deliver it with native-speaker confidence
* **Job seekers** — qualified but voice shakes, hands freeze, filler words everywhere
* **Neurodivergent professionals** — ADHD rambling, autism eye contact struggles, brilliant but fighting social performance
* **Stutterers** — 70 million worldwide, 70% say it hurts hiring/promotion chances
* **First-generation students** — never had professional communication modeled for them

---

## 3. Team

| Role | Person | Responsibilities |
| --- | --- | --- |
| Team Lead | Anam | Delegation, architecture decisions, coordination |
| Developer 1 | TBD | Assigned by package (see monorepo structure) |
| Developer 2 | TBD | Assigned by package (see monorepo structure) |
| Non-Coding | Hugo | Mascot animation, mobile wireframes, promo video, sound effects, Figma design |

---

## 4. Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18 + TypeScript + Tailwind + Vite |
| ML / Vision | MediaPipe (face mesh, pose, hands) — fully client-side |
| Speech | Web Speech API (Chrome, free, zero latency) |
| Audio Analysis | Web Audio API (pitch, volume, prosody via AnalyserNode) |
| State | Zustand |
| Radar Chart | Custom D3 + Framer Motion |
| Animation | Framer Motion |
| Deploy | Vercel |

Total API cost: $0. All ML runs client-side. No audio or video ever leaves the browser. Privacy by default.

---

## 5. Monorepo Structure

```
speechmax/
├── apps/
│   └── web/              # Main webapp — pages, routing, layout
├── packages/
│   ├── analysis/         # All ML/speech/vision analysis logic
│   │   ├── mediapipe/    # Face mesh, pose, hand tracking
│   │   ├── speech/       # Web Speech API transcription, filler detection
│   │   └── audio/        # Web Audio API pitch, volume, prosody
│   ├── games/            # Game engines and logic
│   │   ├── filler-ninja/
│   │   ├── eye-lock/
│   │   ├── pace-racer/
│   │   ├── pitch-surfer/
│   │   └── statue-mode/
│   └── ui/               # Shared components
│       ├── radar-chart/
│       ├── hud/
│       ├── mascot/
│       └── common/
├── pnpm-workspace.yaml
└── package.json
```

Tooling: pnpm workspaces. No heavy orchestrator. Each dev works in a separate package to avoid merge conflicts.

---

## 6. The Core Loop

```
Scan → See weaknesses → Play targeted games → Rescan → See growth
```

Everything is suggested, nothing is forced. The user always has full freedom to navigate however they want. The mascot coaches and recommends, but never gates.

---

## 7. Step-by-Step User Flow

### Step 1 — Onboarding + 30-Second Scan

1. User opens the app — no sign-up wall
2. Mascot greets them with animated Duolingo-style onboarding
3. User picks a prompt from 2-3 options (e.g. "Tell us about yourself")
4. Camera + mic activate — user sees themselves on screen with the prompt
5. User free-speaks for 30 seconds while the app records video + audio
6. Real-time analysis runs: MediaPipe (vision) + Web Speech API (speech) + Web Audio API (pitch/volume)
7. Screen goes dark for 2 seconds (dramatic pause)
8. SpeechMAX Profile fades in — animated radar chart with scores

### Radar Chart Axes

| Axis | What It Measures | Source |
| --- | --- | --- |
| **Clarity** | Filler word density (ums, uhs, likes) | Web Speech API |
| **Confidence** | Eye contact % + posture score | MediaPipe face mesh + pose |
| **Pacing** | WPM consistency, rushing vs dragging | Web Speech API |
| **Expression** | Pitch variation, monotone detection | Web Audio API |
| **Composure** | Hand steadiness, fidgeting, facial tension | MediaPipe pose + hands + face |

Each axis: 0–100. Overall composite score displayed big. Scoring formulas are simplified/hardcoded for demo — real data in, mocked weights out.

### Step 2 — Personalized Game Queue

1. Mascot comments on results ("Your biggest opportunity: filler words. You said 'um' 6 times!")
2. Game queue appears — cards ranked by weakness priority
3. Each card shows: game name + icon, which axis it trains, estimated time (30s–2min), current score
4. User can follow the recommendation or freely pick any game

### Step 3 — The Games

Each game is 30–90 seconds. User picks a prompt category (casual, professional, interview) before each game. Difficulty auto-scales based on scan scores. Subtle sound effects on key moments.

| Game | Trains | Visual Mechanic | Key Tech |
| --- | --- | --- | --- |
| **Filler Ninja** | Clarity | Filler words appear as floating targets. Ninja slash animation cuts through them on detection. Ninja meter shows filler-free streak. | Web Speech API real-time transcription |
| **Eye Lock** | Confidence | Camera dot gaze tracking. Screen pulses green when locked, dims when looking away. Adaptive gaze zone — starts generous, tightens as score improves. | MediaPipe face mesh gaze estimation |
| **Pace Racer** | Pacing | Abstract horizontal bar pulses with WPM. Green glow in target zone, red when out. Clean, minimal. | Web Speech API word count + timing |
| **Pitch Surfer** | Expression | Ocean wave responds to pitch. Mascot surfs the wave. Flat pitch = flat water = wipeout. Dynamic pitch = big waves = thriving. | Web Audio API AnalyserNode |
| **Statue Mode** | Composure | MediaPipe skeleton overlay on camera feed. Body outline heatmap — areas with excess movement glow red. | MediaPipe pose + hands tracking |

Each game ends with a score card showing improvement vs. last attempt and effect on the relevant radar axis.

### Step 4 — Rescan & Progress

1. User can rescan anytime — another 30-second free-speak
2. New radar chart overlays on the old one (old = grey/faded, new = color) with animated transition
3. Progress screen shows: radar chart evolution, per-axis trends, streaks, personal bests
4. Badges: First Scan, 7-Day Streak, 100 Score Club, Filler-Free Minute, Ninja Master

---

## 8. Visual Identity

| Aspect | Decision |
| --- | --- |
| Vibe | Warm, human, premium — Claude.ai meets Duolingo meets Quizlet |
| Background | White, clean |
| Onboarding | Duolingo-style with animation, fun, guided by mascot |
| Accent color | Owned by Figma member |
| Animation | Framer Motion on key moments (radar reveal, score cards, scan transition, game feedback) + extra polish from animation-skilled member |
| Mascot | Animated character with idle, motion, talking states + color changes. Clippy-style with a mouth. Acts as the coach throughout the entire app. Built by Hugo. |
| Sound FX | Subtle sounds on key moments (filler detected, game complete, score reveal). Sourced by Hugo. |

---

## 9. Demo Strategy

### What to Build (Priority Order)

1. Scan flow — camera + mic + prompt picker + 30-second recording + real-time data capture
2. Radar chart results — D3 + Framer Motion animated reveal with mocked scoring formulas
3. Game queue — personalized card layout with mascot coaching
4. Filler Ninja — most demo-impressive, Web Speech API makes detection real
5. Eye Lock — MediaPipe face mesh, adaptive gaze zone
6. Pace Racer — WPM from Web Speech API, abstract bar
7. Pitch Surfer — Web Audio API pitch, ocean wave + mascot surfer
8. Statue Mode — MediaPipe skeleton overlay heatmap
9. Rescan overlay animation — old vs new radar comparison
10. Progress screen — trends, badges, personal bests

### What to Skip

- Auth / sign-up — guest mode only
- Backend / database — in-memory state only (Zustand)
- Smart reminders / spaced repetition
- Pre-session breathing

### Demo Deliverables

- **Promo video** — team + product storytelling, includes mobile wireframes for future vision (Hugo)
- **Live demo** — judges try it hands-on
- **Mascot** — animated coach with states throughout the experience (Hugo)

### Scoring Approach

Real data captured from MediaPipe / Web Speech API / Web Audio API. Scoring formulas are simplified and hardcoded for demo. Proves the concept — real inputs, mocked weights. Full algorithm tuning is a post-hackathon concern.

---

## 10. Scientific Foundation

| Method | Feature | Source |
| --- | --- | --- |
| CBT Systematic Desensitization | Game difficulty auto-scaling | Ebrahimi et al., 2019 — 30 RCTs |
| Deliberate Practice | Targeted game queue | Ericsson, 2008 — cited 2,792x |
| Fluency Shaping | Filler Ninja, pacing mechanics | ASHA clinical standards, PMC4461240 |
| Video Self-Modeling | Camera feed during games | PMC4168036 |
| Toastmasters Framework | Composite radar chart score | 100 years of evaluation data |
| Real-Time Biofeedback | In-game visual feedback | PMC10206049, PMC10412682 |
| Prosody Research | Pitch Surfer game | PMC12231869, Tandfonline 2024 |
| Spaced Repetition | Streak system, progress tracking | PubMed 2024, 80+ years of data |
| Gamification | Badges, streaks, personal bests | PMC6096297, Nature 2022 |

---

## 11. Competitive Gap

| App | Price | Real-Time | Body Language | Personalized | Free |
| --- | --- | --- | --- | --- | --- |
| Yoodli | $20/mo | Yes | No | No | No |
| Orai | $15/mo | Partial | No | No | No |
| Poised | $16/mo | Yes | No | No | No |
| Speeko | $10/mo | No | No | No | No |
| **SpeechMAX** | **Free** | **Yes** | **Yes** | **Yes (AI-diagnosed)** | **Yes** |

---

## 12. Why This Wins

1. **Demo in 60 seconds** — Judge speaks, sees radar chart, plays a game, rescans. They experience the product.
2. **Personalization is the story** — "We diagnose, then prescribe." One-liner judges remember.
3. **Scope is tight** — 5 games, 1 scan, 1 progress screen. No feature bloat.
4. **The radar chart** — Shareable, comparable, makes people want to improve their score.
5. **The mascot** — Personality. Identity. Memorable. Not another faceless dashboard.
6. **All client-side** — Zero API cost, zero data leaves the browser. Privacy by architecture, not policy.
7. **Scientifically grounded** — 9 clinically validated methods. Not vibes — evidence.

---

## Next Steps

1. **Architecture planning** — detailed technical architecture, data flow, component hierarchy
2. **PRD finalisation** — lock down every screen, interaction, and edge case
3. **Epics & Milestones** — break work into epics mapped to the monorepo packages
4. **Linear tickets** — individual issues assigned to team members by package to avoid conflicts


# SpeechMAX — Technical Architecture

**Version**: 1.0
**Status**: Final
**Event**: UNIHACK 2026
**Owner**: Anam (Lead Engineer)

---

## 1. High-Level System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Chrome 90+)                             │
│                  Everything runs client-side. Zero backend.              │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                      apps/web (Anam)                               │  │
│  │               React 18 + TypeScript + Tailwind + Vite              │  │
│  │                                                                    │  │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐ ┌─────────┐ │  │
│  │  │ Landing  │ │ Onboarding│ │   Scan   │ │Results │ │  Game   │ │  │
│  │  │  Page    │ │   Flow    │ │   Page   │ │  Page  │ │  Queue  │ │  │
│  │  └──────────┘ └───────────┘ └────┬─────┘ └───┬────┘ └────┬────┘ │  │
│  │                                   │           │           │       │  │
│  │  ┌──────────┐ ┌──────────────────┐│  ┌───────────────────────┐   │  │
│  │  │ Progress │ │  Game Page       ││  │    Zustand Stores     │   │  │
│  │  │  Page    │ │ (dynamic routing)││  │ scanStore | gameStore │   │  │
│  │  └──────────┘ └──────────────────┘│  │    sessionStore       │   │  │
│  │                                    │  └───────────┬───────────┘   │  │
│  └────────────────────────────────────┼──────────────┼───────────────┘  │
│                                       │              │                   │
│         ┌─────────────────────────────┼──────────────┼────────────┐     │
│         │                             ▼              ▼            │     │
│  ┌──────┴────────────────────────────────────────────────────────┐│     │
│  │                  @speechmax/analysis (Anam)                    ││     │
│  │            MediaPipe + Web Speech API + Web Audio API          ││     │
│  │                                                                ││     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐ ││     │
│  │  │   mediapipe/  │  │   speech/    │  │       audio/        │ ││     │
│  │  │              │  │              │  │                     │ ││     │
│  │  │ faceTracker  │  │ transcriber  │  │  pitchAnalyzer     │ ││     │
│  │  │ poseTracker  │  │ fillerDetect │  │  volumeTracker     │ ││     │
│  │  │ handTracker  │  │ wpmTracker   │  │                     │ ││     │
│  │  └──────┬───────┘  └──────┬───────┘  └──────────┬──────────┘ ││     │
│  │         │                 │                      │            ││     │
│  │         └─────────────────┼──────────────────────┘            ││     │
│  │                           ▼                                    ││     │
│  │                  ┌──────────────────┐                          ││     │
│  │                  │    scoring/      │                          ││     │
│  │                  │  radarScorer     │                          ││     │
│  │                  │  gameScorer      │                          ││     │
│  │                  └──────────────────┘                          ││     │
│  └────────────────────────────────────────────────────────────────┘│     │
│         ┌─────────────────────────────────────────────────────────┐│     │
│  ┌──────┴────────────────────────────────────────────────────────┐││     │
│  │                    @speechmax/games (Bruno)                    │││     │
│  │                                                                │││     │
│  │  ┌──────────┐ ┌────────┐ ┌──────────┐ ┌───────────┐ ┌──────┐│││     │
│  │  │  Filler  │ │  Eye   │ │   Pace   │ │   Pitch   │ │Statue││││     │
│  │  │  Ninja   │ │  Lock  │ │  Racer   │ │  Surfer   │ │ Mode │││││     │
│  │  └──────────┘ └────────┘ └──────────┘ └───────────┘ └──────┘│││     │
│  │                                                                │││     │
│  │  ┌──────────────────────────────────────────────────────────┐ │││     │
│  │  │  shared/ (GameShell, ScoreCard, PromptPicker)            │ │││     │
│  │  └──────────────────────────────────────────────────────────┘ │││     │
│  └────────────────────────────────────────────────────────────────┘││     │
│         ┌──────────────────────────────────────────────────────────┘│     │
│  ┌──────┴────────────────────────────────────────────────────────┐  │     │
│  │                     @speechmax/ui (Meng)                       │  │     │
│  │                                                                │  │     │
│  │  ┌────────────┐ ┌─────────┐ ┌────────────┐ ┌──────────────┐  │  │     │
│  │  │ RadarChart  │ │ Mascot  │ │ CameraFeed │ │   Common     │  │  │     │
│  │  │ RadarOverlay│ │         │ │ useCamera  │ │ Button, Card │  │  │     │
│  │  │ (D3+Framer) │ │ (Lottie)│ │            │ │ Badge, Timer │  │  │     │
│  │  └────────────┘ └─────────┘ └────────────┘ │ ProgressBar  │  │  │     │
│  │                                             └──────────────┘  │  │     │
│  └────────────────────────────────────────────────────────────────┘  │     │
│                                                                      │     │
│  ┌────────────────────────────────────────────────────────────────┐  │     │
│  │                    Browser APIs (Native)                        │  │     │
│  │                                                                │  │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │  │     │
│  │  │ getUserMedia  │  │ Web Speech   │  │    Web Audio API    │  │  │     │
│  │  │ (camera+mic) │  │ API (STT)    │  │  (AnalyserNode)    │  │  │     │
│  │  └──────────────┘  └──────────────┘  └─────────────────────┘  │  │     │
│  │                                                                │  │     │
│  │  ┌──────────────┐  ┌──────────────┐                           │  │     │
│  │  │ MediaRecorder │  │  MediaPipe   │                           │  │     │
│  │  │ (recording)  │  │ WASM (~4MB)  │                           │  │     │
│  │  └──────────────┘  └──────────────┘                           │  │     │
│  └────────────────────────────────────────────────────────────────┘  │     │
└──────────────────────────────────────────────────────────────────────┘

                              │
                              │ Static files served via HTTPS
                              ▼

┌──────────────────────────────────────────────────────────────────────────┐
│                          VERCEL (Deployment)                              │
│                                                                          │
│  • Static site hosting (Vite build output)                               │
│  • HTTPS by default (required for camera/mic)                            │
│  • Auto-deploy on push to main                                           │
│  • CDN for static assets                                                 │
│  • Zero server-side compute — everything runs in the browser             │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Architecture Philosophy

**Zero-backend, privacy-first.** Every computation — speech recognition, body language analysis, pitch detection, scoring — happens inside the user's browser. No data is transmitted to any server. The Vercel deployment is purely a static file host.

This means:
- $0 API cost at any scale
- Zero privacy concerns (GDPR/CCPA irrelevant — no data collection)
- Works offline after initial load (MediaPipe models cached)
- No rate limiting, no quotas, no auth complexity
- Demo works on airplane wifi if models are cached

---

## 2. Package Architecture — Dependency Graph

```
                   ┌──────────────────┐
                   │    apps/web      │
                   │     (Anam)       │
                   │                  │
                   │ Pages, routing,  │
                   │ stores, layout   │
                   └──┬─────┬──────┬──┘
                      │     │      │
           ┌──────────┘     │      └──────────┐
           ▼                ▼                  ▼
  ┌────────────────┐ ┌───────────────┐ ┌──────────────┐
  │ @speechmax/ui  │ │ @speechmax/   │ │ @speechmax/  │
  │    (Meng)      │ │   games       │ │  analysis    │
  │                │ │   (Bruno)     │ │   (Anam)     │
  │ NO internal    │ │               │ │              │
  │ dependencies   │ │ imports from: │ │ NO internal  │
  │                │ │  • ui         │ │ dependencies │
  │ External deps: │ │  • analysis   │ │              │
  │  • d3          │ │               │ │ External deps│
  │  • framer-     │ │ External deps:│ │  • @mediapipe│
  │    motion      │ │  • (none)     │ │              │
  │  • lottie-web  │ │               │ │              │
  └────────────────┘ └───────────────┘ └──────────────┘
        ▲                  │  │                ▲
        │                  │  │                │
        └──────────────────┘  └────────────────┘
        games imports from     games imports from
        ui components          analysis hooks
```

### 2.1 Import Rules (Enforced via PR Review)

```
ALLOWED                                    FORBIDDEN
─────────────────────────────              ─────────────────────────────
apps/web    → @speechmax/ui               ui       → analysis
apps/web    → @speechmax/games            ui       → games
apps/web    → @speechmax/analysis         ui       → apps/web
games       → @speechmax/ui              analysis → ui
games       → @speechmax/analysis        analysis → games
                                         analysis → apps/web
                                         games    → apps/web
                                         ANY      → internal file paths
                                                    of another package
```

All imports between packages use the `@speechmax/{name}` scope — never relative paths reaching into another package's `src/` directory.

---

## 3. Data Flow Diagrams

### 3.1 Scan Flow (The Core 30-Second Recording)

```
User opens /scan
      │
      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       INITIALIZATION                                 │
│                                                                      │
│  1. useCamera() → getUserMedia({ video: true, audio: true })        │
│  2. MediaStream splits into:                                         │
│     ├── Video track → <video> element (CameraFeed component)        │
│     ├── Video track → MediaPipe (startTracking)                     │
│     ├── Audio track → Web Speech API (startTranscription)           │
│     ├── Audio track → Web Audio API (startAudioAnalysis)            │
│     └── Both tracks → MediaRecorder (start recording)               │
│  3. Timer starts: 30 seconds countdown                               │
└─────────────────────────────┬───────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    REAL-TIME ANALYSIS (30 seconds)                    │
│                                                                      │
│  Running concurrently at different frame rates:                       │
│                                                                      │
│  MediaPipe (~30fps)          Web Speech API        Web Audio (~60fps) │
│  ┌───────────────────┐       ┌──────────────┐     ┌───────────────┐ │
│  │ Every frame:      │       │ On result:   │     │ Every frame:  │ │
│  │ • eyeContact bool │       │ • transcript │     │ • pitch (Hz)  │ │
│  │ • postureScore    │       │ • wordCount  │     │ • volume (0-1)│ │
│  │ • handMovement    │       │ • fillers    │     │               │ │
│  │ • facialTension   │       │   detected   │     │               │ │
│  │ • headStability   │       │ • wpm calc   │     │               │ │
│  │ • landmarks (raw) │       │              │     │               │ │
│  └────────┬──────────┘       └──────┬───────┘     └───────┬───────┘ │
│           │                         │                      │         │
│           ▼                         ▼                      ▼         │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    RAW DATA ACCUMULATOR                      │    │
│  │  (in scanStore — arrays of per-second readings)              │    │
│  │                                                              │    │
│  │  eyeContactReadings: [1, 1, 0, 1, 0, 0, 1, ...]            │    │
│  │  wpmReadings: [0, 45, 120, 135, 142, 138, ...]             │    │
│  │  pitchReadings: [220, 218, 225, 190, 210, ...]             │    │
│  │  volumeReadings: [0.3, 0.5, 0.6, 0.4, ...]                │    │
│  │  fillerEvents: [{ word: 'um', timestamp: 3200 }, ...]       │    │
│  │  transcript: "So um I think the most important..."          │    │
│  └──────────────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────────────┘
                             │ Timer hits 0 (or user taps Done, min 15s)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         POST-SCAN                                    │
│                                                                      │
│  1. stopTracking(), stopTranscription(), stopAudioAnalysis()        │
│  2. MediaRecorder.stop() → Blob (video+audio) stored in scanStore   │
│  3. computeRadarScores(rawData) → RadarScores                       │
│  4. Store ScanResult in scanStore                                    │
│  5. Navigate to /results with 2s blackout transition                 │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Game Flow (Per-Game Lifecycle)

```
User selects a game from /games queue
      │
      ▼
┌────────────────────────────────────────────────────┐
│                 PRE-GAME SETUP                      │
│                                                     │
│  1. GameShell renders:                              │
│     ├── PromptPicker (casual/professional/interview)│
│     └── User selects category → random prompt       │
│  2. Difficulty auto-set from most recent scan score:│
│     ├── axis score 0-40  → easy                     │
│     ├── axis score 41-70 → medium                   │
│     └── axis score 71-100 → hard                    │
│  3. Camera + mic activated (if not already)         │
│  4. 3-2-1 countdown animation                       │
└─────────────────────────┬──────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────┐
│               GAME ACTIVE (30-90 seconds)           │
│                                                     │
│  Game component subscribes to analysis callbacks:   │
│                                                     │
│  Filler Ninja:                                      │
│    onFillerDetected → trigger slash animation       │
│    onTranscript → update streak timer               │
│                                                     │
│  Eye Lock:                                          │
│    onTrackingFrame → check eyeContact bool          │
│    → pulse green (locked) or dim (broken)           │
│                                                     │
│  Pace Racer:                                        │
│    onTranscript → calculate rolling WPM             │
│    → update pace bar position + color               │
│                                                     │
│  Pitch Surfer:                                      │
│    onAudioFrame → read pitch value                  │
│    → update wave height + mascot position           │
│                                                     │
│  Statue Mode:                                       │
│    onTrackingFrame → read landmark positions        │
│    → calculate per-region displacement              │
│    → update skeleton heatmap colors                 │
│                                                     │
│  Timer counts down. Mascot reacts in real-time.     │
│  Sound FX fire on key events.                       │
└─────────────────────────┬──────────────────────────┘
                         │ Timer hits 0
                         ▼
┌────────────────────────────────────────────────────┐
│                 POST-GAME                           │
│                                                     │
│  1. Stop relevant analysis subscriptions            │
│  2. computeGameScore(gameType, metrics) → 0-100    │
│  3. Build GameResult object                         │
│  4. Call onComplete(result) → apps/web stores it   │
│  5. ScoreCard slides up:                            │
│     ├── Game score                                  │
│     ├── Improvement vs. last attempt (if exists)    │
│     ├── Effect on relevant radar axis               │
│     └── Buttons: Play Again | Next Game | Back     │
│  6. Mascot celebrates or encourages                 │
│  7. Check badge conditions → award if met           │
└────────────────────────────────────────────────────┘
```

### 3.3 Rescan Flow

```
User taps "Rescan" (available from game queue or progress page)
      │
      ▼
 Same as Scan Flow (Section 3.1)
      │
      ▼
 computeRadarScores(newRawData) → newScores
      │
      ▼
┌────────────────────────────────────────────────────┐
│              RESULTS PAGE — OVERLAY MODE            │
│                                                     │
│  1. Retrieve previousScores from scanStore          │
│  2. RadarOverlay component renders:                 │
│     ├── Previous shape: grey, 30% opacity           │
│     └── New shape: accent color, full opacity       │
│  3. Animation sequence:                             │
│     ├── Old shape fades to grey (500ms)             │
│     ├── New shape draws over it (2500ms)            │
│     └── Delta labels appear (+12 Clarity, etc.)     │
│  4. Mascot comments on improvement areas            │
│  5. Updated scores stored in scanStore              │
│  6. Badge check: "Comeback Kid" (+20 improvement)   │
└────────────────────────────────────────────────────┘
```

---

## 4. Analysis Pipeline Architecture (Anam)

This is the most technically complex package. Each subsystem runs independently and exposes a subscribe-based API.

### 4.1 MediaPipe Pipeline

```
                   HTMLVideoElement
                         │
                         ▼
             ┌───────────────────────┐
             │   MediaPipe Holistic   │
             │   (or separate models) │
             │                       │
             │  Face Mesh (478 pts)  │
             │  Pose (33 pts)        │
             │  Hands (21 pts × 2)   │
             └───────────┬───────────┘
                         │ ~30fps callbacks
                         ▼
             ┌───────────────────────┐
             │    Landmark Processor  │
             │                       │
             │  Raw landmarks →      │
             │  computed metrics:    │
             │                       │
             │  Face:                │
             │  ├── iris position    │
             │  ├── gaze vector      │──→ eyeContact (bool)
             │  ├── jaw openness     │──→ facialTension (0-1)
             │  └── brow position    │
             │                       │
             │  Pose:                │
             │  ├── shoulder angle   │──→ postureScore (0-100)
             │  ├── head tilt        │──→ headStability (0-1)
             │  └── spine alignment  │
             │                       │
             │  Hands:               │
             │  ├── position delta   │──→ handMovement (0-1)
             │  └── visibility       │
             └───────────┬───────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │   TrackingFrame event  │
             │   dispatched to all    │
             │   subscribers          │
             └───────────────────────┘
```

**Key Implementation Details:**

| Aspect | Detail |
| --- | --- |
| Model loading | Lazy — models load after landing page, not on initial bundle. Show loading indicator on scan page if not ready. |
| Model source | CDN (`cdn.jsdelivr.net/npm/@mediapipe/...`) or self-hosted in `public/models/` for reliability |
| WASM backend | Preferred over GPU backend for broader Chrome compatibility |
| Frame rate | Target 30fps. If dropping below 20fps, reduce face mesh density (use refined=false) |
| Eye contact calculation | Compare iris landmark position relative to eye corner landmarks. If iris is centered within eye bounds (±threshold), eyeContact = true. |
| Gaze zone (for Eye Lock) | Convert gaze vector to screen coordinates. Compare against a circular zone centered on camera position. Zone radius scales with difficulty. |
| Posture scoring | Calculate angle between left shoulder, neck midpoint, and right shoulder landmarks. Upright = close to 180°. Slouching = <160°. Score = linear map from angle to 0-100. |
| Movement tracking | For each landmark, compute euclidean distance from previous frame position. Sum across all landmarks. Normalize to 0-1 range. |
| Memory | Landmarks from current and previous frame only (no history buffer in MediaPipe layer — history is accumulated in the scan/game layer). |

### 4.2 Web Speech API Pipeline

```
             ┌───────────────────────┐
             │   SpeechRecognition    │
             │   (browser native)     │
             │                       │
             │   continuous: true     │
             │   interimResults: true │
             │   lang: 'en-US'        │
             └───────────┬───────────┘
                         │ onresult events
                         ▼
             ┌───────────────────────┐
             │   Transcript Parser    │
             │                       │
             │  interim → TranscriptEvent (isFinal: false)
             │  final   → TranscriptEvent (isFinal: true)
             │                       │
             │  On each final result: │
             │  ├── Update cumulative │
             │  │   word count        │
             │  ├── Calculate WPM     │
             │  │   (words / elapsed) │
             │  └── Check for fillers │
             └───────────┬───────────┘
                         │
                   ┌─────┴─────┐
                   ▼           ▼
         ┌──────────────┐ ┌──────────────┐
         │ onTranscript │ │onFillerDetect│
         │  subscribers │ │  subscribers │
         └──────────────┘ └──────────────┘
```

**Key Implementation Details:**

| Aspect | Detail |
| --- | --- |
| Browser support | Chrome only. `webkitSpeechRecognition` for compatibility. |
| Continuous mode | `recognition.continuous = true` — keeps listening until explicitly stopped. |
| Interim results | `recognition.interimResults = true` — fires partial results for real-time display. Only filler detection on `isFinal = true` results to avoid false positives from partial transcripts. |
| Restart on error | Web Speech API silently stops on silence timeouts. Auto-restart on `onerror` and `onend` events if session is still active. |
| Filler detection | Case-insensitive regex match against filler word list. Match whole words only (word boundary `\b`). Check both individual words and two-word phrases ("you know", "I mean", "kind of", "sort of"). |
| WPM calculation | Two modes: (1) Session average: total words / elapsed seconds × 60. (2) Rolling 5-second window for Pace Racer game: words in last 5 seconds × 12. |
| Filler word list | `['um', 'uh', 'like', 'you know', 'basically', 'right', 'so', 'actually', 'literally', 'i mean', 'kind of', 'sort of']` |

### 4.3 Web Audio API Pipeline

```
             MediaStream (audio track)
                         │
                         ▼
             ┌───────────────────────┐
             │    AudioContext        │
             │                       │
             │  MediaStreamSource    │
             │         │             │
             │         ▼             │
             │  ┌──────────────┐     │
             │  │ AnalyserNode │     │
             │  │              │     │
             │  │ fftSize:2048 │     │
             │  │ smoothing:   │     │
             │  │   0.8        │     │
             │  └──────┬───────┘     │
             └─────────┼─────────────┘
                       │
                 ┌─────┴─────┐
                 ▼           ▼
      ┌──────────────┐ ┌──────────────┐
      │ Pitch Detect  │ │ Volume Detect│
      │               │ │              │
      │ getFloatTime  │ │ getByteFreq  │
      │ DomainData()  │ │ Data()       │
      │       │       │ │      │       │
      │       ▼       │ │      ▼       │
      │ Autocorrelat- │ │ RMS calc →   │
      │ ion algorithm │ │ normalize    │
      │       │       │ │ to 0-1       │
      │       ▼       │ │              │
      │ Fundamental   │ │              │
      │ frequency(Hz) │ │              │
      └───────┬───────┘ └──────┬───────┘
              │                │
              ▼                ▼
      ┌────────────────────────────┐
      │      AudioFrame event      │
      │  { pitch, volume, ts }     │
      │  dispatched ~60fps         │
      └────────────────────────────┘
```

**Key Implementation Details:**

| Aspect | Detail |
| --- | --- |
| Pitch detection method | Autocorrelation on time-domain data. Find the first peak in the autocorrelation function after the initial falloff. Convert lag to frequency: `sampleRate / lag`. |
| Pitch range | Typical speech: 85-255 Hz (male), 165-255 Hz (female). Clamp readings outside 50-500 Hz as noise. |
| Volume calculation | Root Mean Square (RMS) of the time-domain audio buffer. Normalize to 0-1 range. Readings below 0.01 treated as silence. |
| Pitch variation scoring | Standard deviation of pitch readings over the analysis period. Higher std dev = more expressive. Monotone = std dev < 15 Hz over 5+ seconds. |
| AnalyserNode config | `fftSize: 2048` (good frequency resolution for speech). `smoothingTimeConstant: 0.8` (smooth out noise without too much lag). |
| Frame rate | requestAnimationFrame loop (~60fps). Can throttle to 30fps if performance is an issue. |

### 4.4 Scoring Engine

```
                   ScanRawData
                       │
                       ▼
             ┌───────────────────────┐
             │    radarScorer.ts      │
             │                       │
             │  Input raw metrics:   │
             │  ├── fillerCount      │
             │  ├── fillersPerMinute │
             │  ├── eyeContactPct    │
             │  ├── postureScore     │
             │  ├── wpm             │
             │  ├── wpmReadings[]   │
             │  ├── pitchStdDev     │
             │  ├── stillnessPct    │
             │  └── fidgetCount     │
             │                       │
             │  Apply formulas:      │
             │  ├── Clarity          │
             │  ├── Confidence       │
             │  ├── Pacing           │
             │  ├── Expression       │
             │  ├── Composure        │
             │  └── Overall          │
             └───────────┬───────────┘
                         │
                         ▼
                   RadarScores
```

**Scoring Formulas (Simplified for Demo):**

```typescript
function computeRadarScores(raw: ScanRawData): RadarScores {
 // Clarity: fewer fillers = higher score
 const clarity = Math.max(0, Math.min(100,
   100 - (raw.fillersPerMinute * 10)
 ));

 // Confidence: weighted combo of eye contact + posture
 const confidence = Math.max(0, Math.min(100,
   (raw.eyeContactPct * 0.7) + (raw.postureScore * 0.3)
 ));

 // Pacing: how close to target WPM + consistency
 const targetWpm = 135; // conversational target
 const wpmDeviation = Math.abs(raw.wpm - targetWpm);
 const wpmConsistency = 100 - (standardDeviation(raw.wpmReadings) * 2);
 const pacing = Math.max(0, Math.min(100,
   (Math.max(0, 100 - wpmDeviation) * 0.6) + (wpmConsistency * 0.4)
 ));

 // Expression: pitch variation (higher std dev = more expressive)
 const expression = Math.max(0, Math.min(100,
   Math.min(raw.pitchStdDev * 2.5, 100)
 ));

 // Composure: stillness + low fidget rate
 const fidgetPenalty = Math.min(raw.fidgetCount * 5, 50);
 const composure = Math.max(0, Math.min(100,
   (raw.stillnessPct * 0.8) + ((100 - fidgetPenalty) * 0.2)
 ));

 // Overall: weighted average
 const overall = Math.round(
   (clarity * 0.25) +
   (confidence * 0.25) +
   (pacing * 0.20) +
   (expression * 0.15) +
   (composure * 0.15)
 );

 return {
   clarity: Math.round(clarity),
   confidence: Math.round(confidence),
   pacing: Math.round(pacing),
   expression: Math.round(expression),
   composure: Math.round(composure),
   overall,
 };
}
```

These formulas are intentionally simplified. They produce reasonable scores from real data but are not clinically calibrated. Post-hackathon work would involve proper normalization, user-specific baselines, and validated weighting.

---

## 5. State Management Architecture (Anam)

All state lives in Zustand stores inside `apps/web/src/store/`. No other package touches these stores. Games and UI components receive data via props and emit results via callbacks.

```
┌─────────────────────────────────────────────────────────────┐
│                     Zustand Stores (In-Memory)               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    scanStore                          │   │
│  │                                                      │   │
│  │  scans: ScanResult[]                                 │   │
│  │  currentScanId: string | null                        │   │
│  │  isScanning: boolean                                 │   │
│  │  rawDataBuffer: Partial<ScanRawData>                 │   │
│  │                                                      │   │
│  │  Actions:                                            │   │
│  │  ├── startScan()                                     │   │
│  │  ├── appendRawData(type, value)                      │   │
│  │  ├── completeScan(videoBlob, transcript)             │   │
│  │  ├── getLatestScores() → RadarScores                 │   │
│  │  └── getPreviousScores() → RadarScores | null        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    gameStore                          │   │
│  │                                                      │   │
│  │  gameHistory: GameResult[]                           │   │
│  │  currentGameType: GameType | null                    │   │
│  │                                                      │   │
│  │  Actions:                                            │   │
│  │  ├── addGameResult(result: GameResult)               │   │
│  │  ├── getLastResult(gameType) → GameResult | null     │   │
│  │  ├── getBestResult(gameType) → GameResult | null     │   │
│  │  ├── getDifficultyFor(gameType) → Difficulty         │   │
│  │  └── getRecommendedGameOrder() → GameType[]          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   sessionStore                        │   │
│  │                                                      │   │
│  │  usedPrompts: string[]                               │   │
│  │  badges: Badge[]                                     │   │
│  │  personalBests: PersonalBests                        │   │
│  │  streakDays: number                                  │   │
│  │                                                      │   │
│  │  Actions:                                            │   │
│  │  ├── markPromptUsed(prompt: string)                  │   │
│  │  ├── getUnusedPrompt(category) → string              │   │
│  │  ├── checkBadges() → Badge[] (newly earned)          │   │
│  │  ├── updatePersonalBests(scan?, game?)               │   │
│  │  └── incrementStreak()                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 5.1 Data Flow Between Stores and Components

```
Page Component (apps/web)
   │
   ├── reads from scanStore (scores, history)
   ├── reads from gameStore (recommendations, difficulty)
   ├── reads from sessionStore (badges, bests)
   │
   ├── passes data as PROPS to:
   │   ├── @speechmax/ui components (RadarChart, Mascot, etc.)
   │   └── @speechmax/games components (FillerNinja, etc.)
   │
   └── receives results via CALLBACKS from:
       └── game.onComplete(result) → gameStore.addGameResult(result)
```

**Games never read from stores directly.** They receive everything via props (`difficulty`, `prompt`) and return everything via callbacks (`onComplete`, `onExit`). This keeps games as pure, testable components.

---

## 6. Routing Architecture (Anam)

```typescript
// apps/web/src/router.tsx
const routes = [
 { path: '/',            element: <Landing /> },
 { path: '/onboarding',  element: <Onboarding /> },
 { path: '/scan',        element: <Scan /> },
 { path: '/results',     element: <Results /> },
 { path: '/games',       element: <GameQueue /> },
 { path: '/games/:gameId', element: <Game /> },
 { path: '/progress',    element: <Progress /> },
];
```

### 6.1 Navigation Flow

```
/  ──────────────────→  /onboarding
                             │
                             ▼
                         /scan
                             │
                             ▼
                        /results
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
                /games            /progress
                    │                 │
                    ▼                 │
           /games/:gameId             │
                    │                 │
                    ├── Play Again ───┘ (back to same game)
                    ├── Next Game ────→ /games/:nextGameId
                    └── Back ─────────→ /games

Rescan button (available from /games and /progress) → /scan
```

### 6.2 Route Guards
- `/scan` requires camera+mic permission. If denied, redirect to `/onboarding` with error state.
- `/results` requires at least one scan in `scanStore`. If empty, redirect to `/scan`.
- `/games/:gameId` validates `gameId` against known game types. Invalid → redirect to `/games`.
- No auth guards (no sign-up).

### 6.3 Dynamic Game Routing

```typescript
// apps/web/src/pages/Game.tsx
const gameComponents = {
 'filler-ninja': FillerNinja,
 'eye-lock': EyeLock,
 'pace-racer': PaceRacer,
 'pitch-surfer': PitchSurfer,
 'statue-mode': StatueMode,
};

function Game() {
 const { gameId } = useParams();
 const GameComponent = gameComponents[gameId];
 const difficulty = gameStore.getDifficultyFor(gameId);
 const prompt = sessionStore.getUnusedPrompt(selectedCategory);

 return (
   <GameComponent
     difficulty={difficulty}
     prompt={prompt}
     promptCategory={selectedCategory}
     onComplete={(result) => {
       gameStore.addGameResult(result);
       sessionStore.checkBadges();
     }}
     onExit={() => navigate('/games')}
   />
 );
}
```

---

## 7. Component Hierarchy

### 7.1 Page → Component Mapping

```
Landing (apps/web)
├── Mascot (ui) [state: idle]
├── Button (ui) [CTA: "Start Your Scan"]
└── (animated background/hero)

Onboarding (apps/web)
├── Mascot (ui) [state: talking]
├── OnboardingSlides (apps/web) [Framer Motion step-through]
│   ├── Slide 1: explanation
│   ├── Slide 2: prompt picker cards
│   └── Slide 3: camera permission request
└── Button (ui) [CTA: "Let's Go"]

Scan (apps/web)
├── CameraFeed (ui) [overlay: prompt text + timer]
├── Timer (ui) [variant: circular, 30s]
├── Mascot (ui) [state: listening, position: corner]
└── (analysis running in background via hooks)

Results (apps/web)
├── RadarChart (ui) [animated: true]
│   └── (or RadarOverlay if rescan)
├── OverallScore counter (apps/web)
├── Mascot (ui) [state: talking, message: commentary]
├── Button (ui) [CTA: "See Your Training Plan"]
└── Button (ui) [secondary: "Replay Recording"]

GameQueue (apps/web)
├── Mascot (ui) [state: talking, message: recommendation]
├── GameCard[] (apps/web)
│   ├── Card (ui) [hoverable]
│   ├── Badge (ui) [recommended tag]
│   └── ProgressBar (ui) [current axis score]
├── Button (ui) [Rescan]
└── Nav link to /progress

Game (apps/web)
├── GameShell (games)
│   ├── PromptPicker (games) [pre-game]
│   ├── Timer (ui)
│   ├── [Game-specific component] (games)
│   │   ├── CameraFeed (ui) [if needed]
│   │   └── Game-specific visuals
│   └── ScoreCard (games) [post-game]
└── Mascot (ui) [state: reacting, position: corner]

Progress (apps/web)
├── RadarOverlay (ui) [all scans overlaid]
├── TrendCharts (apps/web) [per-axis line charts]
├── StreakCounter (apps/web)
├── BadgeGrid (apps/web)
│   └── Badge[] (ui)
├── PersonalBests (apps/web)
└── Mascot (ui) [state: celebrating/encouraging]
```

---

## 8. Error Handling Strategy

### 8.1 Camera/Mic Errors

| Error | Cause | Handling |
| --- | --- | --- |
| `NotAllowedError` | User denied permission | Show friendly mascot message: "I need your camera and mic to listen to you speak!" + "Grant Access" button that re-requests |
| `NotFoundError` | No camera/mic device | Show message: "No camera found. Please connect a webcam." |
| `NotReadableError` | Camera in use by another app | Show message: "Your camera is being used by another app. Please close it and try again." |
| `OverconstrainedError` | Requested constraints not supported | Fall back to `{ video: true, audio: true }` with no constraints |

### 8.2 Web Speech API Errors

| Error | Cause | Handling |
| --- | --- | --- |
| `no-speech` | Silence detected | Auto-restart recognition. Don't surface to user — just keep listening. |
| `audio-capture` | Mic not available | Surface error: "Can't access microphone." |
| `network` | Network error (STT uses network in Chrome) | Surface error: "Speech recognition needs an internet connection in Chrome." |
| Recognition stops unexpectedly | Chrome timeout on silence | Auto-restart in `onend` handler if session is still active. |
| Browser not supported | Not Chrome | Surface on app load: "SpeechMAX works best in Google Chrome. Please switch browsers for the full experience." |

### 8.3 MediaPipe Errors

| Error | Cause | Handling |
| --- | --- | --- |
| Model failed to load | Network error or CDN down | Retry 3 times with exponential backoff. If still failing: surface "Loading AI models..." with progress, fall back to mocked vision data. |
| Low frame rate (<15fps) | Slow device | Reduce model complexity: `refineLandmarks: false`, skip hand tracking, lower resolution. Surface nothing — degrade silently. |
| No face detected | User out of frame | Mascot prompts: "I can't see you! Make sure your face is in the camera." Pause analysis until face returns. |

### 8.4 General Error Boundary

```typescript
// apps/web/src/components/ErrorBoundary.tsx
// Wraps each page. On crash:
// 1. Log error to console
// 2. Show mascot with encouraging message
// 3. "Try Again" button that reloads the page
// 4. "Go Home" button that navigates to /
```

---

## 9. Performance Architecture

### 9.1 Loading Strategy

```
INITIAL LOAD (Landing Page)
├── React app bundle (~300KB gzipped)
├── Tailwind CSS (~30KB gzipped)
├── Framer Motion (~40KB gzipped)
├── Fonts + static assets
└── Total: ~500KB — fast load, no heavy deps yet

LAZY LOAD (On navigate to /onboarding or /scan)
├── MediaPipe WASM models (~4MB)
│   ├── Face Mesh model
│   ├── Pose model
│   └── Hands model
├── D3.js (~80KB gzipped, for radar chart)
├── Lottie-web (~50KB gzipped, for mascot)
└── Total: ~4.2MB — loaded while user reads onboarding slides

GAME-TIME LOADS (On navigate to specific game)
├── Game-specific components (code split per game)
└── Each game: ~20-50KB
```

### 9.2 Code Splitting

```typescript
// apps/web/src/router.tsx
const Scan = lazy(() => import('./pages/Scan'));
const Results = lazy(() => import('./pages/Results'));
const GameQueue = lazy(() => import('./pages/GameQueue'));
const Game = lazy(() => import('./pages/Game'));
const Progress = lazy(() => import('./pages/Progress'));

// Each game is also lazy loaded within the Game page
const gameLoaders = {
 'filler-ninja': lazy(() => import('@speechmax/games/filler-ninja')),
 'eye-lock': lazy(() => import('@speechmax/games/eye-lock')),
 // ...
};
```

### 9.3 MediaPipe Model Preloading

```typescript
// Triggered on /onboarding page mount (while user reads slides)
useEffect(() => {
 initMediaPipe().catch(console.error); // non-blocking preload
}, []);

// By the time user finishes onboarding and hits /scan,
// models are already loaded
```

### 9.4 Memory Management

| Concern | Solution |
| --- | --- |
| Video recording Blobs | Only keep last 2 scan recordings in memory. Older ones are discarded. |
| MediaPipe landmark data | Only current + previous frame stored. No frame history buffer. |
| Audio buffers | AnalyserNode handles its own circular buffer. We only extract per-frame readings. |
| Transcript accumulation | Append-only string. Capped at 10,000 characters (more than enough for 30-90s sessions). |
| Game history | Array of GameResult objects (lightweight — just scores and metrics, no raw data). |

---

## 10. Build & Deployment Architecture

### 10.1 Build Pipeline

```
pnpm install (from root)
      │
      ▼
pnpm build (from root — builds all packages then app)
      │
      ├── packages/analysis → tsc → dist/
      ├── packages/ui → tsc → dist/
      ├── packages/games → tsc → dist/
      └── apps/web → vite build → dist/
                                   │
                                   ▼
                        Static files in apps/web/dist/
                        ├── index.html
                        ├── assets/
                        │   ├── index-[hash].js
                        │   ├── index-[hash].css
                        │   └── vendor-[hash].js
                        └── models/ (MediaPipe WASM, if self-hosted)
```

### 10.2 Vercel Configuration

```json
// vercel.json (in root)
{
 "buildCommand": "pnpm build",
 "outputDirectory": "apps/web/dist",
 "installCommand": "pnpm install",
 "framework": "vite"
}
```

### 10.3 Environment

No environment variables needed. Zero secrets. Everything is client-side with free browser APIs.

### 10.4 CI/CD Flow

```
Developer pushes to feature branch
      │
      ▼
Opens PR → dev
      │
      ▼
Anam reviews + merges to dev
      │
      ▼
Anam merges dev → main
      │
      ▼
Vercel auto-detects push to main
      │
      ▼
Runs pnpm install + pnpm build
      │
      ▼
Deploys to speechmax.vercel.app
      │
      ▼
Live within 60 seconds
```

---

## 11. Directory Structure (Final, Annotated)

```
speechmax/
│
├── apps/
│   └── web/                                    # OWNER: Anam
│       ├── src/
│       │   ├── pages/                          # Route-level page components
│       │   │   ├── Landing.tsx                 # Hero, mascot idle, CTA
│       │   │   ├── Onboarding.tsx              # Slides, prompt picker, permissions
│       │   │   ├── Scan.tsx                    # Camera, timer, analysis orchestration
│       │   │   ├── Results.tsx                 # Radar chart reveal, mascot commentary
│       │   │   ├── GameQueue.tsx               # Ranked game cards, recommendations
│       │   │   ├── Game.tsx                    # Dynamic game wrapper, difficulty injection
│       │   │   └── Progress.tsx                # Radar evolution, trends, badges, bests
│       │   │
│       │   ├── components/                     # App-level components (not shared via package)
│       │   │   ├── ErrorBoundary.tsx
│       │   │   ├── GameCard.tsx                # Card for game queue
│       │   │   ├── OnboardingSlides.tsx
│       │   │   ├── OverallScore.tsx            # Animated counter
│       │   │   ├── TrendChart.tsx              # Per-axis line chart (Recharts or D3)
│       │   │   ├── BadgeGrid.tsx
│       │   │   └── PersonalBests.tsx
│       │   │
│       │   ├── layouts/
│       │   │   ├── AppLayout.tsx               # Shared layout wrapper (nav, mascot position)
│       │   │   └── GameLayout.tsx              # Game-specific layout (minimal chrome)
│       │   │
│       │   ├── hooks/
│       │   │   ├── useAnalysis.ts              # Orchestrates all analysis subsystems for scan
│       │   │   ├── useRecording.ts             # MediaRecorder wrapper for scan recording
│       │   │   └── useSoundFX.ts               # Sound effect player
│       │   │
│       │   ├── store/
│       │   │   ├── scanStore.ts
│       │   │   ├── gameStore.ts
│       │   │   └── sessionStore.ts
│       │   │
│       │   ├── lib/
│       │   │   ├── prompts.ts                  # Prompt bank (casual, professional, interview)
│       │   │   └── badges.ts                   # Badge definitions and check logic
│       │   │
│       │   ├── router.tsx
│       │   ├── App.tsx
│       │   └── main.tsx
│       │
│       ├── public/
│       │   ├── assets/
│       │   │   ├── sounds/                     # Hugo's MP3 files
│       │   │   │   ├── game-start.mp3
│       │   │   │   ├── filler-detected.mp3
│       │   │   │   ├── streak-milestone.mp3
│       │   │   │   ├── game-complete.mp3
│       │   │   │   ├── score-reveal.mp3
│       │   │   │   ├── badge-unlock.mp3
│       │   │   │   ├── scan-start.mp3
│       │   │   │   └── scan-complete.mp3
│       │   │   └── mascot/                     # Hugo's Lottie files (copied here for Meng's component)
│       │   └── models/                         # MediaPipe WASM (if self-hosted instead of CDN)
│       │
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.ts                  # SHARED — only Anam edits
│       ├── tsconfig.json                       # extends ../../tsconfig.base.json
│       └── package.json
│
├── packages/
│   ├── analysis/                               # OWNER: Anam
│   │   ├── src/
│   │   │   ├── mediapipe/
│   │   │   │   ├── init.ts                     # Model loading, initialization
│   │   │   │   ├── faceTracker.ts              # Eye contact, gaze vector, facial tension
│   │   │   │   ├── poseTracker.ts              # Posture, shoulder angle, head stability
│   │   │   │   ├── handTracker.ts              # Hand position, movement quantification
│   │   │   │   ├── landmarkProcessor.ts        # Raw landmarks → computed metrics
│   │   │   │   └── index.ts
│   │   │   ├── speech/
│   │   │   │   ├── transcriber.ts              # Web Speech API wrapper
│   │   │   │   ├── fillerDetector.ts           # Filler word matching + events
│   │   │   │   ├── wpmTracker.ts               # WPM calculation (average + rolling)
│   │   │   │   └── index.ts
│   │   │   ├── audio/
│   │   │   │   ├── pitchAnalyzer.ts            # Autocorrelation pitch detection
│   │   │   │   ├── volumeTracker.ts            # RMS volume normalization
│   │   │   │   └── index.ts
│   │   │   ├── scoring/
│   │   │   │   ├── radarScorer.ts              # 5-axis + overall score computation
│   │   │   │   ├── gameScorer.ts               # Per-game score computation
│   │   │   │   ├── formulas.ts                 # Pure functions for each scoring formula
│   │   │   │   └── index.ts
│   │   │   ├── types.ts                        # All exported interfaces (TrackingFrame, etc.)
│   │   │   └── index.ts                        # PUBLIC API — barrel export
│   │   ├── tsconfig.json
│   │   └── package.json                        # name: "@speechmax/analysis"
│   │
│   ├── games/                                  # OWNER: Bruno
│   │   ├── src/
│   │   │   ├── filler-ninja/
│   │   │   │   ├── FillerNinja.tsx              # Main game component
│   │   │   │   ├── useFillerNinja.ts            # Game logic hook
│   │   │   │   ├── NinjaSlash.tsx               # Slash animation (SVG/CSS)
│   │   │   │   ├── NinjaMeter.tsx               # Filler-free streak gauge
│   │   │   │   ├── FloatingFiller.tsx           # Floating word target component
│   │   │   │   └── types.ts
│   │   │   ├── eye-lock/
│   │   │   │   ├── EyeLock.tsx
│   │   │   │   ├── useEyeLock.ts
│   │   │   │   ├── GazeIndicator.tsx            # Green pulse / dim ring
│   │   │   │   ├── CameraDot.tsx                # Gaze target dot
│   │   │   │   └── types.ts
│   │   │   ├── pace-racer/
│   │   │   │   ├── PaceRacer.tsx
│   │   │   │   ├── usePaceRacer.ts
│   │   │   │   ├── PaceBar.tsx                  # Horizontal zone bar
│   │   │   │   ├── WpmCounter.tsx               # Large WPM number display
│   │   │   │   └── types.ts
│   │   │   ├── pitch-surfer/
│   │   │   │   ├── PitchSurfer.tsx
│   │   │   │   ├── usePitchSurfer.ts
│   │   │   │   ├── OceanWave.tsx                # Canvas/SVG wave visualization
│   │   │   │   ├── MascotSurfer.tsx             # Mascot riding the wave
│   │   │   │   ├── VariationMeter.tsx           # Pitch variation gauge
│   │   │   │   └── types.ts
│   │   │   ├── statue-mode/
│   │   │   │   ├── StatueMode.tsx
│   │   │   │   ├── useStatueMode.ts
│   │   │   │   ├── SkeletonOverlay.tsx          # MediaPipe skeleton drawn on canvas
│   │   │   │   ├── HeatmapRenderer.tsx          # Color regions by movement level
│   │   │   │   ├── StillnessScore.tsx           # Live stillness percentage
│   │   │   │   └── types.ts
│   │   │   ├── shared/
│   │   │   │   ├── GameShell.tsx                # Wrapper: pre-game → active → post-game
│   │   │   │   ├── ScoreCard.tsx                # Post-game results + buttons
│   │   │   │   ├── PromptPicker.tsx             # Category selector + random prompt
│   │   │   │   ├── Countdown.tsx                # 3-2-1 pre-game animation
│   │   │   │   ├── useGameTimer.ts              # Timer hook with auto-complete
│   │   │   │   └── types.ts                     # GameProps, GameResult
│   │   │   └── index.ts                         # PUBLIC API — barrel export
│   │   ├── tsconfig.json
│   │   └── package.json                         # name: "@speechmax/games"
│   │
│   └── ui/                                     # OWNER: Meng
│       ├── src/
│       │   ├── radar-chart/
│       │   │   ├── RadarChart.tsx                # D3 pentagon + Framer Motion animation
│       │   │   ├── RadarOverlay.tsx              # Ghost + new shape comparison
│       │   │   ├── useRadarAnimation.ts          # Staggered axis animation hook
│       │   │   ├── radarGeometry.ts              # D3 path calculation (pure functions)
│       │   │   └── types.ts
│       │   ├── mascot/
│       │   │   ├── Mascot.tsx                    # State machine component
│       │   │   ├── useMascot.ts                  # State management + transitions
│       │   │   ├── SpeechBubble.tsx              # Animated text bubble
│       │   │   └── types.ts
│       │   ├── camera/
│       │   │   ├── CameraFeed.tsx                # Webcam display + overlay slot
│       │   │   ├── useCamera.ts                  # getUserMedia hook
│       │   │   └── types.ts
│       │   ├── common/
│       │   │   ├── Button.tsx                    # 3 variants × 3 sizes
│       │   │   ├── Card.tsx                      # Hoverable, clickable card
│       │   │   ├── Badge.tsx                     # Earned/unearned with icon
│       │   │   ├── Timer.tsx                     # Circular + linear countdown
│       │   │   ├── ProgressBar.tsx               # Animated fill with label
│       │   │   └── index.ts
│       │   ├── animations/
│       │   │   ├── FadeIn.tsx                    # Reusable fade-in wrapper
│       │   │   ├── SlideUp.tsx                   # Reusable slide-up wrapper
│       │   │   └── ScaleIn.tsx                   # Reusable scale-in wrapper
│       │   └── index.ts                          # PUBLIC API — barrel export
│       ├── tsconfig.json
│       └── package.json                          # name: "@speechmax/ui"
│
├── pnpm-workspace.yaml                          # OWNER: Anam
├── package.json                                 # OWNER: Anam (root scripts)
├── tsconfig.base.json                           # OWNER: Anam (shared TS config)
├── tailwind.config.ts                           # OWNER: Anam (shared Tailwind config)
├── .gitignore
├── .prettierrc
└── README.md
```

---

## 12. External Dependencies

### 12.1 Per-Package Dependencies

**Root (shared dev dependencies)**

| Package | Version | Purpose |
| --- | --- | --- |
| typescript | ^5.4 | Language |
| tailwindcss | ^3.4 | Styling |
| prettier | ^3.2 | Code formatting |

**@speechmax/analysis**

| Package | Version | Purpose |
| --- | --- | --- |
| @mediapipe/tasks-vision | ^0.10 | Face mesh, pose, hand tracking (WASM) |

**@speechmax/ui**

| Package | Version | Purpose |
| --- | --- | --- |
| d3 | ^7.9 | Radar chart geometry (path generation) |
| @types/d3 | ^7.4 | D3 type definitions |
| framer-motion | ^11.0 | Animation library |
| lottie-web | ^5.12 | Mascot Lottie file rendering |

**@speechmax/games**

| Package | Version | Purpose |
| --- | --- | --- |
| (none unique) | — | Games only use imports from @speechmax/ui and @speechmax/analysis |

**apps/web**

| Package | Version | Purpose |
| --- | --- | --- |
| react | ^18.3 | UI framework |
| react-dom | ^18.3 | DOM rendering |
| react-router-dom | ^6.22 | Client-side routing |
| zustand | ^4.5 | State management |
| vite | ^5.4 | Bundler + dev server |
| @vitejs/plugin-react | ^4.2 | React plugin for Vite |

### 12.2 Total Bundle Impact

| Package | Gzipped Size | Load Timing |
| --- | --- | --- |
| React + ReactDOM | ~45KB | Initial |
| Tailwind (purged) | ~15KB | Initial |
| Framer Motion | ~40KB | Initial (used on landing) |
| React Router | ~15KB | Initial |
| Zustand | ~3KB | Initial |
| D3 (subset) | ~30KB | Lazy (on /results) |
| Lottie-web | ~50KB | Lazy (on /onboarding) |
| MediaPipe WASM | ~4MB | Lazy (on /onboarding, preloaded) |
| **Total initial** | **~150KB** | — |
| **Total with lazy** | **~4.3MB** | — |

---

## 13. Key Architecture Decisions

| # | Decision | Rationale | Alternative Considered |
| --- | --- | --- | --- |
| 1 | Zero backend | $0 cost, zero privacy concerns, no auth complexity, works offline after cache | Supabase for persistence — rejected because in-memory is fine for demo |
| 2 | MediaPipe over TensorFlow.js | Purpose-built for face/pose/hands, smaller models, better docs, Google-maintained | TF.js pose detection — heavier, less accurate for face mesh |
| 3 | Web Speech API over Whisper | Free, zero latency, no API key, built into Chrome | Whisper API — $0.006/min but adds latency and server dependency |
| 4 | D3 + Framer Motion over Recharts | Full visual control for radar chart, custom animation sequencing, premium feel | Recharts — has radar chart but limited animation control |
| 5 | Zustand over Redux/Context | Minimal boilerplate, no providers needed, perfect for in-memory state | Redux — overkill for no-persistence state. Context — re-render issues. |
| 6 | pnpm workspaces over Turborepo | Simple, no config overhead, 3 devs don't need build caching | Turborepo — faster builds but setup time not worth it for hackathon |
| 7 | Monorepo over polyrepo | 3 devs on 1 project. Shared types. Atomic deploys. | Separate repos — coordination nightmare for 3-person hackathon team |
| 8 | Subscribe-based analysis API | Games and scan page subscribe to real-time callbacks. Decouples analysis from consumers. | Polling — inefficient. Direct import — couples game logic to analysis internals. |
| 9 | Simplified scoring formulas | Proves concept with real data. Algorithms can be tuned post-hackathon. | Complex ML scoring — not enough time, diminishing returns for demo |
| 10 | In-memory only | No backend, no persistence complexity. Demo doesn't need data across sessions. | LocalStorage — adds edge cases (quota, serialization). Not worth it. |
| 11 | Chrome-only support | Web Speech API is Chrome-only. 65%+ market share. Demo is on our machine. | Cross-browser — would need alternative STT (cloud API), adds cost and complexity. |
| 12 | Lazy loading MediaPipe on onboarding | 4MB models load while user reads onboarding slides. No perceived wait on /scan. | Load on /scan — user sees a loading spinner. Bad UX. |
| 13 | Games as pure components (props in, callbacks out) | Testable, no store coupling, any game can be swapped or added without touching app code. | Games reading from stores — couples them to app, harder to test in isolation. |
| 14 | Single shared tailwind.config.ts | Consistent design tokens across all packages. Only Anam edits to prevent conflicts. | Per-package configs — risk of diverging styles, class conflicts. |

---

## 14. Security Considerations

| Concern | Mitigation |
| --- | --- |
| Camera/mic access | Browser handles permission. HTTPS required (Vercel provides). Permission revocable at any time. |
| Data transmission | None. Zero network requests after initial page load + model download. |
| XSS | No user-generated content displayed as HTML. Transcript is text-only. React's JSX escaping handles this. |
| Data storage | In-memory only. Closing the tab destroys all data. No cookies, no localStorage, no analytics. |
| Third-party scripts | No analytics, no tracking, no ads. Only dependencies are npm packages (auditable). |
| MediaPipe models | Downloaded from Google's CDN or self-hosted. Integrity verified by browser's CORS/CSP. |

---

## 15. Testing Strategy

### 15.1 For the Hackathon (Minimal but Effective)

| What | How | Who |
| --- | --- | --- |
| Analysis functions | Manual test in browser console + simple assertions in dev | Anam |
| UI components | Visual verification in Storybook-like isolation (Vite dev server with test page) | Meng |
| Games | Manual playtesting — speak into mic, verify game mechanics respond correctly | Bruno |
| Integration | End-to-end manual walkthrough of full user flow (scan → results → game → rescan) | Anam |
| Cross-device | Test on 2-3 different laptops with different webcams | All |
| Performance | Chrome DevTools Performance tab — check for frame drops during MediaPipe + game rendering | Anam |
| Deployment | Verify Vercel deploy works end-to-end, HTTPS active, camera/mic permissions work | Anam |

### 15.2 Post-Hackathon (Future)

- Unit tests for scoring formulas (pure functions — easy to test)
- Integration tests for analysis pipeline
- Visual regression tests for UI components
- End-to-end tests with Playwright

---

## 16. Architecture ↔ Spec Sheet Mapping

Every spec requirement maps to an architecture component:

| Spec Requirement | Architecture Component | Owner |
| --- | --- | --- |
| 30-second scan with camera + mic | Scan page + useAnalysis hook + useRecording hook | Anam |
| Real-time filler detection | speech/fillerDetector.ts + Web Speech API | Anam |
| Eye contact tracking | mediapipe/faceTracker.ts + landmark processor | Anam |
| Posture analysis | mediapipe/poseTracker.ts + landmark processor | Anam |
| Hand/fidget tracking | mediapipe/handTracker.ts + landmark processor | Anam |
| Pitch variation | audio/pitchAnalyzer.ts + Web Audio API | Anam |
| Volume tracking | audio/volumeTracker.ts + Web Audio API | Anam |
| Radar chart (5-axis) | RadarChart component (D3 + Framer Motion) | Meng |
| Radar overlay comparison | RadarOverlay component | Meng |
| Mascot coach | Mascot component (Lottie state machine) | Meng |
| Camera feed display | CameraFeed component + useCamera hook | Meng |
| Common UI (Button, Card, etc.) | Common component library | Meng |
| Filler Ninja game | filler-ninja/ (component + hook + visuals) | Bruno |
| Eye Lock game | eye-lock/ (component + hook + visuals) | Bruno |
| Pace Racer game | pace-racer/ (component + hook + visuals) | Bruno |
| Pitch Surfer game | pitch-surfer/ (component + hook + visuals) | Bruno |
| Statue Mode game | statue-mode/ (component + hook + visuals) | Bruno |
| Game shell (timer, prompts) | shared/GameShell, PromptPicker, ScoreCard | Bruno |
| Scoring engine | scoring/radarScorer.ts + gameScorer.ts | Anam |
| State management | Zustand stores (scan, game, session) | Anam |
| Routing | React Router + route guards | Anam |
| Progress tracking | Progress page + sessionStore | Anam |
| Badges | sessionStore.checkBadges() + Badge component | Anam (logic) + Meng (visual) |
| Sound effects | useSoundFX hook + Hugo's MP3s | Anam (integration) + Hugo (assets) |
| Deployment | Vercel + pnpm build | Anam |
| Promo video | N/A (non-code) | Hugo |
| Mobile wireframes | N/A (non-code) | Hugo |

---

## 17. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
| --- | --- | --- | --- |
| Web Speech API stops mid-session | Filler detection + WPM fail | Medium | Auto-restart on `onend`. Fallback: show "Speech recognition paused" + manual restart button. |
| MediaPipe drops to <15fps | Body language analysis unreliable | Low | Reduce model complexity. Skip hand tracking. Lower video resolution. |
| MediaPipe models fail to load from CDN | Vision features completely broken | Low | Self-host models in `public/models/`. Retry with exponential backoff. |
| Laptop mic picks up ambient noise | Filler false positives | Medium | Only match fillers on `isFinal` transcripts (not interim). Consider confidence threshold. |
| Scoring formulas produce weird results | Demo looks broken | Medium | Test with 5+ people before demo. Clamp all scores 0-100. Sanity-check each formula. |
| Vercel deploy fails | No live demo | Low | Test deploy early (Phase 1). Have local `pnpm dev` as fallback on demo day. |
| Merge conflicts despite directory ownership | Dev time wasted | Low | PR review checklist. No root config edits without Anam. Rebase before PR. |
| Hugo's assets delivered late | No mascot, no sounds | Medium | Meng builds mascot with placeholder. Sounds are late-stage polish. |
| Team member's internet drops during hackathon | Can't push/pull | Low | Everyone commits + pushes frequently. Offline work possible within owned directories. |

---

*This architecture is designed to be built by 3 developers in parallel with zero merge conflicts, producing a fully functional demo that impresses hackathon judges through its technical ambition (client-side ML), visual polish (animations + mascot), and clear product narrative (diagnose → prescribe → improve).*

# SpeechMAX — Final Implementation Workflow

**This document is the single source of truth for how every developer (and their Claude Code agent) implements tickets in this project.** Read this fully before starting any work.

---

## 0. Who You Are — Read Your Section

Before doing anything, identify which developer you are and read your specific rules.

| Developer | Package Ownership | Branch Prefix | Imports FROM | Does NOT Touch |
| --- | --- | --- | --- | --- |
| **Anam** | `packages/analysis/` + `apps/web/` + root configs | `anam/` | `@speechmax/ui`, `@speechmax/games` | `packages/ui/`, `packages/games/` |
| **Meng** | `packages/ui/` | `meng/` | (none — standalone package) | `packages/analysis/`, `packages/games/`, `apps/web/`, root configs |
| **Bruno** | `packages/games/` | `bruno/` | `@speechmax/ui`, `@speechmax/analysis` | `packages/analysis/`, `packages/ui/`, `apps/web/`, root configs |

### The Golden Rules (All Developers)

1. **You only create/edit files inside your owned directories.** No exceptions.
2. **You only import from other packages via `@speechmax/{name}`.** Never use relative paths reaching into another package's `src/` directory.
3. **You never edit root config files** (`pnpm-workspace.yaml`, `tsconfig.base.json`, `tailwind.config.ts`, root `package.json`). If you need a change, message Anam.
4. **You never push to `main` or `dev` directly.** All work goes through PRs targeting `dev`.
5. **Anam reviews every PR.** No code merges without Anam's approval.
6. **Committed code is source of truth.** Not Figma, not a conversation, not a memory — the code in `dev` is what's real.

---

## 1. Ticket Structure

Every ticket in Linear has the following sections. **Read ALL of them before starting.**

```
┌─────────────────────────────────────────────────────────┐
│  TICKET: SM-{XX}: {Title}                                │
│                                                          │
│  Description       — What to build and why               │
│  Implementation    — How to build it (files, patterns)   │
│  Acceptance        — Checkbox list of requirements       │
│       Criteria       (every box must be checked)         │
│  Validation        — How to prove each criterion is met  │
│  Testing           — How to test it works correctly      │
│  Dependencies      — What must exist before you start    │
│  Owner             — Who implements this ticket          │
│  Package           — Which directory you work in         │
│  Epic / Milestone  — Which Epic this belongs to          │
└─────────────────────────────────────────────────────────┘
```

**Critical**: Do not start implementation until you have read and understood ALL sections. If anything is unclear, flag it immediately — do not guess.

---

## 2. The Workflow — Step by Step

```
READ ticket fully
   ↓
CHECK dependencies (are they in dev yet? if not, use mocks)
   ↓
FLAG blockers (missing deps, unclear spec → ask, don't guess)
   ↓
CREATE branch from dev
   ↓
IMPLEMENT (build it, commit frequently)
   ↓
VERIFY (pnpm build passes, it renders, acceptance criteria met)
   ↓
REBASE on dev + swap mocks for real imports
   ↓
PUSH branch + open PR → dev
   ↓
ANAM reviews → feedback loop if needed
   ↓
MERGE to dev
   ↓
UPDATE Linear ticket → Done
```

---

## 3. Phase-by-Phase Detail

### 3.1 — Read & Understand

Pull the ticket from Linear. Read:

| Section | What to look for |
| --- | --- |
| **Description** | The "what" and "why". Understand the purpose, not just the task. |
| **Implementation** | Specific files to create/modify, patterns to follow, technical guidance. |
| **Acceptance Criteria** | The exact requirements. Every single checkbox must be satisfied. If a criterion is ambiguous, ask before implementing. |
| **Validation** | How to prove each criterion works. These are your test cases. |
| **Testing** | Additional testing steps beyond validation (edge cases, integration checks). |
| **Dependencies** | Other tickets that must be done first. Check if they've been merged to `dev`. |

### 3.2 — Check Dependencies

Before writing code:

```
Is the dependency merged to dev?
   │
   ├── YES → git checkout dev && git pull → you have the real code
   │
   └── NO → Use a mock (see Section 5: Mock Strategy)
```

**Never block yourself on a dependency.** Use mocks and keep moving. Replace mocks with real imports when the dependency lands in `dev`.

### 3.3 — Flag Blockers

Before writing code, identify and raise:

- Missing information in the ticket
- Ambiguous acceptance criteria
- Dependencies not available (and can't be easily mocked)
- Need for a type/interface change in another package (message that package's owner)
- Need for a new npm dependency (message Anam)
- Need for a Tailwind config change (message Anam)

**Do not guess.** Ask immediately. The cost of waiting for an answer is much lower than the cost of implementing the wrong thing.

### 3.4 — Branch

```bash
# Always start from latest dev
git checkout dev
git pull origin dev

# Create your feature branch
git checkout -b {your-name}/{package}-{feature}
```

**Naming convention**: `{name}/{package}-{feature}`

Examples:
- `anam/analysis-filler-detector`
- `meng/ui-radar-chart`
- `bruno/games-filler-ninja`

**Never branch from `main`.** Always branch from `dev`.

### 3.5 — Plan

Before writing code, outline:

1. **Files to create**: List every new file with its purpose
2. **Files to modify**: List every existing file that will change
3. **Order of operations**: What to build first (types → logic → component → integration)
4. **Imports needed**: What you need from other packages (and are they available or need mocks?)
5. **Edge cases**: What could go wrong? What happens on error? What happens with empty/null data?

For complex tickets, share the plan with Anam before implementing.

### 3.6 — Implement

Rules for all developers:

1. **One logical piece at a time.** Build the types first, then the logic, then the component, then wire them together.
2. **Commit frequently to your branch.** Small commits with descriptive messages.
3. **Every commit references the ticket ID.** Format: `SM-{XX}: {what changed}`
4. **Stage specific files.** Never `git add .` or `git add -A`. Always `git add packages/games/src/filler-ninja/FillerNinja.tsx`
5. **Match existing patterns.** If other components use a pattern, follow it. Don't introduce new conventions.
6. **Stay in your directory.** If you find yourself wanting to edit a file outside your owned directories, stop. Message the owner instead.
7. **No drive-by refactors.** Don't clean up, rename, or "improve" code that isn't part of your ticket.

### 3.7 — Verify It Works

Before opening a PR, quick check:

1. **Does it build?** — `pnpm build` from root, zero errors
2. **Does it render/run?** — open dev server, use the feature, does it do the thing?
3. **Acceptance criteria met?** — go through each checkbox in the ticket, all must pass

The **Validation** line in each ticket is your smoke test — run that, and if it passes you're good. Don't overthink this — it's a hackathon, not a QA department.

### 3.8 — Rebase

Before opening a PR, get the latest `dev`:

```bash
git checkout dev
git pull origin dev
git checkout {your-branch}
git rebase dev
```

**What rebase does**: Replays your commits on top of the latest `dev`. This means:
- You now have everyone else's merged work
- You can swap mocks for real imports
- Any conflicts are resolved on your machine, not in the PR

**If there's a conflict** (unlikely due to directory ownership):
```bash
# Git pauses and shows the conflicting file
# Resolve the conflict in the file
git add {resolved-file}
git rebase --continue
```

If confused about a conflict, stop and message Anam.

### 3.9 — Replace Mocks

After rebase, check if real implementations have landed in `dev`:

```typescript
// BEFORE (mock — because @speechmax/analysis wasn't ready)
import { onFillerDetected } from './__mocks__/analysis';

// AFTER (real — Anam merged analysis to dev, rebase brought it in)
import { onFillerDetected } from '@speechmax/analysis';
```

Delete mock files once all real imports are wired up. If some deps still aren't in `dev`, keep the mocks and note it in the PR.

### 3.10 — Generate PR Document

Create a PR document following this exact template:

```markdown
# SM-{XX}: {Ticket Title}

## Summary
One paragraph: what was built and why.

## Approach
How it was built:
- Architecture decisions made
- Patterns used (and why)
- Key implementation details

## Changes from Spec
Deviations from the ticket spec, and why.
If none: "None — implemented as specified."

## Acceptance Criteria Validation

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | {criterion text} | PASS / FAIL | {how it was verified — screenshot, console output, test result} |
| 2 | {criterion text} | PASS / FAIL | {evidence} |
| ... | ... | ... | ... |

## Testing Results

| Test | Result | Notes |
|------|--------|-------|
| {test from ticket} | PASS / FAIL | {details} |
| Build check (`pnpm build`) | PASS | Zero TS errors |
| Visual match (Figma) | PASS | {screenshot comparison} |
| Edge case: {description} | PASS | {how handled} |

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `packages/games/src/filler-ninja/FillerNinja.tsx` | Created | Main game component |
| ... | ... | ... |

## Dependencies

| Dependency | Status |
|------------|--------|
| `@speechmax/analysis` `onFillerDetected` | ✅ Available in dev |
| `@speechmax/ui` `Timer` | ✅ Available in dev |
| Hugo's sound FX | ⏳ Not yet — using placeholder |

## Risk Assessment
- **Breaking changes**: None / {describe}
- **Regressions**: None / {areas to watch}
- **Edge cases handled**: {list}
- **Mock code remaining**: None / {list what's still mocked and why}

## Screenshots / Evidence
{Screenshots, recordings, console output showing the feature working}
```

### 3.11 — Push & Open PR

```bash
git push origin {your-branch}
```

Open a PR on GitHub:
- **Title**: `SM-{XX}: {Short description}`
- **Target**: `dev` (NEVER `main`)
- **Body**: Copy the PR document content
- **Reviewer**: Anam

### 3.12 — Review Process

Anam reviews the PR checking:

```
□ All files are within the author's owned directory
□ No edits to root configs or other packages
□ Imports use @speechmax/{name} (not relative paths into other packages)
□ Exported interfaces match the contract from merge_workflow.md
□ All acceptance criteria marked PASS with evidence
□ All tests marked PASS
□ TypeScript compiles (pnpm build)
□ No console.log / debugger statements
□ Commit messages reference ticket ID
□ Branch was rebased on dev
```

**If changes requested**: fix them, push to the same branch, re-request review.
**If approved**: Anam merges the PR into `dev`.

### 3.13 — Update Linear

After merge:
1. Move ticket status to **Done**
2. Add a comment with the PR link

---

## 4. Role-Specific Workflows

The core workflow above applies to everyone. Below are the differences per role.

### 4.1 Anam's Workflow (Lead Engineer)

Anam has additional responsibilities beyond the standard workflow:

**Owns two packages**: `packages/analysis/` and `apps/web/`. Anam branches for each separately:
- `anam/analysis-{feature}` for analysis work
- `anam/web-{feature}` for app page work

**PR Review**: Anam reviews Meng's and Bruno's PRs. Check the review checklist in Section 3.14.

**Merging dev → main**: Only Anam does this. Triggers Vercel deployment.
```bash
git checkout main
git pull origin main
git merge dev
git push origin main
```

**Root config changes**: Only Anam edits `pnpm-workspace.yaml`, `tsconfig.base.json`, `tailwind.config.ts`, root `package.json`. If Meng or Bruno need changes, they message Anam who makes the change in an `anam/config-{description}` branch.

**Integration testing**: After merging other people's PRs to `dev`, Anam pulls `dev`, runs the app, and verifies that the integration works (e.g., game using analysis hooks, page using UI components).

**Store ownership**: Only Anam edits Zustand stores in `apps/web/src/store/`. Games and UI components receive data via props, return data via callbacks. They never import stores directly.

**Scaffolding**: Anam sets up the monorepo, creates stub exports for all packages, and does the initial Vercel deploy. This unblocks Meng and Bruno.

### 4.2 Meng's Workflow (UI Developer)

**Package**: `packages/ui/` only.

**No internal package imports**: `@speechmax/ui` is a standalone package. It does not import from `@speechmax/analysis` or `@speechmax/games`. UI components are pure visual — they receive data via props and emit events via callbacks.

**Figma MCP**: Meng uses Claude Code + Figma MCP to translate designs into React components. Important rules:
- Only generate code inside `packages/ui/`
- Never let the MCP generate files into `packages/games/`, `packages/analysis/`, or `apps/web/`
- If the MCP suggests creating files outside your directory, reject and redirect
- Figma is reference, committed code is source of truth

**Component contracts**: Meng's components must match the interfaces defined in `merge_workflow.md` Section 6.2. If a prop needs to change, message Anam and Bruno first — they code against these types.

**Asset integration**: Meng integrates Hugo's mascot Lottie files into the Mascot component. Placeholder (colored div + text) until Hugo delivers.

**What Meng's Claude Code agent needs to know**:
```
YOU ARE WORKING IN: packages/ui/
YOU OWN: packages/ui/ — all files in this directory
YOU DO NOT TOUCH: packages/analysis/, packages/games/, apps/web/, root configs
YOU IMPORT FROM: nothing (standalone package)
YOU ARE IMPORTED BY: packages/games and apps/web
YOUR EXPORTS MUST MATCH: the interface contract in merge_workflow.md Section 6.2
BRANCH PREFIX: meng/
PR TARGET: dev
PR REVIEWER: Anam
```

**Meng's self-review checklist** (run before every PR):
```
□ All files are inside packages/ui/
□ No imports from @speechmax/analysis or @speechmax/games
□ Exported component props match the contract interfaces
□ Components are pure (no side effects, no store access)
□ Components accept className for style overrides
□ Framer Motion used for animations (not raw CSS transitions)
□ Tailwind classes used for styling (not inline styles)
□ pnpm build passes with zero errors
□ Components render correctly in isolation
□ Figma design is referenced but code is not pixel-perfect copy
```

### 4.3 Bruno's Workflow (Game Developer)

**Package**: `packages/games/` only.

**Imports from two packages**:
- `@speechmax/ui` — for Timer, CameraFeed, Button, Card, ProgressBar, etc.
- `@speechmax/analysis` — for onFillerDetected, onTrackingFrame, onTranscript, onAudioFrame, etc.

**Mock strategy**: If Anam's analysis or Meng's UI components aren't in `dev` yet, Bruno creates mocks in `packages/games/src/__mocks__/`:

```typescript
// packages/games/src/__mocks__/analysis.ts
export function onFillerDetected(callback) {
 const interval = setInterval(() => {
   if (Math.random() > 0.7) {
     callback({ word: 'um', timestamp: Date.now(), index: 0 });
   }
 }, 2000);
 return () => clearInterval(interval);
}
```

```typescript
// packages/games/src/__mocks__/ui.ts
export function Timer({ seconds, onComplete }) {
 // Minimal placeholder
 return <div>{seconds}s</div>;
}
```

**Before PR**: Remove all mocks and switch to real imports. If the real package isn't in `dev` yet, keep the mock but document it in the PR under "Dependencies".

**Game contract**: Every game exports a component that accepts `GameProps` and calls `onComplete(GameResult)` when done. This is the contract from `merge_workflow.md` Section 6.3. Don't change this interface without messaging Anam.

**Figma MCP**: Bruno references Meng's Figma designs for game visuals. Important rules:
- Only generate code inside `packages/games/`
- Import finished UI components from `@speechmax/ui` — don't rebuild them
- If Meng's component doesn't support what you need, message Meng to add a prop — don't fork the component

**What Bruno's Claude Code agent needs to know**:
```
YOU ARE WORKING IN: packages/games/
YOU OWN: packages/games/ — all files in this directory
YOU DO NOT TOUCH: packages/analysis/, packages/ui/, apps/web/, root configs
YOU IMPORT FROM: @speechmax/ui (components), @speechmax/analysis (hooks/types)
YOU ARE IMPORTED BY: apps/web
YOUR EXPORTS MUST MATCH: the interface contract in merge_workflow.md Section 6.3
MOCK STRATEGY: if deps not in dev, create mocks in packages/games/src/__mocks__/
BRANCH PREFIX: bruno/
PR TARGET: dev
PR REVIEWER: Anam
```

**Bruno's self-review checklist** (run before every PR):
```
□ All files are inside packages/games/
□ Imports from @speechmax/ui use the public API (not internal file paths)
□ Imports from @speechmax/analysis use the public API (not internal file paths)
□ Game component accepts exactly GameProps (difficulty, prompt, promptCategory, onComplete, onExit)
□ onComplete is called with a valid GameResult object
□ All mocks removed (or documented if deps not available)
□ No mock files in final PR (unless explicitly documented)
□ Game works with real analysis hooks (tested after rebase)
□ Game handles edge cases: no speech, no face, silence, rapid input
□ pnpm build passes with zero errors
□ Game renders within GameShell wrapper correctly
```

---

## 5. Mock Strategy (Detailed)

### 5.1 When to Mock

| Situation | Mock? | How |
| --- | --- | --- |
| Meng needs analysis data for UI | **No** — UI components don't import analysis. They receive data via props. Just pass test props. | `<RadarChart scores={{ clarity: 85, ... }} />` |
| Bruno needs analysis hooks | **Yes** — create mock in `__mocks__/` that simulates events | See Bruno section above |
| Bruno needs UI components | **Yes** — create inline placeholder or mock component | `const Timer = ({ seconds }) => <div>{seconds}s</div>` |
| Anam needs UI components | **Yes** — create placeholder in `apps/web/src/placeholders/` | Replace when Meng merges to dev |
| Anam needs game components | **Yes** — create placeholder in `apps/web/src/placeholders/` | Replace when Bruno merges to dev |

### 5.2 Mock Rules

1. **Mocks live in your own directory.** Never put mock files in another person's package.
2. **Mocks must match the real interface.** Same function signature, same prop types. This way swapping is a one-line import change.
3. **Delete mocks before PR** (unless deps genuinely aren't available yet).
4. **Document remaining mocks in the PR** under "Dependencies" with status.

### 5.3 Swapping Mocks for Real Code

After rebasing on `dev`:

```typescript
// Step 1: Check if the real export exists
// (just try the import — TypeScript will error if it doesn't exist)
import { onFillerDetected } from '@speechmax/analysis';

// Step 2: If it compiles, delete the mock file
// rm packages/games/src/__mocks__/analysis.ts

// Step 3: Update any conditional imports
// REMOVE: const analysis = USE_MOCKS ? mock : real
// KEEP:   import { onFillerDetected } from '@speechmax/analysis'
```

---

## 6. Commit Message Format

```
SM-{XX}: {concise description of what was done}
```

**Examples**:
```
SM-12: scaffold FillerNinja component with game shell
SM-12: add ninja slash animation on filler detection
SM-12: implement ninja meter and scoring logic
SM-07: build RadarChart with D3 pentagon geometry
SM-07: add staggered axis animation with Framer Motion
SM-03: implement Web Speech API transcriber with auto-restart
```

**Rules**:
- Always reference the Linear ticket ID
- Describe the *what*, not the *how*
- Present tense ("add", "implement", "build", not "added", "implemented")
- Stage specific files: `git add packages/games/src/filler-ninja/` — never `git add .`

---

## 7. Communication Protocol

| When | Action | Channel |
| --- | --- | --- |
| Before starting a ticket | Check that no one else is working on overlapping area | Team chat |
| Need a type/interface change in another package | Message the package owner with the change you need | Team chat |
| Need a new npm dependency | Message Anam with the package name, version, and why | Team chat |
| Need a Tailwind config change | Message Anam with the desired change | Team chat |
| Blocked by a dependency | Message immediately — don't wait | Team chat |
| Finished a PR | Message team so they can rebase and pick up your exports | Team chat |
| Found a bug in another package | Don't fix it yourself — file an issue and message the owner | Team chat + Linear |
| Finished all your tickets | Ask Anam for next assignment — don't freelance in other packages | Team chat |

---

## 8. Directory Ownership Quick Reference

```
FILE / DIRECTORY                           OWNER     OTHERS MAY EDIT?
──────────────────────────────────────     ────────  ────────────────
pnpm-workspace.yaml                       Anam      No
package.json (root)                        Anam      No
tsconfig.base.json                         Anam      No
tailwind.config.ts                         Anam      No
.gitignore                                 Anam      No
.prettierrc                                Anam      No

apps/web/**                                Anam      No
apps/web/src/store/**                      Anam      No (games/ui use props+callbacks)
apps/web/src/pages/**                      Anam      No
apps/web/src/hooks/**                      Anam      No
apps/web/src/lib/**                        Anam      No
apps/web/public/assets/sounds/**           Anam      No (Hugo delivers, Anam places)
apps/web/public/assets/mascot/**           Anam      No (Hugo delivers, Anam places)

packages/analysis/**                       Anam      No
packages/analysis/src/index.ts             Anam      No (public API — contract)

packages/ui/**                             Meng      No
packages/ui/src/index.ts                   Meng      No (public API — contract)
packages/ui/package.json                   Meng      No

packages/games/**                          Bruno     No
packages/games/src/index.ts                Bruno     No (public API — contract)
packages/games/package.json                Bruno     No
```

---

## 9. How Anam's Workflow Differs

Anam is both a developer AND the integrator. Here's what makes Anam's workflow unique:

### 9.1 Dual-Package Work
Anam works in two packages with separate branches:
```
anam/analysis-speech       → work in packages/analysis/
anam/analysis-mediapipe    → work in packages/analysis/
anam/web-scan-page         → work in apps/web/
anam/web-results-page      → work in apps/web/
```

Never mix analysis and web work in the same branch. Keep them separate for clean PRs.

### 9.2 Integration Work
After Meng and Bruno merge to `dev`, Anam:
1. Pulls `dev`
2. Wires their components into app pages
3. Tests the integration end-to-end
4. Fixes any glue-layer issues in `apps/web/`
5. This is normal `apps/web/` work — just happens to follow others' merges

### 9.3 Self-Merging
Anam reviews their own PRs to `dev` (since there's no other reviewer available). But Anam still follows the full PR workflow — writes the PR doc, checks every criterion, then merges.

### 9.4 Deploying
Only Anam merges `dev` → `main`:
```bash
git checkout main
git pull origin main
git merge dev
git push origin main
# Vercel auto-deploys
```

Before deploying, Anam runs the app locally from `dev` and does a full flow test.

---

## 10. PR Review Checklist (For Anam Reviewing Others)

When Anam receives a PR from Meng or Bruno:

```
OWNERSHIP
 □ All changed files are within the author's owned directory
 □ No files created/modified outside their package
 □ No root config changes

IMPORTS
 □ Imports use @speechmax/{name} public API
 □ No imports from internal file paths of other packages
 □ No imports from apps/web (stores, hooks, etc.)

CONTRACT
 □ Exported interfaces match merge_workflow.md contracts
 □ Component props match the agreed types
 □ Game components accept GameProps and emit GameResult
 □ No type changes without team communication

CODE QUALITY
 □ TypeScript compiles (pnpm build from root)
 □ No console.log or debugger statements
 □ No TODO comments without ticket reference
 □ Matches existing code patterns
 □ No unnecessary files (mock files removed, no temp files)

TICKET COMPLIANCE
 □ All acceptance criteria addressed with PASS status
 □ All validation steps documented with results
 □ All testing steps documented with results
 □ Commit messages reference ticket ID
 □ Branch was rebased on dev before PR
 □ PR description follows the template

INTEGRATION (checked after merging to dev)
 □ pnpm build passes from root
 □ pnpm dev starts without errors
 □ No new console errors in browser
 □ Component integrates correctly when imported from another package
```

---

## 11. Emergency Procedures

### 11.1 Merge Conflict
```
1. STOP — don't force push or resolve blindly
2. MESSAGE Anam: "Conflict in {file} between my branch and dev"
3. ANAM resolves (or guides you through resolution)
4. POST-MORTEM: figure out why two people touched the same file
```

### 11.2 Accidentally Edited Wrong Package
```
1. DON'T commit the changes
2. git checkout -- {wrong-file} to revert
3. If already committed: git reset HEAD~1 to undo the commit
4. If already pushed: message Anam immediately
```

### 11.3 Build Breaks After Rebase
```
1. Check which file has the error (TypeScript will tell you)
2. If it's a type mismatch from another package: message that owner
3. If it's your code: fix it
4. If it's confusing: message Anam
```

### 11.4 Need Something Not in Your Package
```
1. DON'T create it yourself in the other package
2. MESSAGE the owner: "I need {what} from @speechmax/{package} — can you add it?"
3. In the meantime: use a mock in your own package
4. When they deliver: swap mock for real import
```

---

## 12. Reference Documents

Before starting work, read these in order:

| Order | Document | Location | What it tells you |
| --- | --- | --- | --- |
| 1 | **This document** | `planning/final_workflow.md` | How to work (you're reading it) |
| 2 | **Merge Workflow** | `planning/merge_workflow.md` | Team split, interface contracts, import rules, branch strategy |
| 3 | **Spec Sheet** | `planning/spec_sheet.md` | What to build (every feature, every game, every component) |
| 4 | **Architecture** | `planning/architecture.md` | How it's built (data flows, pipelines, system design) |
| 5 | **PRD** | `planning/PRD.md` | Tickets with implementation details, acceptance criteria, validation, testing |

---

## 13. Quick Reference Card

```
BEFORE STARTING A TICKET
 1. Read the full ticket (description, implementation, criteria, validation, testing)
 2. Check dependencies — in dev? Use real imports. Not in dev? Use mocks.
 3. Flag blockers immediately.

DURING IMPLEMENTATION
 1. Only touch files in YOUR directory.
 2. Import from other packages via @speechmax/{name} only.
 3. Commit frequently: SM-{XX}: {description}
 4. Stage specific files, never git add .

BEFORE PR
 1. pnpm build — zero errors.
 2. Does the feature work? (run validation from ticket)
 3. All acceptance criteria checkboxes met?
 4. Rebase on dev + swap mocks for real imports.
 5. Generate PR document.

PR RULES
 Target:    always → dev
 Reviewer:  always Anam
 Template:  use the PR doc template from Section 3.12
 Title:     SM-{XX}: {description}
 Branch:    {name}/{package}-{feature}

NEVER DO
 ✗ Push to main or dev directly
 ✗ Edit files outside your package
 ✗ Import from internal paths of other packages
 ✗ Edit root config files
 ✗ Edit Zustand stores (apps/web/src/store/)
 ✗ Change an exported interface without team communication
 ✗ Use git add . or git add -A
 ✗ Guess when you're unsure — ask instead
```
# SpeechMAX — Merge & Collaboration Workflow

---

## 1. Team Roles

| Person | Role | Owns | Does NOT Touch |
| --- | --- | --- | --- |
| **Anam** | Lead engineer, architect, reviewer | `packages/analysis/` (MediaPipe, speech, audio, scoring) + `apps/web/` (pages, routing, stores, layout) + all root config files | `packages/ui/`, `packages/games/` |
| **Meng** | UI developer + Figma designer | `packages/ui/` (radar chart, mascot, camera, common components) | `packages/analysis/`, `apps/web/`, `packages/games/`, root configs |
| **Bruno** | Game developer | `packages/games/` (all 5 games + game shell + score card + prompt picker) | `packages/analysis/`, `apps/web/`, `packages/ui/`, root configs |
| **Hugo** | Non-coding (design + content) | Asset delivery: mascot animations, sound FX, mobile wireframes, promo video | All code |

### Why This Split

```
packages/analysis  (Anam)   ← standalone, no internal package deps, the brain
packages/ui        (Meng)   ← standalone, no internal package deps, the look
packages/games     (Bruno)  ← imports from ui + analysis (uses their exported types/components)
apps/web           (Anam)   ← imports from all packages (integrates everything into pages)
```

- **Anam** owns the hardest and most critical code: MediaPipe integration, Web Speech API, Web Audio API, scoring engine, and the app itself (pages, stores, routing). Anam also reviews every PR and is the only person who merges to `main`.
- **Meng** owns all visual components. Already in Figma designing the system — translates designs directly into React components using Claude Code MCP + Figma MCP. Builds every reusable component the games and app consume.
- **Bruno** owns all 5 game components. Each game is a self-contained component that imports from `@speechmax/ui` (components) and `@speechmax/analysis` (hooks/types). Bruno doesn't build the analysis logic or the UI primitives — he wires them together into game experiences.
- **Hugo** delivers Lottie files, sound effects, mobile wireframes, and the promo video. Zero code involvement.

### The Golden Rule
**Each person owns entire directories. No two developers edit the same file. Ever.**

If you need something from another person's package, you import their exports. You don't go modify their code. If their export doesn't give you what you need, you message them to update it.

---

## 2. Development Tooling & MCP

### 2.1 Claude Code + Figma MCP
Meng and Bruno both use Claude Code connected to a Figma MCP server. This means:

- **Meng** designs component visuals in Figma → uses Claude Code to generate the React/Tailwind implementation → iterates between Figma and code
- **Bruno** references Meng's Figma designs for game screens → uses Claude Code to build game components → imports Meng's finished UI components from `@speechmax/ui`
- **Anam** uses Claude Code for analysis logic and app integration — no Figma dependency

### 2.2 MCP Workflow Considerations
- Figma MCP generates code based on current Figma designs. If Meng updates a design in Figma, the generated code may differ from what's already committed. **Figma is reference, committed code is truth.**
- When Bruno uses Figma MCP for game designs, he should only generate code within `packages/games/`. Never let the MCP generate files into another person's package.
- Claude Code agents working on tickets must respect the merge workflow — read this document before starting work.

### 2.3 Package Naming for Imports
Each package is scoped under `@speechmax/`:

```
@speechmax/analysis  → packages/analysis
@speechmax/ui        → packages/ui
@speechmax/games     → packages/games
```

This is configured in each package's `package.json` `name` field and in `pnpm-workspace.yaml`.

---

## 3. Branch Strategy

### 3.1 Branch Structure

```
main                              ← production, auto-deploys to Vercel
│
├── dev                           ← integration branch, all PRs target this
│
├── anam/analysis-speech          ← Anam's work on speech analysis
├── anam/analysis-mediapipe       ← Anam's work on MediaPipe
├── anam/web-scan-page            ← Anam's work on scan page
├── anam/web-results-page         ← Anam's work on results page
│
├── meng/ui-common                ← Meng's common components
├── meng/ui-radar-chart           ← Meng's radar chart
├── meng/ui-camera                ← Meng's camera feed
├── meng/ui-mascot                ← Meng's mascot component
│
├── bruno/games-shell             ← Bruno's game shell wrapper
├── bruno/games-filler-ninja      ← Bruno's Filler Ninja game
├── bruno/games-eye-lock          ← Bruno's Eye Lock game
└── ...
```

### 3.2 Branch Naming Convention
```
{person}/{package}-{feature}
```
Examples: `anam/analysis-filler-detector`, `meng/ui-radar-chart`, `bruno/games-pitch-surfer`

### 3.3 Rules

1. **Nobody pushes directly to `main` or `dev`.** All changes go through PRs.
2. **All PRs target `dev`.** Never PR directly to `main`.
3. **Anam is the sole reviewer.** No PR merges without Anam's approval.
4. **Anam is the sole person who merges `dev` → `main`.** This triggers Vercel deployment.
5. **Rebase on `dev` before opening a PR.** This catches conflicts before they reach the PR.
6. **One feature per branch.** Don't bundle unrelated changes. Small, focused PRs.
7. **Branch from `dev`, not from `main`.** `dev` always has the latest integrated code.

### 3.4 Why `dev` Exists
Without `dev`, everyone PRs to `main` and every merge is a production deployment. With `dev`:
- Anam can merge multiple PRs to `dev`, test them together, and only push to `main` when everything works end-to-end.
- If Bruno's Filler Ninja PR breaks when combined with Meng's UI changes, Anam catches it in `dev` before it hits production.
- `main` stays clean and deployable at all times.

---

## 4. The Full PR Lifecycle — Concrete Example

Here's exactly what it looks like when Bruno builds the Filler Ninja game, from start to merge.

### Step 1 — Bruno picks up the Linear ticket

Bruno sees ticket `SM-14: Build Filler Ninja Game` assigned to him in Linear. He reads the full spec in the ticket (which references the spec sheet for detailed mechanics).

### Step 2 — Bruno creates a branch

```bash
# Bruno makes sure he's up to date with dev
git checkout dev
git pull origin dev

# Bruno creates his feature branch
git checkout -b bruno/games-filler-ninja
```

### Step 3 — Bruno checks what he can import

Before writing any code, Bruno checks what's available from other packages. He looks at the published interfaces:

```typescript
// From @speechmax/analysis (Anam's package)
import { onTranscript, onFillerDetected } from '@speechmax/analysis';
import type { TranscriptEvent, FillerEvent } from '@speechmax/analysis';

// From @speechmax/ui (Meng's package)
import { CameraFeed, Timer, Button, Card } from '@speechmax/ui';
```

**If Anam hasn't built `onFillerDetected` yet**, Bruno uses a mock:

```typescript
// packages/games/src/filler-ninja/mocks.ts (temporary, deleted before PR)
export function onFillerDetected(callback: (data: FillerEvent) => void) {
 // Simulate a filler every 5 seconds for dev testing
 setInterval(() => {
   callback({ word: 'um', timestamp: Date.now() });
 }, 5000);
}
```

**If Meng hasn't built `Timer` yet**, Bruno uses a placeholder:

```typescript
// Temporary inline placeholder
const Timer = ({ seconds }: { seconds: number }) => <div>{seconds}s</div>;
```

This way Bruno is **never blocked** by other people's progress.

### Step 4 — Bruno builds the game

Bruno works exclusively inside `packages/games/src/filler-ninja/`:

```
packages/games/src/filler-ninja/
├── FillerNinja.tsx       ← main game component
├── useFillerNinja.ts     ← game logic hook
├── NinjaSlash.tsx        ← slash animation component
├── NinjaMeter.tsx        ← filler-free streak meter
└── types.ts              ← game-specific types
```

He **does NOT** touch:
- `packages/analysis/` (Anam's)
- `packages/ui/` (Meng's)
- `apps/web/` (Anam's)
- Any root config file

### Step 5 — Bruno commits frequently to his branch

```bash
git add packages/games/src/filler-ninja/
git commit -m "SM-14: scaffold FillerNinja component with game shell"

# ... more work ...

git add packages/games/src/filler-ninja/
git commit -m "SM-14: add ninja slash animation on filler detection"

# ... more work ...

git add packages/games/src/filler-ninja/
git commit -m "SM-14: implement ninja meter and scoring logic"
```

Bruno can push to his branch at any time for backup:

```bash
git push origin bruno/games-filler-ninja
```

### Step 6 — Bruno is ready to PR. He rebases on dev first.

```bash
# Get the latest dev (Meng might have merged UI components, Anam might have merged analysis)
git checkout dev
git pull origin dev

# Rebase Bruno's branch on top of dev
git checkout bruno/games-filler-ninja
git rebase dev
```

**What rebase does**: Takes all of Bruno's commits and replays them on top of the latest `dev`. This means:
- If Meng merged new UI components to `dev`, Bruno now has them
- If Anam merged analysis exports to `dev`, Bruno can swap out his mocks for real imports
- Any conflicts are resolved NOW, on Bruno's machine, not in the PR

**If there's a conflict during rebase** (unlikely since they own different directories):

```bash
# Git will pause and show the conflicting file
# Bruno resolves it, then:
git add <resolved-file>
git rebase --continue
```

If Bruno is confused, he stops and messages Anam.

### Step 7 — Bruno removes mocks and wires up real imports

After rebase, Bruno checks if the real implementations are now available:

```typescript
// BEFORE (mock)
import { onFillerDetected } from './mocks';

// AFTER (real — Anam's code is now in dev)
import { onFillerDetected } from '@speechmax/analysis';
```

If some real implementations still aren't in `dev` yet, Bruno keeps the mocks and notes it in the PR.

### Step 8 — Bruno pushes and opens a PR

```bash
git push origin bruno/games-filler-ninja
```

Then opens a PR on GitHub targeting `dev`:

```markdown
## PR: [Games] Filler Ninja game component

**Author**: Bruno
**Ticket**: SM-14
**Package**: packages/games
**Branch**: bruno/games-filler-ninja → dev

### What changed
- Built complete Filler Ninja game component
- Ninja slash animation on filler detection (CSS/SVG)
- Ninja meter (filler-free streak gauge)
- Scoring: longest filler-free streak, total fillers, fillers per minute
- Auto-scaling difficulty based on GameProps.difficulty prop
- Integrated with @speechmax/analysis for filler detection
- Integrated with @speechmax/ui for CameraFeed, Timer, Button

### Files touched (all within packages/games/)
- `src/filler-ninja/FillerNinja.tsx` (created)
- `src/filler-ninja/useFillerNinja.ts` (created)
- `src/filler-ninja/NinjaSlash.tsx` (created)
- `src/filler-ninja/NinjaMeter.tsx` (created)
- `src/filler-ninja/types.ts` (created)
- `src/index.ts` (modified — added FillerNinja export)

### How to test
1. Import `<FillerNinja>` in any page
2. Pass difficulty="medium", a prompt, and an onComplete callback
3. Speak with filler words — ninja slashes should appear
4. Speak cleanly — ninja meter should fill
5. Game ends after 60s — score card shows results

### Dependencies
- @speechmax/analysis `onFillerDetected` — ✅ available in dev
- @speechmax/ui `CameraFeed`, `Timer` — ✅ available in dev
- Hugo's sound FX — ⏳ not yet, using placeholder

### Screenshots
[game screenshot here]
```

### Step 9 — Anam reviews

Anam checks:
1. **Files**: Are all changes within `packages/games/`? No rogue edits in other packages?
2. **Imports**: Is Bruno importing correctly from `@speechmax/analysis` and `@speechmax/ui`? Not reaching into their internal files?
3. **Interface compliance**: Does `FillerNinja` accept the exact `GameProps` interface from the spec?
4. **Quality**: Does the code work? Is it clean? Does the game mechanic match the spec?

If changes needed: Anam comments on the PR. Bruno fixes, pushes, re-requests review.
If approved: Anam merges the PR into `dev`.

### Step 10 — Merge to dev

Anam clicks "Squash and merge" on GitHub (or merge commit — team preference).

```
dev now contains:
├── Anam's analysis code (merged earlier)
├── Meng's UI components (merged earlier)
└── Bruno's Filler Ninja (just merged)    ← NEW
```

### Step 11 — Anam tests integration on dev

Anam pulls `dev`, runs the app, and verifies that Filler Ninja works end-to-end with real analysis and real UI components. If something breaks at the integration point, Anam fixes it in `apps/web/` (the glue layer).

### Step 12 — When dev is stable, Anam merges to main

```bash
git checkout main
git merge dev
git push origin main
# Vercel auto-deploys
```

---

## 5. How Imports Flow Between Packages

This is how the three packages connect at the code level:

```
┌─────────────────────────────────────────────────────┐
│  apps/web (Anam)                                     │
│                                                      │
│  import { RadarChart, Mascot, CameraFeed } from '@speechmax/ui'
│  import { FillerNinja, EyeLock, ... } from '@speechmax/games'
│  import { startTracking, computeRadarScores } from '@speechmax/analysis'
│                                                      │
│  Pages wire everything together:                     │
│  - ScanPage uses CameraFeed + analysis hooks         │
│  - ResultsPage uses RadarChart + scoring             │
│  - GamePage renders game components                  │
└──────────────┬───────────────┬────────────────┬──────┘
              │               │                │
              ▼               ▼                ▼
┌──────────────────┐ ┌────────────────┐ ┌──────────────────┐
│ @speechmax/ui    │ │@speechmax/games│ │@speechmax/analysis│
│ (Meng)           │ │ (Bruno)        │ │ (Anam)           │
│                  │ │                │ │                  │
│ RadarChart       │ │ FillerNinja    │ │ faceTracker      │
│ Mascot           │ │ EyeLock        │ │ transcriber      │
│ CameraFeed       │ │ PaceRacer      │ │ fillerDetector   │
│ Button, Card     │ │ PitchSurfer    │ │ pitchAnalyzer    │
│ Timer, Badge     │ │ StatueMode     │ │ radarScorer      │
│ ProgressBar      │ │ GameShell      │ │ gameScorer       │
│                  │ │ ScoreCard      │ │                  │
│ (no deps)        │ │ (imports from  │ │ (no deps)        │
│                  │ │  ui + analysis)│ │                  │
└──────────────────┘ └────────────────┘ └──────────────────┘
```

### Import Rules

| From → To | Allowed? | Example |
| --- | --- | --- |
| `games` → `ui` | Yes | `import { Timer } from '@speechmax/ui'` |
| `games` → `analysis` | Yes | `import { onFillerDetected } from '@speechmax/analysis'` |
| `web` → `ui` | Yes | `import { RadarChart } from '@speechmax/ui'` |
| `web` → `games` | Yes | `import { FillerNinja } from '@speechmax/games'` |
| `web` → `analysis` | Yes | `import { startTracking } from '@speechmax/analysis'` |
| `ui` → `analysis` | **No** | UI components are pure visual. They don't know about analysis. |
| `ui` → `games` | **No** | UI doesn't know about games. |
| `analysis` → `ui` | **No** | Analysis is headless. No React imports. |
| `analysis` → `games` | **No** | Analysis doesn't know games exist. |
| `games` → `web` | **No** | Games don't import from the app. |
| `ui` → `web` | **No** | UI doesn't import from the app. |

### What "No deps" Means in Practice

`packages/analysis` and `packages/ui` have **zero imports from other internal packages**. They are leaf nodes. This means:
- Anam and Meng can work 100% in parallel from day one with zero coordination
- Bruno starts slightly later or uses mocks, since he imports from both

---

## 6. Interface Contracts

These are the exact TypeScript interfaces each package must export. They are the **contract** between packages. Everyone codes against these from day one.

### 6.1 Analysis Package — `@speechmax/analysis` (Anam)

Exported from `packages/analysis/src/index.ts`:

```typescript
// ============================================
// MEDIAPIPE
// ============================================

/** Initialize MediaPipe models (face mesh, pose, hands). Call once on app load. */
export function initMediaPipe(): Promise<void>;

/** Start tracking on a video element. Fires onTrackingFrame callbacks. */
export function startTracking(videoElement: HTMLVideoElement): void;

/** Stop all MediaPipe tracking. */
export function stopTracking(): void;

/** Subscribe to tracking frames (~30fps). Returns unsubscribe function. */
export function onTrackingFrame(callback: (data: TrackingFrame) => void): () => void;

export interface TrackingFrame {
 timestamp: number;
 eyeContact: boolean;
 eyeContactConfidence: number;  // 0-1
 postureScore: number;          // 0-100
 handMovement: number;          // 0-1 (0 = still, 1 = max)
 facialTension: number;         // 0-1
 headStability: number;         // 0-1 (1 = still)
 landmarks: {
   pose: number[][];            // [x, y, z] per landmark
   hands: number[][];
   face: number[][];
 };
}

// ============================================
// SPEECH
// ============================================

/** Start Web Speech API transcription. Fires onTranscript and onFillerDetected. */
export function startTranscription(): void;

/** Stop transcription. */
export function stopTranscription(): void;

/** Subscribe to transcript updates. Returns unsubscribe function. */
export function onTranscript(callback: (data: TranscriptEvent) => void): () => void;

/** Subscribe to filler word detections. Returns unsubscribe function. */
export function onFillerDetected(callback: (data: FillerEvent) => void): () => void;

export interface TranscriptEvent {
 text: string;
 isFinal: boolean;
 wordCount: number;
 timestamp: number;
}

export interface FillerEvent {
 word: string;
 timestamp: number;
 index: number;  // position in transcript
}

// ============================================
// AUDIO
// ============================================

/** Start audio analysis on a media stream. Fires onAudioFrame. */
export function startAudioAnalysis(stream: MediaStream): void;

/** Stop audio analysis. */
export function stopAudioAnalysis(): void;

/** Subscribe to audio frames (~60fps). Returns unsubscribe function. */
export function onAudioFrame(callback: (data: AudioFrame) => void): () => void;

export interface AudioFrame {
 pitch: number;       // Hz fundamental frequency
 volume: number;      // 0-1 normalized RMS
 timestamp: number;
}

// ============================================
// SCORING
// ============================================

export interface RadarScores {
 clarity: number;     // 0-100
 confidence: number;  // 0-100
 pacing: number;      // 0-100
 expression: number;  // 0-100
 composure: number;   // 0-100
 overall: number;     // 0-100 weighted
}

export interface ScanRawData {
 fillerCount: number;
 fillersPerMinute: number;
 fillerWords: FillerEvent[];
 wpm: number;
 wpmReadings: number[];
 eyeContactPct: number;
 eyeContactReadings: number[];
 postureScore: number;
 pitchStdDev: number;
 pitchReadings: number[];
 volumeReadings: number[];
 stillnessPct: number;
 fidgetCount: number;
 durationSeconds: number;
}

/** Compute radar scores from raw scan data. */
export function computeRadarScores(rawData: ScanRawData): RadarScores;

/** Compute game score (0-100) from game-specific metrics. */
export function computeGameScore(gameType: GameType, metrics: Record<string, number>): number;

export type GameType = 'filler-ninja' | 'eye-lock' | 'pace-racer' | 'pitch-surfer' | 'statue-mode';
```

### 6.2 UI Package — `@speechmax/ui` (Meng)

Exported from `packages/ui/src/index.ts`:

```typescript
// ============================================
// RADAR CHART
// ============================================

export function RadarChart(props: RadarChartProps): JSX.Element;

export interface RadarChartProps {
 scores: {
   clarity: number;
   confidence: number;
   pacing: number;
   expression: number;
   composure: number;
 };
 previousScores?: RadarChartProps['scores'];  // for overlay comparison
 animated?: boolean;                           // default true
 size?: number;                                // pixel width/height, default 400
 showLabels?: boolean;                         // default true
 showValues?: boolean;                         // default true
}

// ============================================
// MASCOT
// ============================================

export function Mascot(props: MascotProps): JSX.Element;

export type MascotState =
 | 'idle'
 | 'talking'
 | 'listening'
 | 'celebrating'
 | 'encouraging'
 | 'reacting-positive'
 | 'reacting-negative';

export interface MascotProps {
 state: MascotState;
 message?: string;          // speech bubble text
 size?: 'small' | 'medium' | 'large';
 position?: 'inline' | 'corner' | 'side';
}

// ============================================
// CAMERA
// ============================================

export function CameraFeed(props: CameraFeedProps): JSX.Element;

export interface CameraFeedProps {
 onStream?: (stream: MediaStream) => void;
 overlay?: React.ReactNode;
 mirror?: boolean;              // default true
 className?: string;
}

export function useCamera(): {
 stream: MediaStream | null;
 videoRef: React.RefObject<HTMLVideoElement>;
 isReady: boolean;
 error: string | null;
 startCamera: () => Promise<void>;
 stopCamera: () => void;
};

// ============================================
// COMMON COMPONENTS
// ============================================

export function Button(props: ButtonProps): JSX.Element;
export function Card(props: CardProps): JSX.Element;
export function Badge(props: BadgeProps): JSX.Element;
export function Timer(props: TimerProps): JSX.Element;
export function ProgressBar(props: ProgressBarProps): JSX.Element;

export interface ButtonProps {
 children: React.ReactNode;
 onClick?: () => void;
 variant?: 'primary' | 'secondary' | 'ghost';
 size?: 'small' | 'medium' | 'large';
 disabled?: boolean;
 className?: string;
}

export interface CardProps {
 children: React.ReactNode;
 className?: string;
 onClick?: () => void;
 hoverable?: boolean;
}

export interface BadgeProps {
 icon: React.ReactNode;
 name: string;
 earned: boolean;
 description?: string;
}

export interface TimerProps {
 seconds: number;
 onComplete: () => void;
 variant?: 'circular' | 'linear';
 size?: 'small' | 'medium' | 'large';
}

export interface ProgressBarProps {
 value: number;      // 0-100
 max?: number;       // default 100
 color?: string;
 animated?: boolean;
 label?: string;
}
```

### 6.3 Games Package — `@speechmax/games` (Bruno)

Exported from `packages/games/src/index.ts`:

```typescript
export function FillerNinja(props: GameProps): JSX.Element;
export function EyeLock(props: GameProps): JSX.Element;
export function PaceRacer(props: GameProps): JSX.Element;
export function PitchSurfer(props: GameProps): JSX.Element;
export function StatueMode(props: GameProps): JSX.Element;

export interface GameProps {
 difficulty: 'easy' | 'medium' | 'hard';
 prompt: string;
 promptCategory: 'casual' | 'professional' | 'interview';
 onComplete: (result: GameResult) => void;
 onExit: () => void;
}

export interface GameResult {
 gameType: 'filler-ninja' | 'eye-lock' | 'pace-racer' | 'pitch-surfer' | 'statue-mode';
 score: number;           // 0-100
 duration: number;        // seconds
 difficulty: 'easy' | 'medium' | 'hard';
 metrics: Record<string, number>;  // game-specific metrics
}
```

---

## 7. Mock Strategy (Working Before Dependencies Are Ready)

The whole point of contracts is that you can code against them before the real implementation exists.

### 7.1 Bruno's Mocks (Until Anam's Analysis and Meng's UI Are in Dev)

Bruno creates `packages/games/src/__mocks__/` with mock implementations:

```typescript
// packages/games/src/__mocks__/analysis.ts
import type { FillerEvent, TranscriptEvent } from '@speechmax/analysis';

export function onFillerDetected(callback: (data: FillerEvent) => void) {
 // Simulate random fillers for testing
 const interval = setInterval(() => {
   if (Math.random() > 0.7) {
     callback({ word: 'um', timestamp: Date.now(), index: 0 });
   }
 }, 2000);
 return () => clearInterval(interval);
}

export function onTranscript(callback: (data: TranscriptEvent) => void) {
 const interval = setInterval(() => {
   callback({
     text: 'mock transcript text',
     isFinal: true,
     wordCount: 3,
     timestamp: Date.now(),
   });
 }, 1000);
 return () => clearInterval(interval);
}
```

Bruno uses conditional imports or a `USE_MOCKS` flag during development:

```typescript
const analysis = process.env.VITE_USE_MOCKS
 ? await import('./__mocks__/analysis')
 : await import('@speechmax/analysis');
```

**Before PR**: Bruno removes all mocks and switches to real imports. If the real package isn't in `dev` yet, he notes it in the PR and keeps the mock with a `// TODO: replace with real import` comment.

### 7.2 Anam's Mocks (Until Meng's UI Is in Dev)

Anam uses simple placeholder components in `apps/web/` until Meng's real components are available:

```typescript
// apps/web/src/placeholders/RadarChart.tsx
export function RadarChart({ scores }: { scores: Record<string, number> }) {
 return <pre>{JSON.stringify(scores, null, 2)}</pre>;
}
```

Once Meng merges to `dev`, Anam rebases and swaps placeholders for real imports.

---

## 8. Build Order & Phases

```
PHASE 1 — Scaffolding (Day 1, all parallel, zero dependencies)
┌─────────────────────────────────────────────────────────────┐
│ Anam                                                         │
│ • Monorepo setup (pnpm workspace, tsconfig, tailwind)       │
│ • packages/analysis scaffold (empty exports matching contract)│
│ • apps/web scaffold (Vite, router, Zustand stores, layouts) │
│ • Landing page + onboarding page (no camera yet)            │
├─────────────────────────────────────────────────────────────┤
│ Meng                                                         │
│ • packages/ui scaffold (empty exports matching contract)     │
│ • Common components (Button, Card, Badge, Timer, ProgressBar)│
│ • CameraFeed component + useCamera hook                     │
├─────────────────────────────────────────────────────────────┤
│ Bruno                                                        │
│ • packages/games scaffold (empty exports matching contract)  │
│ • GameShell wrapper (timer, prompt display, score card)      │
│ • ScoreCard component                                        │
│ • PromptPicker component                                     │
└─────────────────────────────────────────────────────────────┘
    ↓ PRs to dev, Anam reviews + merges

PHASE 2 — Core (all parallel, Bruno uses mocks if needed)
┌─────────────────────────────────────────────────────────────┐
│ Anam                                                         │
│ • Web Speech API transcriber + filler detector               │
│ • Web Audio API pitch + volume analysis                      │
│ • MediaPipe face mesh (eye contact, facial tension)          │
│ • Scan page (camera + recording + real-time analysis)        │
├─────────────────────────────────────────────────────────────┤
│ Meng                                                         │
│ • RadarChart component (D3 + Framer Motion)                 │
│ • RadarOverlay (before/after comparison)                    │
│ • Mascot component (state machine, Lottie/placeholder)      │
├─────────────────────────────────────────────────────────────┤
│ Bruno                                                        │
│ • Filler Ninja (highest priority game)                       │
│ • Eye Lock                                                   │
└─────────────────────────────────────────────────────────────┘
    ↓ PRs to dev, Anam reviews + merges

PHASE 3 — Remaining features (all parallel)
┌─────────────────────────────────────────────────────────────┐
│ Anam                                                         │
│ • MediaPipe pose + hands (posture, movement, fidgeting)     │
│ • Scoring engine (radar + game scores)                       │
│ • Results page (radar chart + mascot commentary)            │
│ • Game queue page                                            │
├─────────────────────────────────────────────────────────────┤
│ Meng                                                         │
│ • Animation polish on all existing components                │
│ • Mascot asset integration (when Hugo delivers)             │
│ • Any UI revisions based on Figma updates                   │
├─────────────────────────────────────────────────────────────┤
│ Bruno                                                        │
│ • Pace Racer                                                 │
│ • Pitch Surfer                                               │
│ • Statue Mode                                                │
└─────────────────────────────────────────────────────────────┘
    ↓ PRs to dev, Anam reviews + merges

PHASE 4 — Integration + Polish
┌─────────────────────────────────────────────────────────────┐
│ Anam                                                         │
│ • Wire all games into game page (dynamic routing)           │
│ • Progress page                                              │
│ • Rescan flow with overlay animation                        │
│ • End-to-end testing                                         │
│ • Sound FX integration (when Hugo delivers)                 │
│ • Scoring formula tuning                                     │
├─────────────────────────────────────────────────────────────┤
│ Meng                                                         │
│ • Final animation pass                                       │
│ • Responsive cleanup                                         │
│ • Visual QA against Figma                                   │
├─────────────────────────────────────────────────────────────┤
│ Bruno                                                        │
│ • Game polish, edge case handling                            │
│ • Difficulty scaling tuning                                  │
│ • Game sound FX hook-up                                     │
└─────────────────────────────────────────────────────────────┘
    ↓ PRs to dev, Anam reviews + merges

PHASE 5 — Deploy + Demo
┌─────────────────────────────────────────────────────────────┐
│ Anam: Vercel deploy, final QA, dev → main                   │
│ All: Bug fixes, final polish                                 │
│ Hugo: Promo video delivery, mobile wireframes               │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Asset Handoff (Hugo → Dev Team)

### 9.1 Mascot Assets
| Detail | Spec |
| --- | --- |
| Format | Lottie JSON files (preferred) or PNG sprite sheets with frame data |
| Files needed | One per state: `mascot-idle.json`, `mascot-talking.json`, `mascot-listening.json`, `mascot-celebrating.json`, `mascot-encouraging.json`, `mascot-reacting-positive.json`, `mascot-reacting-negative.json` |
| Delivery | Shared Google Drive folder or Discord channel |
| Receiver | Meng (integrates into `packages/ui/src/mascot/`) |
| Blocking? | No — Meng uses a colored placeholder div until assets arrive |

### 9.2 Sound Effects
| Detail | Spec |
| --- | --- |
| Format | MP3, <100KB each |
| Files needed | `game-start.mp3`, `filler-detected.mp3`, `streak-milestone.mp3`, `game-complete.mp3`, `score-reveal.mp3`, `badge-unlock.mp3`, `scan-start.mp3`, `scan-complete.mp3` |
| Delivery | Same shared folder |
| Receiver | Anam (places in `apps/web/public/assets/sounds/`) |
| Blocking? | No — sounds are added late, placeholder silence is fine |

### 9.3 Figma Designs
| Detail | Spec |
| --- | --- |
| Owned by | Meng (primary), Hugo (supports) |
| Used by | All devs as visual reference |
| Truth | Committed code is source of truth. Figma is reference, not spec. |
| MCP | Meng + Bruno use Claude Code Figma MCP to translate designs into components |

---

## 10. Conflict Prevention Matrix

| Scenario | Who's at risk | Prevention | If it happens |
| --- | --- | --- | --- |
| Two people edit same file | Anyone | **Directory ownership**. Each person owns entire directories. PR review catches violations. | Anam resolves. Adjust ownership. |
| Bruno imports from analysis but interface changed | Bruno + Anam | **Contract types defined upfront**. Anam does NOT change the exported interface without messaging the team. If a type must change, Anam messages Bruno + Meng first. | Anam updates the contract, messages team, all rebase. |
| Meng's component API doesn't match what Bruno expected | Meng + Bruno | **Contract types defined upfront** (Section 6). Both code against the interface. | They align on the type, Meng updates the component, Bruno updates usage. |
| Root config conflict (tsconfig, tailwind, package.json) | Anyone | **Only Anam edits root configs.** If Meng or Bruno need a Tailwind plugin or TS setting, they message Anam. | Anam makes the change in their own branch. |
| Zustand store shape mismatch | Anyone | **Only Anam edits stores** in `apps/web/src/store/`. Games and UI don't manage global state — they receive data via props and emit results via callbacks. | Anam adjusts the store. |
| pnpm-workspace.yaml conflict | Anyone | **Only Anam edits**. Set up once in Phase 1, rarely changes. | Anam resolves. |
| Same Tailwind class names behaving differently | Meng + Bruno | **Single tailwind.config.ts at root**, shared by all packages. Only Anam modifies. | Anam resolves the config. |
| Hugo delivers assets in wrong format | Hugo + Meng/Anam | **Format spec defined above** (Lottie JSON, MP3). Hugo checks with Meng before delivering. | Meng/Anam converts or asks Hugo to re-export. |

---

## 11. PR Review Checklist (For Anam)

When reviewing a PR, Anam checks:

```
□ All files are within the author's owned directory
□ No edits to root config files
□ No edits to Zustand stores
□ No direct imports from internal file paths of other packages
 (e.g., import from '@speechmax/ui' is OK,
  import from '../../packages/ui/src/internal/thing' is NOT OK)
□ Exported interfaces match the contract (Section 6)
□ No hardcoded values that should come from props
□ Components accept the exact props defined in the contract
□ Game components call onComplete with a valid GameResult
□ No console.log or debugger statements left in
□ TypeScript compiles with no errors
□ Commit messages reference the Linear ticket ID
□ Branch was rebased on dev before PR
```

---

## 12. Communication Rules

| Rule | Why |
| --- | --- |
| Message before changing any exported type/interface | Changing a type breaks everyone who imports it |
| Message before adding a new dependency to package.json | Could affect bundle size or conflict with other packages |
| Message when you finish a feature and PR | Others might be waiting to rebase and use your exports |
| Message immediately when blocked | Don't waste time sitting on a blocker |
| Don't start work in another person's package | If you finish early, ask Anam for the next ticket in YOUR package, or help with testing/QA |

---

## 13. Quick Reference Card

```
OWNERSHIP
 Anam  → packages/analysis/ + apps/web/ + root configs + stores
 Meng  → packages/ui/
 Bruno → packages/games/
 Hugo  → assets (no code)

BRANCHES
 Naming:    {person}/{package}-{feature}
 Target:    always → dev
 Reviewer:  always Anam
 main push: only Anam
 Rebase:    always before PR

IMPORTS
 ✅ import from '@speechmax/{package}'
 ❌ import from '../../packages/{package}/src/internal'
 ❌ import from another person's package's internal files

MOCKS
 Can't use a dependency yet? Mock it locally.
 Remove all mocks before PR.

CONFIGS
 Need a new Tailwind color? → message Anam
 Need a new npm dependency? → message Anam
 Need a new tsconfig path?  → message Anam
```





