import type { BadgeDef } from '../analysis/types'

const BADGES: BadgeDef[] = [
  {
    id: 'first-scan',
    name: 'First Scan',
    description: 'Complete your first 30-second scan.',
    icon: '🎯',
    check: (ctx) => ctx.totalScans >= 1,
  },
  {
    id: 'first-game',
    name: 'First Game',
    description: 'Play your first mini-game.',
    icon: '🎮',
    check: (ctx) => ctx.totalGames >= 1,
  },
  {
    id: '7-day-streak',
    name: '7-Day Streak',
    description: 'Practice 7 days in a row.',
    icon: '🔥',
    check: (ctx) => ctx.streakDays >= 7,
  },
  {
    id: '100-club',
    name: '100 Score Club',
    description: 'Score 100 on any axis.',
    icon: '💯',
    check: (ctx) => ctx.bestOverall >= 100 || ctx.bestClarity >= 100,
  },
  {
    id: 'filler-free-minute',
    name: 'Filler-Free Minute',
    description: 'Go 60 seconds without a filler word.',
    icon: '🥷',
    check: (ctx) => ctx.longestFillerFreeStreak >= 60,
  },
  {
    id: 'ninja-master',
    name: 'Ninja Master',
    description: 'Score 90+ on Filler Ninja.',
    icon: '⚔️',
    check: (ctx) => ctx.highestGameScore >= 90,
  },
  {
    id: 'all-games',
    name: 'Full Circuit',
    description: 'Play all 5 games at least once.',
    icon: '🏆',
    check: (ctx) => {
      const games = ['filler-ninja', 'eye-lock', 'pace-racer', 'pitch-surfer', 'statue-mode'] as const
      return games.every((g) => (ctx.gamesPlayed[g] || 0) >= 1)
    },
  },
  {
    id: '5-scans',
    name: 'Scanner Pro',
    description: 'Complete 5 speech scans.',
    icon: '📡',
    check: (ctx) => ctx.totalScans >= 5,
  },
  {
    id: '10-games',
    name: 'Game Grinder',
    description: 'Play 10 games total.',
    icon: '💪',
    check: (ctx) => ctx.totalGames >= 10,
  },
  {
    id: 'score-80',
    name: 'Rising Star',
    description: 'Reach an overall score of 80+.',
    icon: '⭐',
    check: (ctx) => ctx.bestOverall >= 80,
  },
  {
    id: '3-day-streak',
    name: 'Getting Started',
    description: 'Practice 3 days in a row.',
    icon: '📅',
    check: (ctx) => ctx.streakDays >= 3,
  },
]

export default BADGES
