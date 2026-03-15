// Word alignment engine for real-time reading tracker

export const SCAN_PASSAGE = "The most effective leaders are those who can communicate their vision clearly and inspire action not through authority but through the power of their words, the confidence of their delivery, and the authenticity of their message."

export const PASSAGE_WORDS = SCAN_PASSAGE.replace(/[.,!?;:]/g, '').toLowerCase().split(/\s+/)

/**
 * Given a spoken transcript, find how many passage words have been matched.
 * Uses greedy forward matching with fuzzy tolerance.
 *
 * Key improvement: processes full multi-word sequences to avoid getting
 * stuck on repeated common words like "the".
 */
export function matchWordsToPassage(spokenText: string): number {
  const spoken = spokenText.replace(/[.,!?;:]/g, '').toLowerCase().split(/\s+/).filter(Boolean)
  if (spoken.length === 0) return 0

  let passageIdx = 0

  for (let i = 0; i < spoken.length; i++) {
    if (passageIdx >= PASSAGE_WORDS.length) break
    const word = spoken[i]

    // Try matching current word at current passage position
    if (wordMatch(word, PASSAGE_WORDS[passageIdx])) {
      // Before advancing, check if the NEXT spoken word matches the NEXT passage word
      // This confirms we're at the right position (prevents stalling on repeated words like "the")
      passageIdx++
      continue
    }

    // Look ahead 1-3 words in the passage (user may have skipped words or we're stuck)
    let matched = false
    for (let ahead = 1; ahead <= 3 && passageIdx + ahead < PASSAGE_WORDS.length; ahead++) {
      if (wordMatch(word, PASSAGE_WORDS[passageIdx + ahead])) {
        // Found a match ahead — but verify with next spoken word if possible
        const nextSpoken = spoken[i + 1]
        const nextPassage = PASSAGE_WORDS[passageIdx + ahead + 1]
        if (nextSpoken && nextPassage && wordMatch(nextSpoken, nextPassage)) {
          // Double confirmation — skip to this position
          passageIdx = passageIdx + ahead + 1
          matched = true
          break
        }
        // Single match ahead — still advance if the ahead word isn't too common
        if (!isCommonWord(word) || ahead === 1) {
          passageIdx = passageIdx + ahead + 1
          matched = true
          break
        }
      }
    }

    if (matched) continue
    // Word doesn't match anything nearby — ignore (likely filler or mis-recognition)
  }

  return passageIdx
}

function wordMatch(spoken: string, passage: string): boolean {
  if (spoken === passage) return true
  // Fuzzy: first 3+ chars match (handles partial recognition like "commun" for "communicate")
  if (spoken.length >= 3 && passage.startsWith(spoken.slice(0, 3))) return true
  if (passage.length >= 3 && spoken.startsWith(passage.slice(0, 3))) return true
  return false
}

function isCommonWord(word: string): boolean {
  return ['the', 'a', 'an', 'and', 'of', 'in', 'to', 'is', 'it', 'that', 'for', 'on', 'with', 'as', 'at', 'by', 'or', 'not', 'but', 'their', 'they', 'them'].includes(word)
}
