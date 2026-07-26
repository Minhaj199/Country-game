import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  ACHIEVEMENTS,
  COINS_PER_CORRECT_ANSWER,
  DAILY_REWARD_COINS,
  REWARDED_AD_COINS,
  XP_PER_CORRECT_ANSWER,
  type AchievementId,
} from '@/constants/player';
import type { CompletedGame, PlayerStatistics, UnlockedAchievements } from '@/types/player';
import { getLevelFromXp, getLocalDateKey } from '@/utils/playerProgress';

const initialStatistics: PlayerStatistics = {
  gamesPlayed: 0,
  highestScore: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  totalResponseTimeMs: 0,
  bestStreak: 0,
  continentCorrectAnswers: {},
};

interface PlayerState {
  coins: number;
  xp: number;
  level: number;
  statistics: PlayerStatistics;
  achievements: UnlockedAchievements;
  lastDailyRewardDate?: string;
  rewardCorrectAnswer: () => void;
  spendCoins: (amount: number) => boolean;
  claimDailyReward: () => boolean;
  claimRewardedAdPlaceholder: () => void;
  recordGame: (game: CompletedGame) => void;
}

function mergeContinentCounts(current: Record<string, number>, incoming: Record<string, number>) {
  const merged = { ...current };
  for (const [continent, count] of Object.entries(incoming)) {
    merged[continent] = (merged[continent] ?? 0) + count;
  }
  return merged;
}

function findNewAchievements(coins: number, statistics: PlayerStatistics, game?: CompletedGame): AchievementId[] {
  const continentCount = Object.keys(statistics.continentCorrectAnswers).length;
  return (Object.keys(ACHIEVEMENTS) as AchievementId[]).filter((achievement) => {
    if (achievement === 'firstWin') return statistics.correctAnswers > 0;
    if (achievement === 'hundredCorrect') return statistics.correctAnswers >= 100;
    if (achievement === 'perfectGame') return Boolean(game && game.correctAnswers > 0 && game.wrongAnswers === 0);
    if (achievement === 'thousandCoins') return coins >= 1_000;
    return continentCount >= 6;
  });
}

function addAchievements(current: UnlockedAchievements, achievementIds: AchievementId[]): UnlockedAchievements {
  const unlockedAt = new Date().toISOString();
  return achievementIds.reduce<UnlockedAchievements>((next, id) => {
    if (!next[id]) next[id] = unlockedAt;
    return next;
  }, { ...current });
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      coins: 0,
      xp: 0,
      level: 1,
      statistics: initialStatistics,
      achievements: {},
      rewardCorrectAnswer: () => {
        const nextCoins = get().coins + COINS_PER_CORRECT_ANSWER;
        const nextXp = get().xp + XP_PER_CORRECT_ANSWER;
        set((state) => ({
          coins: nextCoins,
          xp: nextXp,
          level: getLevelFromXp(nextXp),
          achievements: addAchievements(state.achievements, findNewAchievements(nextCoins, state.statistics)),
        }));
      },
      spendCoins: (amount) => {
        if (amount <= 0 || get().coins < amount) return false;
        set((state) => ({ coins: state.coins - amount }));
        return true;
      },
      claimDailyReward: () => {
        const today = getLocalDateKey();
        if (get().lastDailyRewardDate === today) return false;

        const nextCoins = get().coins + DAILY_REWARD_COINS;
        set((state) => ({
          coins: nextCoins,
          lastDailyRewardDate: today,
          achievements: addAchievements(state.achievements, findNewAchievements(nextCoins, state.statistics)),
        }));
        return true;
      },
      claimRewardedAdPlaceholder: () => {
        const nextCoins = get().coins + REWARDED_AD_COINS;
        set((state) => ({
          coins: nextCoins,
          achievements: addAchievements(state.achievements, findNewAchievements(nextCoins, state.statistics)),
        }));
      },
      recordGame: (game) => {
        set((state) => {
          const nextStatistics: PlayerStatistics = {
            gamesPlayed: state.statistics.gamesPlayed + 1,
            highestScore: Math.max(state.statistics.highestScore, game.score),
            correctAnswers: state.statistics.correctAnswers + game.correctAnswers,
            wrongAnswers: state.statistics.wrongAnswers + game.wrongAnswers,
            totalResponseTimeMs: state.statistics.totalResponseTimeMs + game.totalResponseTimeMs,
            bestStreak: Math.max(state.statistics.bestStreak, game.bestStreak),
            continentCorrectAnswers: mergeContinentCounts(state.statistics.continentCorrectAnswers, game.correctByContinent),
          };

          return {
            statistics: nextStatistics,
            achievements: addAchievements(state.achievements, findNewAchievements(state.coins, nextStatistics, game)),
          };
        });
      },
    }),
    {
      name: 'country-quest-player',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
