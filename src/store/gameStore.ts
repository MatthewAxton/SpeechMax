import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameType, GameResult, Difficulty } from '../analysis/types'
import { useScanStore } from './scanStore'

const GAME_AXIS_MAP: Record<GameType, 'clarity' | 'confidence' | 'pacing' | 'expression' | 'composure'> = {
  'filler-ninja': 'clarity',
  'eye-lock': 'confidence',
  'pace-racer': 'pacing',
  'pitch-surfer': 'expression',
  'statue-mode': 'composure',
}

interface GameState {
  gameHistory: GameResult[]
  currentGameType: GameType | null

  setCurrentGame: (game: GameType) => void
  addGameResult: (result: GameResult) => void
  getLastResult: (game: GameType) => GameResult | undefined
  getBestResult: (game: GameType) => GameResult | undefined
  getDifficultyFor: (game: GameType) => Difficulty
  getRecommendedGameOrder: () => GameType[]
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
  gameHistory: [],
  currentGameType: null,

  setCurrentGame: (game) => set({ currentGameType: game }),

  addGameResult: (result) => {
    set((s) => ({
      gameHistory: [...s.gameHistory, result],
    }))
  },

  getLastResult: (game) => {
    const { gameHistory } = get()
    return [...gameHistory].reverse().find((r) => r.gameType === game)
  },

  getBestResult: (game) => {
    const { gameHistory } = get()
    const results = gameHistory.filter((r) => r.gameType === game)
    if (results.length === 0) return undefined
    return results.reduce((best, r) => (r.score > best.score ? r : best))
  },

  getDifficultyFor: (game) => {
    const latestScores = useScanStore.getState().getLatestScores()
    if (!latestScores) return 'easy'
    const axis = GAME_AXIS_MAP[game]
    const score = latestScores[axis]
    if (score <= 40) return 'easy'
    if (score <= 70) return 'medium'
    return 'hard'
  },

  getRecommendedGameOrder: () => {
    const latestScores = useScanStore.getState().getLatestScores()
    const allGames: GameType[] = ['filler-ninja', 'eye-lock', 'pace-racer', 'pitch-surfer', 'statue-mode']
    if (!latestScores) return allGames

    return [...allGames].sort((a, b) => {
      const scoreA = latestScores[GAME_AXIS_MAP[a]]
      const scoreB = latestScores[GAME_AXIS_MAP[b]]
      return scoreA - scoreB // lowest score first = highest priority
    })
  },
}),
    { name: 'speechmax-game' }
  )
)
