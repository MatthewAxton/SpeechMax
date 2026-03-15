# CLAUDE.md — SpeechMAX Project Instructions

## Git Rules

- **Working branch:** `main`
- Commit after each completed sprint task with a descriptive message.

## Sprint Workflow (NON-NEGOTIABLE)

1. **Before starting a sprint:** Enter plan mode. Plan the entire sprint — read every file that will be touched, understand current state, map out exact changes.
2. **Execute tasks** in order within the sprint.
3. **After completing each task:** Commit with a descriptive message.
4. **After completing the full sprint:** Update `masterplan.md` — mark the sprint as `[COMPLETE]` and each task within it as `[DONE]`.
5. **Before building:** Always run `npx tsc --noEmit` first, then `npm run build`.
6. **After build passes:** Move to the next sprint.

## Project Overview

SpeechMAX is a browser-based AI speech coach (UNIHACK 2026). React + TypeScript + Vite. Uses Web Speech API, Web Audio API, and MediaPipe for real-time speech analysis. Supabase for auth, database, and API key security.

## Master Plan

All implementation work follows `masterplan.md` in the project root. Reference it before starting any sprint task.

## Tech Stack

- React 18 + TypeScript + Vite
- Zustand 5.x for state management (with `zustand/middleware` persist + Supabase sync)
- Supabase (Auth, PostgreSQL, Edge Functions)
- MediaPipe (FaceLandmarker, PoseLandmarker) for gaze + pose tracking
- Web Speech API for transcription
- Web Audio API for pitch analysis
- Framer Motion for animations
- React Router v6

## Supabase (NON-NEGOTIABLE)

- **Project ID:** `mqidbueexomhpeejvnry` (speechMAX). NEVER touch any other Supabase project.
- **Auth:** Anonymous sign-in (automatic) + Google OAuth
- **Tables:** `profiles`, `scan_results`, `game_results` — all with RLS
- **Edge Functions:** `gemini-proxy` — JWT-authed proxy for Gemini API
- **Secrets:** `GEMINI_API_KEY` stored as Supabase secret (never in client `.env`)
- **Frontend env:** Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`

## Design Rules (NON-NEGOTIABLE)

- Background: `#050508`
- Glass cards: `rgba(255,255,255,0.06)` + `backdrop-filter: blur(20px)`
- Purple accent: `#c28fe7`
- Text hierarchy: `rgba(255,255,255,0.9)` primary, `rgba(255,255,255,0.4)` muted
- NO white backgrounds anywhere. The homepage is the visual reference.

## Key Architecture

- **Auth:** `src/lib/auth.tsx` (AuthProvider + useAuth hook)
- **Supabase Client:** `src/lib/supabase.ts` (singleton)
- **Data Sync:** `src/lib/supabaseSync.ts` (fire-and-forget sync + localStorage migration)
- **Gemini:** `src/lib/geminiClient.ts` (calls edge function, NOT direct Gemini API)
- **Stores:** `src/store/{scanStore,gameStore,sessionStore}.ts` (all sync to Supabase)
- **Screens:** `src/gamification/screens/*.tsx`
- **Game Intros:** Each game has built-in `GameIntro` phase (no shared Countdown)
- **Shared Components:** `src/gamification/components/{GameIntro,Banner,CameraFeed,AudioWave,RadarChart,MikeChat}*.tsx`
- **Analysis:** `src/analysis/{speech,audio,mediapipe}/*.ts`
- **Scoring:** `src/analysis/scoring/{radarScorer,gameScorer}.ts`
- **Sounds:** `src/lib/sounds.ts` (oscillator-based, no .mp3 files)
- **Layout:** `src/gamification/GamificationLayout.tsx` wraps all gamification routes
- **Homepage:** Defined inline in `src/App.tsx` (dark theme, auth flow)
- **Edge Function:** `supabase/functions/gemini-proxy/index.ts`

## Audio Pipeline

- Mic requests use `echoCancellation`, `noiseSuppression`, `autoGainControl`
- Pitch analyzer chain: source → DynamicsCompressorNode → AnalyserNode
- Transcriber uses `maxAlternatives: 3` with confidence-based filtering (rejects < 0.3)
- Filler detector uses count-based tracking on interim results for fast detection
- Camera games (EyeLock, StagePresence, RadarScan) use fullscreen camera with floating glass HUD
- MediaPipe models use singleton pattern (cached after first download)
- CameraFeed waits for video `loadeddata` before notifying consumers
- gazeEngine emits biometric signals (blink, jaw tension, lip compression) alongside gaze
- Composure scoring enriched with 6 biometric signals when available
- Mascot speech bubbles use `TalkingBubble` component with per-character `playTalkBlip()` sound

## Build & Verify

```bash
npx tsc --noEmit    # Type check
npm run build       # Production build
npm run dev         # Dev server
```
