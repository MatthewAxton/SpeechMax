# Contributing to SpeechMAX

## Quick Start

```bash
git clone https://github.com/MatthewAxton/HackathonTest.git
cd HackathonTest
npm install
npm run dev
```

Open **http://localhost:5173** in Chrome (camera/mic features require Chrome).

## Project Structure

```
src/
  App.tsx                          # Routing + homepage (dark theme)
  index.css                        # Global styles + Tailwind dark tokens
  components/                      # Homepage components
  gamification/                    # All game features (dark theme)
    GamificationLayout.tsx         # Dark theme wrapper for game routes
    gamification.css               # Scoped dark theme styles
    components/
      GameIntro.tsx                # Split-layout pre-game intro (built into each game)
      CountdownOverlay.tsx         # 3-2-1-GO countdown
      Banner.tsx                   # Top gradient banner
      CameraFeed.tsx               # Live webcam (supports fullscreen mode)
      AudioWave.tsx                # Audio visualizer
      Mike.tsx                     # Mascot component
      DevMenu.tsx                  # Dev navigation (dev only)
      EyeContactIndicator.tsx      # Gaze tracking overlay
      radar-chart/                 # Reusable radar chart
    screens/
      RadarScan.tsx                # 30s speech scan (fullscreen camera)
      RadarResults.tsx             # Radar chart results
      GameQueue.tsx                # Game dashboard
      FillerNinja.tsx              # Clarity game (has built-in intro)
      EyeLock.tsx                  # Confidence game (fullscreen camera)
      PaceRacer.tsx                # Pacing game (has built-in intro)
      PitchSurfer.tsx              # Expression game (has built-in intro)
      StatueMode.tsx               # Composure game (fullscreen camera)
      ScoreCard.tsx                # Post-game results + coaching tips
      Progress.tsx                 # Stats, badges, personal bests
      Onboarding.tsx               # First-time user flow
    hooks/
      useRequireScan.ts            # Route guard — redirects to /scan if no scan
  analysis/                        # Real-time analysis pipeline
    speech/transcriber.ts          # Web Speech API wrapper (auto-restart, confidence filtering)
    speech/fillerDetector.ts       # Filler word detection (count-based, interim results)
    speech/wpmTracker.ts           # Words-per-minute tracking
    audio/pitchAnalyzer.ts         # Pitch detection (autocorrelation + dynamics compressor)
    mediapipe/gazeEngine.ts        # Eye tracking (3-signal fusion + EMA smoothing)
    mediapipe/poseTracker.ts       # Pose tracking (posture, head stability, fidgets)
    scoring/radarScorer.ts         # 5-axis radar scoring from scan data
    scoring/gameScorer.ts          # Per-game scoring formulas
    hooks/useMicrophone.ts         # Mic access with noise suppression
    hooks/useEyeContact.ts         # Eye tracking React hook
  store/                           # Zustand state (all persisted to localStorage)
    scanStore.ts                   # Scan history & radar scores
    gameStore.ts                   # Game results & difficulty scaling
    sessionStore.ts                # Badges, streaks, personal bests
  lib/
    badges.ts                      # 11 badge definitions
    prompts.ts                     # Speaking prompts by category
    sounds.ts                      # Oscillator-based sound FX
```

## User Flow

```
/ (Homepage)
  -> START PRACTICING -> Goal Select -> /onboarding
    -> /scan (30s speech scan, fullscreen camera)
      -> /results (Radar chart + axis breakdown)
        -> /queue (Game dashboard)
          -> /filler-ninja (intro -> 3-2-1 -> game -> /score/filler)
          -> /eye-lock (intro -> 3-2-1 -> game -> /score/eyelock)
          -> /pace-racer (intro -> 3-2-1 -> game -> /score/pace)
          -> /pitch-surfer (intro -> 3-2-1 -> game -> /score/pitch)
          -> /statue-mode (intro -> 3-2-1 -> game -> /score/statue)
        -> /progress (Stats, badges, personal bests)
```

## Routes

| Route | Screen | Notes |
|-------|--------|-------|
| `/` | Homepage + Goal Select | Dark theme |
| `/onboarding` | First-time setup | |
| `/scan` | Radar Scan | Fullscreen camera |
| `/results` | Radar Results | Axis breakdown |
| `/queue` | Game Dashboard | Radar + game list |
| `/filler-ninja` | Filler Ninja | Built-in intro screen |
| `/eye-lock` | Eye Lock | Fullscreen camera + glass HUD |
| `/pace-racer` | Pace Racer | Built-in intro screen |
| `/pitch-surfer` | Pitch Surfer | Built-in intro screen |
| `/statue-mode` | Statue Mode | Fullscreen camera + glass HUD |
| `/score/:game` | Score Card | Coaching tips |
| `/progress` | Progress | Stats + badges |

## Design System

Everything uses dark theme. No white backgrounds anywhere.

| Token | Value |
|-------|-------|
| Background | `#050508` |
| Glass card | `rgba(255,255,255,0.06)` + `backdrop-filter: blur(20px)` |
| Camera HUD | `rgba(0,0,0,0.5)` + `backdrop-filter: blur(16px)` |
| Purple accent | `#c28fe7` |
| Text primary | `rgba(255,255,255,0.9)` |
| Text muted | `rgba(255,255,255,0.4)` |

## Build & Deploy

```bash
npx tsc --noEmit    # Type check
npm run build       # Production build
npm run preview     # Preview production build
```

Deployment: **Vercel** (auto-deploys on push to `main`).
