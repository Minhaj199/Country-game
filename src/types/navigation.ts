export type RootStackParamList = {
  Home: undefined;
  Quiz: { mode: QuizMode };
  Settings: undefined;
  Stats: undefined;
  Achievements: undefined;
};

export type QuizMode = 'classic' | 'timeAttack' | 'practice' | 'endless';
