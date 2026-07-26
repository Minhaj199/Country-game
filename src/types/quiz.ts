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

export interface QuizSession {
  mode: QuizMode;
  status: QuizStatus;
  currentQuestion?: QuizQuestion;
  usedCountryIds: number[];
  questionNumber: number;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  timeRemainingSeconds?: number;
  answerResult?: AnswerResult;
}

export interface QuizSummary {
  score: number;
  baseScore: number;
  perfectBonus: number;
  correctAnswers: number;
  wrongAnswers: number;
  answeredQuestions: number;
}
