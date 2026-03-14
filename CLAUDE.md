# CLAUDE.md — SpeechMAX Project Instructions

## Git Rules (NON-NEGOTIABLE)

- **Working branch:** `bruno/master-plan`
- **NEVER push to `main`** — all pushes go to `bruno/master-plan` only
- **Push command:** `git push origin bruno/master-plan`
- **PRs:** When ready, open PR from `bruno/master-plan` → `main`. Do not merge directly.
- Commit after each completed sprint task with a descriptive message.

## Sprint Workflow (NON-NEGOTIABLE)

1. **Before starting a sprint:** Enter plan mode. Plan the entire sprint — read every file that will be touched, understand current state, map out exact changes.
2. **Execute tasks** in order within the sprint.
3. **After completing each task:** Commit with a descriptive message.
4. **After completing the full sprint:** Update `masterplan.md` — mark the sprint as `[COMPLETE]` and each task within it as `[DONE]`.
5. **Before building:** Always run `npx tsc --noEmit` first, then `npm run build`.
6. **After build passes:** Move to the next sprint.

## Project Overview

SpeechMAX is a browser-based AI speech coach (UNIHACK 2026). React + TypeScript + Vite. Uses Web Speech API, Web Audio API, and MediaPipe for real-time speech analysis.

## Master Plan

All implementation work follows `masterplan.md` in the project root. Reference it before starting any sprint task.

## Tech Stack

- React 18 + TypeScript + Vite
- Zustand 5.x for state management (with `zustand/middleware` persist)
- MediaPipe (FaceLandmarker, PoseLandmarker) for gaze + pose tracking
- Web Speech API for transcription
- Web Audio API for pitch analysis
- Framer Motion for animations
- React Router v6

## Design Rules (NON-NEGOTIABLE)

- Background: `#050508`
- Glass cards: `rgba(255,255,255,0.06)` + `backdrop-filter: blur(20px)`
- Purple accent: `#c28fe7`
- Text hierarchy: `rgba(255,255,255,0.9)` primary, `rgba(255,255,255,0.4)` muted
- NO white backgrounds anywhere. The homepage is the visual reference.

## Key Architecture

- **Stores:** `src/store/{scanStore,gameStore,sessionStore}.ts`
- **Screens:** `src/gamification/screens/*.tsx`
- **Game Intros:** Each game has built-in `GameIntro` phase (no shared Countdown)
- **Shared Components:** `src/gamification/components/{GameIntro,Banner,CameraFeed,AudioWave,RadarChart}*.tsx`
- **Analysis:** `src/analysis/{speech,audio,mediapipe}/*.ts`
- **Scoring:** `src/analysis/scoring/{radarScorer,gameScorer}.ts`
- **Sounds:** `src/lib/sounds.ts` (oscillator-based, no .mp3 files)
- **Layout:** `src/gamification/GamificationLayout.tsx` wraps all gamification routes
- **Homepage:** Defined inline in `src/App.tsx` (dark theme, separate from gamification)

## Audio Pipeline

- Mic requests use `echoCancellation`, `noiseSuppression`, `autoGainControl`
- Pitch analyzer chain: source → DynamicsCompressorNode → AnalyserNode
- Transcriber uses `maxAlternatives: 3` with confidence-based filtering (rejects < 0.3)
- Filler detector uses count-based tracking on interim results for fast detection
- Camera games (EyeLock, StatueMode, RadarScan) use fullscreen camera with floating glass HUD

## Build & Verify

```bash
npx tsc --noEmit    # Type check
npm run build       # Production build
npm run dev         # Dev server
```
