import type { QuizMode } from '@/types/navigation';

export const SCORE_PER_CORRECT_ANSWER = 10;
export const FAST_ANSWER_BONUS = 5;
export const FAST_ANSWER_THRESHOLD_MS = 3_000;
export const PERFECT_GAME_BONUS = 100;

export const QUIZ_MODE_RULES: Record<QuizMode, { questionLimit?: number; timeLimitSeconds?: number }> = {
  classic: { questionLimit: 10 },
  timeAttack: { timeLimitSeconds: 60 },
  practice: {},
  endless: {},
};
