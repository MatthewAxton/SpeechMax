import type { PromptCategory } from '../analysis/types'

const PROMPTS: Record<PromptCategory, string[]> = {
  casual: [
    'Tell me about a hobby you enjoy and why it matters to you.',
    'Describe your ideal weekend and what you would do.',
    'Talk about a movie or book that changed how you think.',
    'What is something you learned recently that surprised you?',
    'If you could live anywhere in the world, where would it be and why?',
  ],
  professional: [
    'Describe a time you solved a difficult problem at work.',
    'Talk about why pace matters in communication.',
    'Explain a complex topic from your field to a complete beginner.',
    'Present your biggest professional achievement.',
    'Describe how you handle disagreements with coworkers.',
  ],
  interview: [
    'Tell me about yourself and why you are interested in this role.',
    'What is your greatest professional strength?',
    'Describe a time you faced a difficult challenge at work.',
    'Where do you see yourself in five years?',
    'Tell me about a conflict with a coworker and how you resolved it.',
  ],
}

export default PROMPTS
