import type { Country } from '@/types/country';
import type { QuizMode } from '@/types/navigation';

export type QuizStatus = 'playing' | 'answered' | 'complete' | 'unavailable';

export interface QuizQuestion {
  id: string;
  correctCountry: Country;
  options: Country[];
}

export interface AnswerResult {
  selectedCountryId: number;
  correct: boolean;
  pointsAwarded: number;
  fastBonusAwarded: boolean;
  responseTimeMs: number;
}

export type HintType = 'fiftyFifty' | 'skip' | 'firstLetter';

export interface QuizSession {
  mode: QuizMode;
  status: QuizStatus;
  currentQuestion?: QuizQuestion;
  usedCountryIds: number[];
  questionNumber: number;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  lives: number;
  streak: number;
  timeRemainingSeconds?: number;
  answerResult?: AnswerResult;
  eliminatedOptionIds: number[];
  firstLetterRevealed: boolean;
}

export interface QuizSummary {
  score: number;
  baseScore: number;
  perfectBonus: number;
  correctAnswers: number;
  wrongAnswers: number;
  answeredQuestions: number;
}
