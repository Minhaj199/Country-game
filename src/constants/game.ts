import type { QuizMode } from '@/types/navigation';

export const GAME_MODES: Record<QuizMode, { title: string; subtitle: string; icon: string }> = {
  classic: { title: 'Classic', subtitle: '10 questions', icon: 'flag-variant' },
  timeAttack: { title: 'Time Attack', subtitle: '60 seconds', icon: 'timer-outline' },
  practice: { title: 'Practice', subtitle: 'Learn at your pace', icon: 'school-outline' },
  endless: { title: 'Endless', subtitle: 'One life. Go far.', icon: 'infinity' },
};
