import type { DifficultySelection } from '@/types/country';

export type RootStackParamList = {
  Home: undefined;
  Quiz: { mode: QuizMode; difficulty: DifficultySelection };
  Settings: undefined;
  Stats: undefined;
  Achievements: undefined;
};

export type QuizMode = 'classic' | 'timeAttack' | 'practice' | 'endless';
