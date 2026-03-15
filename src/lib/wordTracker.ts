// Word alignment engine for real-time reading tracker

export const SCAN_PASSAGE = "The most effective leaders are those who can communicate their vision clearly and inspire action not through authority but through the power of their words, the confidence of their delivery, and the authenticity of their message."

export const PASSAGE_WORDS = SCAN_PASSAGE.replace(/[.,!?;:]/g, '').toLowerCase().split(/\s+/)

/**
 * Given a spoken transcript, find how many passage words have been matched.
 *
 * Strategy: try to find the longest contiguous match starting from the
 * beginning of the passage. For ambiguous common words ("the", "of", "and"),
 * require the surrounding context to confirm the match position.
 */
export function matchWordsToPassage(spokenText: string): number {
  const spoken = spokenText.replace(/[.,!?;:]/g, '').toLowerCase().split(/\s+/).filter(Boolean)
  if (spoken.length === 0) return 0

  // Try to find the best alignment by scanning spoken words against passage
  let bestPassageIdx = 0
  let passageIdx = 0
  let spokenIdx = 0

  while (spokenIdx < spoken.length && passageIdx < PASSAGE_WORDS.length) {
    const word = spoken[spokenIdx]
    const passageWord = PASSAGE_WORDS[passageIdx]

    if (wordMatch(word, passageWord)) {
      passageIdx++
      spokenIdx++
      bestPassageIdx = Math.max(bestPassageIdx, passageIdx)
      continue
    }

    // Current word doesn't match. Try to find it ahead in the passage (user skipped words).
    let found = false
    for (let ahead = 1; ahead <= 3 && passageIdx + ahead < PASSAGE_WORDS.length; ahead++) {
      const candidate = PASSAGE_WORDS[passageIdx + ahead]
      if (!wordMatch(word, candidate)) continue

      // For common words, require the NEXT spoken word to also match
      if (isCommonWord(word)) {
        const nextSpoken = spoken[spokenIdx + 1]
        const nextPassage = PASSAGE_WORDS[passageIdx + ahead + 1]
        if (nextSpoken && nextPassage && wordMatch(nextSpoken, nextPassage)) {
          passageIdx = passageIdx + ahead + 1
          spokenIdx++
          bestPassageIdx = Math.max(bestPassageIdx, passageIdx)
          found = true
          break
        }
        // Common word without context confirmation — skip this spoken word
        continue
      }

      // Non-common word: safe to jump ahead
      passageIdx = passageIdx + ahead + 1
      spokenIdx++
      bestPassageIdx = Math.max(bestPassageIdx, passageIdx)
      found = true
      break
    }

    if (!found) {
      // Spoken word doesn't match anything nearby — skip it
      spokenIdx++
    }
  }

  return bestPassageIdx
}

function wordMatch(spoken: string, passage: string): boolean {
  if (spoken === passage) return true
  // Fuzzy: first 3+ chars match (handles partial recognition)
  if (spoken.length >= 3 && passage.length >= 3) {
    const prefix = Math.min(spoken.length, passage.length, 4)
    if (spoken.slice(0, prefix) === passage.slice(0, prefix)) return true
  }
  return false
}

function isCommonWord(word: string): boolean {
  return word.length <= 3 || ['the', 'a', 'an', 'and', 'of', 'in', 'to', 'is', 'it', 'that', 'for', 'on', 'with', 'as', 'at', 'by', 'or', 'not', 'but', 'their', 'they', 'them', 'this', 'from', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'who', 'can', 'through'].includes(word)
}
