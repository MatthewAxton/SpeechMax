// Types
export type {
  TranscriptEvent, FillerEvent, AudioFrame,
  RadarScores, ScanRawData, GameType, Difficulty,
  GameResult, ScanResult, PromptCategory,
  BadgeDef, BadgeContext,
} from './types'

// Speech
export { startTranscription, stopTranscription, onTranscript, isTranscribing } from './speech/transcriber'
export { startFillerDetection, stopFillerDetection, onFillerDetected, getFillerCount } from './speech/fillerDetector'
export { startWpmTracking, stopWpmTracking, onWpmReading, getSessionWpm, getRollingWpm } from './speech/wpmTracker'

// Audio
export { startAudioAnalysis, stopAudioAnalysis, onAudioFrame } from './audio/pitchAnalyzer'

// Scoring
export { computeRadarScores } from './scoring/radarScorer'
export { computeGameScore, computeSimpleGameScore } from './scoring/gameScorer'
