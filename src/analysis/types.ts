/** Shared types for the analysis pipeline */

export interface TranscriptEvent {
  text: string
  isFinal: boolean
  wordCount: number
  timestamp: number
}

export interface FillerEvent {
  word: string
  timestamp: number
  index: number
}

export interface AudioFrame {
  pitch: number   // Hz (0 = silence)
  volume: number  // 0–1
  timestamp: number
}

export interface RadarScores {
  clarity: number
  confidence: number
  pacing: number
  expression: number
  composure: number
  overall: number
}

export interface ScanRawData {
  durationSeconds: number
  fillerCount: number
  wordCount: number
  eyeContactPercent: number
  postureScore: number
  avgWpm: number
  wpmStdDev: number
  pitchStdDev: number
  stillnessPercent: number
  fidgetCount: number
}

export type GameType = 'filler-ninja' | 'eye-lock' | 'pace-racer' | 'pitch-surfer' | 'statue-mode'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface GameResult {
  gameType: GameType
  score: number
  timestamp: number
  metrics: Record<string, number>
}

export interface ScanResult {
  id: string
  scores: RadarScores
  rawData: ScanRawData
  timestamp: number
}

export type PromptCategory = 'casual' | 'professional' | 'interview'

export interface BadgeDef {
  id: string
  name: string
  description: string
  icon: string
  check: (ctx: BadgeContext) => boolean
}

export interface BadgeContext {
  totalScans: number
  totalGames: number
  streakDays: number
  bestOverall: number
  bestClarity: number
  longestFillerFreeStreak: number
  highestGameScore: number
  gamesPlayed: Record<GameType, number>
}
