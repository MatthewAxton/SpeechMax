import { supabase } from './supabase'
import { useScanStore } from '../store/scanStore'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import type { ScanResult, GameResult } from '../analysis/types'

// ─── Sync helpers (fire-and-forget, never block UI) ───

export async function syncScanResult(scan: ScanResult) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase.from('scan_results').upsert({
    id: scan.id,
    user_id: user.id,
    scores: scan.scores,
    raw_data: scan.rawData,
    timestamp: scan.timestamp,
  })

  if (error) console.error('syncScanResult error:', error)
}

export async function syncGameResult(result: GameResult) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase.from('game_results').insert({
    user_id: user.id,
    game_type: result.gameType,
    score: result.score,
    metrics: result.metrics,
    timestamp: result.timestamp,
  })

  if (error) console.error('syncGameResult error:', error)
}

export async function syncProfile(partial: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    ...partial,
  })

  if (error) console.error('syncProfile error:', error)
}

// ─── Load from Supabase into stores ───

export async function loadUserData() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Fetch all 3 tables in parallel
  const [profileRes, scansRes, gamesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('scan_results').select('*').eq('user_id', user.id).order('timestamp', { ascending: true }),
    supabase.from('game_results').select('*').eq('user_id', user.id).order('timestamp', { ascending: true }),
  ])

  // Hydrate scan store
  if (scansRes.data && scansRes.data.length > 0) {
    const scans: ScanResult[] = scansRes.data.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      scores: r.scores as ScanResult['scores'],
      rawData: r.raw_data as ScanResult['rawData'],
      timestamp: r.timestamp as number,
    }))
    useScanStore.setState({ scans })
  }

  // Hydrate game store
  if (gamesRes.data && gamesRes.data.length > 0) {
    const gameHistory: GameResult[] = gamesRes.data.map((r: Record<string, unknown>) => ({
      gameType: r.game_type as GameResult['gameType'],
      score: r.score as number,
      metrics: r.metrics as Record<string, number>,
      timestamp: r.timestamp as number,
    }))
    useGameStore.setState({ gameHistory })
  }

  // Hydrate session store
  if (profileRes.data) {
    const p = profileRes.data
    const sessionUpdate: Record<string, unknown> = {}

    if (p.user_goal) sessionUpdate.userGoal = p.user_goal
    if (p.preferred_camera) sessionUpdate.preferredCamera = p.preferred_camera
    if (p.preferred_mic) sessionUpdate.preferredMic = p.preferred_mic
    if (p.favorite_prompts) sessionUpdate.favoritePrompts = p.favorite_prompts
    if (p.streak_days != null) sessionUpdate.streakDays = p.streak_days
    if (p.last_practice_date) sessionUpdate.lastPracticeDate = p.last_practice_date
    if (p.total_scans != null) sessionUpdate.totalScans = p.total_scans
    if (p.total_games != null) sessionUpdate.totalGames = p.total_games
    if (p.games_played) sessionUpdate.gamesPlayed = p.games_played
    if (p.earned_badges) sessionUpdate.earnedBadges = new Set(p.earned_badges)
    if (p.personal_bests) sessionUpdate.personalBests = p.personal_bests

    useSessionStore.setState(sessionUpdate)
  }
}

// ─── One-time migration from localStorage to Supabase ───

const MIGRATION_KEY = 'speechmax-migrated-to-supabase'

export async function migrateLocalStorage(userId: string) {
  if (localStorage.getItem(MIGRATION_KEY)) return

  const scanStore = useScanStore.getState()
  const gameStore = useGameStore.getState()
  const sessionStore = useSessionStore.getState()

  const hasLocalData =
    scanStore.scans.length > 0 ||
    gameStore.gameHistory.length > 0 ||
    sessionStore.totalScans > 0

  if (!hasLocalData) {
    localStorage.setItem(MIGRATION_KEY, 'true')
    return
  }

  // Migrate scans
  for (const scan of scanStore.scans) {
    await supabase.from('scan_results').upsert({
      id: scan.id,
      user_id: userId,
      scores: scan.scores,
      raw_data: scan.rawData,
      timestamp: scan.timestamp,
    })
  }

  // Migrate games
  for (const game of gameStore.gameHistory) {
    await supabase.from('game_results').insert({
      user_id: userId,
      game_type: game.gameType,
      score: game.score,
      metrics: game.metrics,
      timestamp: game.timestamp,
    })
  }

  // Migrate profile
  await supabase.from('profiles').upsert({
    id: userId,
    user_goal: sessionStore.userGoal,
    preferred_camera: sessionStore.preferredCamera,
    preferred_mic: sessionStore.preferredMic,
    favorite_prompts: sessionStore.favoritePrompts,
    streak_days: sessionStore.streakDays,
    last_practice_date: sessionStore.lastPracticeDate,
    total_scans: sessionStore.totalScans,
    total_games: sessionStore.totalGames,
    games_played: sessionStore.gamesPlayed,
    earned_badges: [...sessionStore.earnedBadges],
    personal_bests: sessionStore.personalBests,
  })

  localStorage.setItem(MIGRATION_KEY, 'true')
}

// ─── Debounced profile sync ───

let profileTimer: ReturnType<typeof setTimeout> | null = null

export function debouncedSyncProfile(partial: Record<string, unknown>) {
  if (profileTimer) clearTimeout(profileTimer)
  profileTimer = setTimeout(() => {
    syncProfile(partial)
  }, 1000)
}
