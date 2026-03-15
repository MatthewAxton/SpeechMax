# SpeechMAX

**AI-powered speech coach that runs entirely in your browser.** Built for UNIHACK 2026.

SpeechMAX uses your webcam, microphone, and cutting-edge browser APIs to analyze your public speaking in real-time across five dimensions — then trains you through gamified mini-games.

<p align="center">
  <img src="public/IDLE.gif" alt="Mike — SpeechMAX Mascot" width="200" />
</p>

---

## What Makes This Different

| Feature | SpeechMAX | Yoodli | Orai | Poised |
|---------|-----------|--------|------|--------|
| Real-time multi-modal analysis | Camera + Mic + Body | Audio only | Audio only | Audio only |
| Eye contact tracking | MediaPipe FaceLandmarker | No | No | No |
| Posture & fidget detection | MediaPipe PoseLandmarker | No | No | No |
| Pitch variation analysis | Web Audio API | Post-hoc | Post-hoc | Real-time |
| Gamified training | 5 mini-games | No | No | No |
| Runs in browser (no install) | Yes | Yes | Mobile app | Desktop app |
| AI speech coach chat | Gemini 2.5 Flash | GPT-4 | No | No |
| Cross-device sync | Supabase (auth + DB) | Cloud | Cloud | Cloud |
| Google sign-in | Yes (+ anonymous guest mode) | Yes | Yes | Yes |

---

## Quick Start

```bash
npm install
```

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=https://mqidbueexomhpeejvnry.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xaWRidWVleG9taHBlZWp2bnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDQwNDgsImV4cCI6MjA4OTEyMDA0OH0.dYObvhC-MKAxCiLZ2c_WkpXgQp8USlWi6X2w3aVSFiU
```

Then start the dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in Chrome (recommended for Web Speech API support).

```bash
npx tsc --noEmit    # Type check
npm run build       # Production build
```

> **Note:** The Gemini API key is stored as a Supabase Edge Function secret (server-side). It is NOT needed in `.env`. Mike's AI chat routes through a `gemini-proxy` edge function so the key is never exposed to the client.

---

## Architecture

### Backend (Supabase)

SpeechMAX uses Supabase for authentication, data persistence, and API key security:

| Service | Purpose |
|---------|---------|
| **Auth** | Anonymous sign-in (zero friction) + Google OAuth |
| **Database** | `profiles`, `scan_results`, `game_results` tables with RLS |
| **Edge Functions** | `gemini-proxy` — proxies Gemini API calls with JWT auth |
| **Secrets** | `GEMINI_API_KEY` stored server-side, never in client bundle |

**Auth flow:**
1. First visit → anonymous sign-in (automatic, invisible)
2. Homepage shows "Continue with Google" or "Continue as Guest"
3. Guest users get full functionality, data saved to Supabase
4. Google sign-in syncs data across devices
5. Returning users skip onboarding automatically

**Data sync:** All scan results, game results, and profile data sync to Supabase in real-time (fire-and-forget, never blocks UI). Existing localStorage data is migrated automatically on first auth.

### Frontend

All speech/video analysis runs 100% client-side using Web APIs and MediaPipe WASM. The only network calls are Supabase auth/DB and the Gemini proxy.

---

## How It Works

### 1. Goal-Based Onboarding

Choose what you're practicing for — Job Interview, Presentation, Casual Conversation, or Reading Aloud. Your goal customizes the speaking prompts throughout the app.

### 2. 30-Second Radar Scan

Speak about a goal-appropriate topic for 30 seconds while the app captures:
- **Voice** — transcription, filler words, WPM, pitch variation
- **Face** — eye contact quality via 468 facial landmarks + iris tracking
- **Body** — posture alignment, fidget detection via 33 body keypoints

Results are scored across 5 radar axes and displayed as an interactive radar chart.

### 3. Targeted Mini-Games

Based on your scan results, SpeechMAX recommends games to train your weakest areas:

| Game | Trains | How |
|------|--------|-----|
| **Filler Ninja** | Clarity | Speak for 90s without filler words. Timer pauses when you stop talking. |
| **Eye Lock** | Confidence | Maintain eye contact with the camera. Fullscreen camera with glass HUD. |
| **Pace Racer** | Pacing | Keep your WPM in the target zone. Gear system rewards sustained pace. |
| **Pitch Surfer** | Expression | Vary your pitch to ride the wave. Monotone = wipeout. |
| **Stage Presence** | Composure | Master body language — open stance, power zone gestures. |

Each game has a unique intro screen with game-specific visuals and a 3-2-1 countdown.

### 4. Mike — AI Speech Coach

Chat with Mike, your AI speech coach powered by Gemini 2.5 Flash. Mike sees your scan scores, game history, badges, and streaks — and gives short, actionable advice. His animated avatar talks while responding. API calls are routed securely through a Supabase Edge Function.

### 5. Track Progress

Badges, streaks, personal bests, coaching tips, and session history — all synced to Supabase with cross-device persistence.

---

## Deploy to Vercel

1. Push to GitHub
2. Import into Vercel
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL` = `https://mqidbueexomhpeejvnry.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (the anon key from `.env`)
4. Add your Vercel domain to Google OAuth redirect URIs:
   - Go to Google Cloud Console → Credentials → your OAuth client
   - Add: `https://mqidbueexomhpeejvnry.supabase.co/auth/v1/callback` (already there)
   - The redirect URL is on Supabase's domain, not Vercel's — so no extra config needed
