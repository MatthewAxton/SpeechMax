import type { UserGoal, PromptCategory } from '../analysis/types'

/** Map user goal to the most relevant prompt category, with a game-specific fallback.
 *  Reading goal uses fallback for games (they need speaking prompts, not passages).
 *  Pass allowReading=true for RadarScan which does support reading mode. */
export function getPromptCategory(userGoal: UserGoal | null, fallback: PromptCategory, allowReading = false): PromptCategory {
  if (!userGoal) return fallback
  if (userGoal === 'reading' && !allowReading) return fallback
  const map: Record<UserGoal, PromptCategory> = {
    interview: 'interview',
    presentation: 'professional',
    casual: 'casual',
    reading: 'reading',
  }
  return map[userGoal]
}

/** Friendly label for the prompt category shown in GameIntro */
export function getPromptLabel(category: PromptCategory): string {
  const labels: Record<PromptCategory, string> = {
    interview: 'Interview Question',
    professional: 'Professional Prompt',
    casual: 'Freestyle',
    reading: 'Read Aloud',
  }
  return labels[category]
}
