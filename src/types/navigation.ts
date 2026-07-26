export type RootStackParamList = {
  Home: undefined;
  Quiz: { mode: QuizMode };
  Settings: undefined;
};

export type QuizMode = 'classic' | 'timeAttack' | 'practice' | 'endless';
