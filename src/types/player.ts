import type { AchievementId } from '@/constants/player';

export interface PlayerStatistics {
  gamesPlayed: number;
  highestScore: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalResponseTimeMs: number;
  bestStreak: number;
  continentCorrectAnswers: Record<string, number>;
}

export interface CompletedGame {
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalResponseTimeMs: number;
  bestStreak: number;
  correctByContinent: Record<string, number>;
}

export type UnlockedAchievements = Partial<Record<AchievementId, string>>;
