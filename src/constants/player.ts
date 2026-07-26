export const STARTING_LIVES = 3;
export const COINS_PER_CORRECT_ANSWER = 5;
export const XP_PER_CORRECT_ANSWER = 10;
export const XP_PER_LEVEL = 100;
export const DAILY_REWARD_COINS = 100;
export const REWARDED_AD_COINS = 25;

export const HINT_COSTS = {
  fiftyFifty: 25,
  skip: 20,
  firstLetter: 15,
} as const;

export const ACHIEVEMENTS = {
  firstWin: { title: 'First Win', description: 'Answer a question correctly.' },
  hundredCorrect: { title: 'Worldly Wise', description: 'Answer 100 questions correctly.' },
  perfectGame: { title: 'Flawless', description: 'Complete a game without a wrong answer.' },
  thousandCoins: { title: 'Treasure Hoard', description: 'Collect 1,000 coins.' },
  everyContinent: { title: 'Globetrotter', description: 'Answer correctly from every continent.' },
} as const;

export type AchievementId = keyof typeof ACHIEVEMENTS;
