# Contributing to SpeechMAX

## Quick Start

```bash
git clone https://github.com/MatthewAxton/HackathonTest.git
cd HackathonTest
npm install
```

Create a `.env` file:

```
VITE_SUPABASE_URL=https://mqidbueexomhpeejvnry.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xaWRidWVleG9taHBlZWp2bnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDQwNDgsImV4cCI6MjA4OTEyMDA0OH0.dYObvhC-MKAxCiLZ2c_WkpXgQp8USlWi6X2w3aVSFiU
```

> **No Gemini API key needed.** The key is stored as a Supabase Edge Function secret. Mike's AI chat routes through `gemini-proxy` server-side.

Then start the dev server:

```bash
npm run dev
```

Open **http://localhost:5173** in Chrome (camera/mic features require Chrome).

## Project Structure

```
src/
  App.tsx                          # Routing + homepage + auth flow
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
      Mike.tsx                     # Mascot component + TalkingBubble
      MikeChat.tsx                 # AI chat widget (Gemini via Supabase Edge Function)
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
      StagePresence.tsx            # Composure game (fullscreen camera)
      ScoreCard.tsx                # Post-game results + coaching tips
      Onboarding.tsx               # First-time user flow (skips if returning user)
      Progress.tsx                 # Stats, badges, personal bests
      History.tsx                  # Scan + game timeline
      Practice.tsx                 # Free practice mode
      Library.tsx                  # Prompt library with favorites
      Insights.tsx                 # Weekly insights + trend analysis
      Settings.tsx                 # Account, devices, sound, difficulty, reset
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
  store/                           # Zustand state (persisted to localStorage + synced to Supabase)
    scanStore.ts                   # Scan history & radar scores (syncs scan_results)
    gameStore.ts                   # Game results & difficulty scaling (syncs game_results)
    sessionStore.ts                # Badges, streaks, personal bests (syncs profiles)
  lib/
    supabase.ts                    # Supabase client singleton
    auth.tsx                       # AuthProvider + useAuth hook (anonymous + Google OAuth)
    supabaseSync.ts                # DB sync helpers + localStorage migration
    geminiClient.ts                # Gemini API client (calls Edge Function, not direct)
    buildMikeSystemPrompt.ts       # Mike's system prompt with user data
    badges.ts                      # 11 badge definitions
    prompts.ts                     # Speaking prompts by category
    sounds.ts                      # Oscillator-based sound FX
    goalPromptMap.ts               # Maps UserGoal -> PromptCategory
    goalConfig.ts                  # Goal-specific tips + focus axes
    dateUtils.ts                   # Relative time formatting
    insightGenerator.ts            # Weekly insight generation
    renderShareCard.ts             # Canvas share card renderer
supabase/
  functions/
    gemini-proxy/index.ts          # Edge Function: JWT-authed Gemini API proxy
```

## User Flow

```
/ (Homepage)
  -> Continue with Google -> /onboarding (or /queue if returning)
  -> Continue as Guest -> /onboarding
    -> /scan (30s speech scan, fullscreen camera)
      -> /results (Radar chart + axis breakdown)
        -> /queue (Game dashboard)
          -> /filler-ninja (intro -> 3-2-1 -> game -> /score/filler)
          -> /eye-lock (intro -> 3-2-1 -> game -> /score/eyelock)
          -> /pace-racer (intro -> 3-2-1 -> game -> /score/pace)
          -> /pitch-surfer (intro -> 3-2-1 -> game -> /score/pitch)
          -> /statue-mode (intro -> 3-2-1 -> game -> /score/statue)
        -> /progress (Stats, badges, personal bests)
        -> /history (Scan + game timeline)
        -> /library (Prompt browser + favorites)
        -> /insights (Weekly trends)
        -> /settings (Account, devices, reset)
        -> /practice (Free practice mode)
```

## Routes

| Route | Screen | Notes |
|-------|--------|-------|
| `/` | Homepage | Auth buttons (Google / Guest) |
| `/onboarding` | First-time setup | Skips if returning user with goal set |
| `/scan` | Radar Scan | Fullscreen camera |
| `/results` | Radar Results | Axis breakdown |
| `/queue` | Game Dashboard | Radar + game list |
| `/filler-ninja` | Filler Ninja | Built-in intro screen |
| `/eye-lock` | Eye Lock | Fullscreen camera + glass HUD |
| `/pace-racer` | Pace Racer | Built-in intro screen |
| `/pitch-surfer` | Pitch Surfer | Built-in intro screen |
| `/statue-mode` | Stage Presence | Fullscreen camera + glass HUD |
| `/score/:game` | Score Card | Coaching tips |
| `/progress` | Progress | Stats + badges |
| `/history` | History | Scan + game timeline |
| `/library` | Library | Prompt browser |
| `/insights` | Insights | Weekly trends |
| `/settings` | Settings | Account + devices |
| `/practice` | Practice | Free practice mode |

## Backend (Supabase)

### Database Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User preferences, streaks, badges, personal bests | Users can read/insert/update own row |
| `scan_results` | Speech scan scores + raw data | Users can read/insert own rows |
| `game_results` | Game scores + metrics | Users can read/insert own rows |

### Auth

- **Anonymous auth** — automatic on first visit (zero friction for hackathon judges)
- **Google OAuth** — sign in to sync across devices
- Profile auto-created via database trigger on signup

### Edge Functions

- `gemini-proxy` — validates JWT, reads `GEMINI_API_KEY` from Supabase secrets, forwards to Gemini 2.5 Flash

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

### Vercel Deployment

1. Push to GitHub
2. Import into Vercel
3. Add env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy — no other config needed