5. Deploy

> The Gemini API key is already configured as a Supabase Edge Function secret. No Gemini key needed on Vercel.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Project Brief](projectbrief.md) | Full UNIHACK 2026 project document — problem, users, tech stack, game design |
| [Master Plan](masterplan.md) | Sprint-by-sprint implementation plan with all sprints documented |
| [Contributing](CONTRIBUTING.md) | Project structure, routes, user flow, design system |
| [Claude Instructions](CLAUDE.md) | AI assistant configuration — architecture, git rules, build commands |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript (strict) |
| Bundler | Vite |
| Styling | Tailwind CSS 4 + inline styles |
| State | Zustand 5 with localStorage + Supabase sync |
| Auth | Supabase Auth (anonymous + Google OAuth) |
| Database | Supabase PostgreSQL with RLS |
| API Proxy | Supabase Edge Functions (Deno) |
| Animations | Framer Motion |
| Face Tracking | MediaPipe FaceLandmarker (WASM, GPU) |
| Body Tracking | MediaPipe PoseLandmarker (WASM, GPU) |
| Speech | Web Speech API (SpeechRecognition) with noise suppression |
| Audio | Web Audio API (autocorrelation pitch + DynamicsCompressor) |
| AI Coach | Google Gemini 2.5 Flash (via Supabase Edge Function proxy) |
| Icons | Lucide React |
| Sound FX | Web Audio API oscillators (no audio files) |

---

## Audio Pipeline

All audio processing happens client-side with zero network latency:

```
Microphone (with echoCancellation + noiseSuppression + autoGainControl)
  -> Web Speech API (maxAlternatives: 3, confidence filtering > 0.3)
  -> DynamicsCompressorNode (threshold -40dB, 4:1 ratio)
  -> AnalyserNode (FFT pitch detection via autocorrelation)
```

---

## Project Structure

```
src/
  analysis/              # Real-time analysis pipeline
    audio/               #   Pitch detection + dynamics compressor
    speech/              #   Transcription, filler detection (count-based), WPM
    mediapipe/           #   Gaze engine (3-signal fusion), pose tracker
    scoring/             #   Radar scorer + per-game scoring formulas
    hooks/               #   useMicrophone, useEyeContact
  gamification/          # Game UI layer
    screens/             #   All game screens (each with built-in intro phase)
    components/          #   GameIntro, CameraFeed, RadarChart, Banner, MikeChat
    hooks/               #   useRequireScan route guard
  store/                 # Zustand state management (persisted + synced to Supabase)
  lib/                   # Badges, prompts, sounds, auth, Supabase client, sync
  components/            # Homepage components
  App.tsx                # Routing, homepage, auth flow
supabase/
  functions/
    gemini-proxy/        # Edge function: proxies Gemini API with JWT auth
```

---

## Browser Requirements

| Feature | Required | Fallback |
|---------|----------|----------|
| Web Speech API | Chrome/Edge | Simulated transcription after 5s |
| MediaPipe WASM | WebGL-capable browser | Graceful degradation (default scores) |
| getUserMedia | HTTPS or localhost | Camera/mic permission prompt |
| Web Audio API | All modern browsers | None needed |

**Best experience:** Chrome 90+ on desktop with webcam and microphone.

---

## Design System

| Token | Value |
|-------|-------|
| Background | `#050508` |
| Glass card | `rgba(255,255,255,0.06)` + `backdrop-filter: blur(20px)` |
| Camera HUD glass | `rgba(0,0,0,0.5)` + `backdrop-filter: blur(16px)` |
| Purple accent | `#c28fe7` |
| Text primary | `rgba(255,255,255,0.9)` |
| Text muted | `rgba(255,255,255,0.4)` |
| Success green | `#58CC02` |
| Warning yellow | `#FCD34D` |
| Danger red | `#FF4B4B` |

---

## License

Built for UNIHACK 2026. All rights reserved.
